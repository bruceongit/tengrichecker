/**
 * S3 bucket integration for Honey Pot Tracker
 * Uploads files to S3 and tracks metadata in PostgreSQL
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import zlib from 'zlib';
import { createHash, randomBytes, webcrypto } from 'crypto';

// Detect if running in browser or Node.js
const isBrowser = typeof window !== 'undefined';
const crypto = isBrowser ? window.crypto : webcrypto;

// Get crypto.subtle (browser) or Node.js crypto.subtle
const subtleCrypto = isBrowser ? window.crypto.subtle : webcrypto.subtle;

// S3 client configuration
const s3Config = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    } : undefined,
};

export const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tengrichecker-honey-data';
const ENCRYPTION_KEY = process.env.S3_ENCRYPTION_KEY;

// Ensure bucket exists
export async function ensureBucketExists() {
    try {
        await s3Client.headBucket({ Bucket: BUCKET_NAME });
        console.log(`[S3] Bucket "${BUCKET_NAME}" is accessible`);
        return true;
    } catch (error) {
        if (error.Code === '404' || error.Code === 'Forbidden') {
            console.log(`[S3] Creating bucket "${BUCKET_NAME}"...`);
            try {
                await s3Client.createBucket({ Bucket: BUCKET_NAME });
                console.log(`[S3] Bucket "${BUCKET_NAME}" created successfully`);
                return true;
            } catch (createError) {
                console.error('[S3] Error creating bucket:', createError);
                return false;
            }
        }
        console.error('[S3] Error accessing bucket:', error);
        return false;
    }
}

// Encrypt data before upload (works in both browser and Node.js)
export async function encryptData(data, key = ENCRYPTION_KEY) {
    if (!key) return { data, encrypted: false };

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();

    // Derive key from password using PBKDF2 (browser-compatible)
    const salt = encoder.encode('tengrichecker-salt-2025');
    const iterations = 100000;

    const keyMaterial = await subtleCrypto.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const cryptoKey = await subtleCrypto.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    const iv = isBrowser
        ? window.crypto.getRandomValues(new Uint8Array(12))
        : randomBytes(12);
    const encryptedContent = await subtleCrypto.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoder.encode(dataString)
    );

    const encryptedData = {
        iv: Array.from(iv),
        content: Array.from(new Uint8Array(encryptedContent)),
        encrypted: true,
        timestamp: new Date().toISOString(),
    };

    return {
        data: JSON.stringify(encryptedData),
        metadata: { encryption: 'AES-256-GCM', originalLength: dataString.length },
    };
}

// Decrypt data after download (works in both browser and Node.js)
export async function decryptData(encryptedData, key = ENCRYPTION_KEY) {
    if (!key || !encryptedData.encrypted) return encryptedData;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const iv = new Uint8Array(encryptedData.iv);
    const content = new Uint8Array(encryptedData.content);

    const keyMaterial = await subtleCrypto.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const cryptoKey = await subtleCrypto.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('tengrichecker-salt-2025'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    const decryptedContent = await subtleCrypto.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        content
    );

    return JSON.parse(decoder.decode(decryptedContent));
}

// Upload file to S3
export async function uploadFile(options) {
    const {
        visitorId,
        fileType = 'application/octet-stream',
        fileBuffer,
        filePath,
        metadata = {},
        encrypt = true,
    } = options;

    const key = `${visitorId}/${filePath || `${Date.now()}.${fileType.split('/')[1] || 'data'}`}`;

    // Encrypt if enabled
    let finalBuffer = fileBuffer;
    let encryptionMeta = {};

    if (encrypt && ENCRYPTION_KEY) {
        const encrypted = encryptData(fileBuffer, ENCRYPTION_KEY);
        finalBuffer = encrypted.data;
        encryptionMeta = encrypted.metadata;
    }

    // Create upload params
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: finalBuffer,
        ContentType: fileType,
        Metadata: {
            visitorId,
            ...metadata,
            ...encryptionMeta,
        },
    };

    // Upload with progress
    const upload = new Upload({
        client: s3Client,
        params,
    });

    upload.on('httpUploadProgress', (progress) => {
        console.log(`[S3] Uploading ${key}: ${progress.loaded / 1024 / 1024} MB`);
    });

    try {
        const result = await upload.done();
        console.log(`[S3] Uploaded ${key} to ${BUCKET_NAME}`);

        return {
            success: true,
            key,
            etag: result.ETag,
            size: fileBuffer.length,
            versionId: result.VersionId,
        };
    } catch (error) {
        console.error('[S3] Upload error:', error);
        throw error;
    }
}

// Upload base64-encoded file (for photos, audio, etc.)
export async function uploadBase64File(options) {
    const { visitorId, fileName, base64Data, fileType, metadata = {} } = options;

    // Decode base64
    const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const buffer = Buffer.from(byteArray);

    // Add file type if not provided
    const finalFileType = fileType || 'application/octet-stream';

    return uploadFile({
        visitorId,
        fileType: finalFileType,
        fileBuffer: buffer,
        filePath: fileName,
        metadata: { ...metadata, isBase64: true },
    });
}

// Get file from S3
export async function getFile(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.getObject(command);
        const body = await response.Body.transformToString();

        // Decrypt if marked as encrypted
        let data = body;
        if (response.Metadata?.encrypted === 'true') {
            data = decryptData(JSON.parse(body), ENCRYPTION_KEY);
        }

        return {
            data,
            contentType: response.ContentType,
            metadata: response.Metadata,
        };
    } catch (error) {
        console.error(`[S3] Error getting file ${key}:`, error);
        throw error;
    }
}

// Generate presigned URL for direct browser upload/download
export async function getPresignedUrl(options) {
    const { key, method = 'GET', expiresIn = 3600 } = options;

    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
    };

    return getSignedUrl(s3Client, new PutObjectCommand(params), { expiresIn });
}

// List files for a visitor
export async function listVisitorFiles(visitorId, prefix = '') {
    const listKey = `${visitorId}/${prefix}`.replace(/\/+$/, '') + '/';

    try {
        const response = await s3Client.listObjectsV2({
            Bucket: BUCKET_NAME,
            Prefix: listKey,
        });

        return {
            files: response.Contents?.map(c => ({
                key: c.Key,
                size: c.Size,
                lastModified: c.LastModified,
                etag: c.ETag,
            })) || [],
            totalCount: response.Contents?.length || 0,
        };
    } catch (error) {
        console.error(`[S3] Error listing files for ${visitorId}:`, error);
        throw error;
    }
}

// Delete file from S3
export async function deleteFile(key) {
    try {
        await s3Client.deleteObject({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        console.log(`[S3] Deleted ${key}`);
        return true;
    } catch (error) {
        console.error(`[S3] Error deleting ${key}:`, error);
        throw error;
    }
}

// Compress data before upload (gzip)
export function compressData(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return zlib.gzipSync(buffer);
}

// Decompress data after download
export function decompressData(data) {
    return zlib.gunzipSync(data);
}

export default {
    s3Client,
    ensureBucketExists,
    encryptData,
    decryptData,
    uploadFile,
    uploadBase64File,
    getFile,
    getPresignedUrl,
    listVisitorFiles,
    deleteFile,
    compressData,
    decompressData,
};
