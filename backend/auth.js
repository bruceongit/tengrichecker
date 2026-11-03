/**
 * JWT authentication middleware for Honey Pot API
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';
import { webcrypto } from 'crypto';

// Detect if running in browser or Node.js
const isBrowser = typeof window !== 'undefined';
const crypto = isBrowser ? window.crypto : webcrypto;
const subtleCrypto = crypto.subtle;

const JWK_SET = process.env.JWT_JWK_SET_URL
    ? createRemoteJWKSet(new URL(process.env.JWT_JWK_SET_URL))
    : null;

const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'tengrichecker-honey-secret-key';

// Generate a JWT token for a visitor
export function generateVisitorToken(visitorId, sessionId, payload = {}) {
    const encoder = new TextEncoder();
    const secret = encoder.encode(SECRET_KEY);

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        visitorId,
        sessionId,
        iat: now,
        exp: now + 365 * 24 * 60 * 60, // 1 year expiry
        ...payload,
    };

    const signed = new TextDecoder().decode(
        signJWT(tokenPayload, secret)
    );

    return signed;
}

// Sign JWT using ES256
async function signJWT(payload, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));

    // Import key
    const key = await subtleCrypto.importKey(
        'raw',
        secret,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    // Sign
    const signature = await subtleCrypto.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        data
    );

    // Create token structure (simplified)
    const header = { alg: 'ES256', typ: 'JWT' };
    const headerB64 = isBrowser ? btoa(JSON.stringify(header)) : Buffer.from(JSON.stringify(header)).toString('base64');
    const payloadB64 = isBrowser ? btoa(JSON.stringify(payload)) : Buffer.from(JSON.stringify(payload)).toString('base64');
    const signatureB64 = isBrowser ? btoa(String.fromCharCode(...new Uint8Array(signature))) : Buffer.from(signature).toString('base64');

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Verify JWT token
export async function verifyToken(token) {
    try {
        // Try JWK set if available
        if (JWK_SET) {
            return await jwtVerify(token, JWK_SET);
        }

        // Fallback to secret-based verification
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const header = JSON.parse(decoder.decode(isBrowser ? atob(headerB64) : Buffer.from(headerB64, 'base64').toString()));
        const payload = JSON.parse(decoder.decode(isBrowser ? atob(payloadB64) : Buffer.from(payloadB64, 'base64').toString()));
        const signature = Uint8Array.from(isBrowser ? atob(signatureB64) : Buffer.from(signatureB64, 'base64').toString(), c => c.charCodeAt(0));

        // Verify signature
        const secret = encoder.encode(SECRET_KEY);
        const key = await subtleCrypto.importKey(
            'raw',
            secret,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['verify']
        );

        const data = encoder.encode(`${headerB64}.${payloadB64}`);
        const valid = await subtleCrypto.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            key,
            signature,
            data
        );

        return {
            payload,
            valid,
            header,
            iat: payload.iat,
            exp: payload.exp,
        };
    } catch (error) {
        console.error('[JWT] Verification error:', error);
        return { valid: false, error: error.message };
    }
}

// Extract visitor info from token
export function extractVisitorInfo(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;

        const payload = JSON.parse(isBrowser ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString());
        return {
            visitorId: payload.visitorId || payload.sub,
            sessionId: payload.sessionId,
            payload,
        };
    } catch (error) {
        return null;
    }
}

// Authentication middleware
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];

    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const verified = verifyToken(token);
        req.auth = { token, verified };
    }

    next();
}

// Protected route decorator
export function withAuth(handler) {
    return async (req, res) => {
        const authHeader = req.headers.authorization || req.headers['x-auth-token'];

        if (!authHeader) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        const verified = await verifyToken(token);

        if (!verified.valid) {
            return res.status(401).json({
                error: 'Invalid token',
                message: verified.error || 'Token verification failed',
            });
        }

        req.auth = verified;
        return handler(req, res);
    };
}

// Generate secret key if not provided
export function generateSecretKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = isBrowser ? btoa(String.fromCharCode(...array)) : Buffer.from(array).toString('base64');
    return secret;
}

export default {
    generateVisitorToken,
    verifyToken,
    extractVisitorInfo,
    authMiddleware,
    withAuth,
    generateSecretKey,
};
