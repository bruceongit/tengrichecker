/**
 * Honey Pot Backend API for TengriChecker
 * Collects visitor data from the honey pot tracker
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encryptData, decryptData, compressData, decompressData } from './s3.js';
import * as db from './db.js';
import * as s3 from './s3.js';
import * as auth from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.HONEY_POT_PORT || 3001;
const DATA_DIR = process.env.HONEY_POT_DATA || path.join(__dirname, 'honey-data');
const USE_POSTGRES = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const USE_S3 = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for tracking
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Signature'],
    maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory store for active sessions
const activeSessions = new Map();

// Logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
    });
    next();
});

// Decrypt middleware for encrypted payloads
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        if (req.headers['content-type'] === 'application/encrypted') {
            req.rawBody = buf;
        }
    },
}));

// Health check endpoint
app.get('/health', async (req, res) => {
    const postgresStatus = USE_POSTGRES ? 'connected' : 'disabled';
    const s3Status = USE_S3 ? 'connected' : 'disabled';

    res.json({
        status: 'healthy',
        service: 'TengriChecker Honey Pot',
        timestamp: new Date().toISOString(),
        sessionsActive: activeSessions.size,
        dataDir: DATA_DIR,
        features: {
            postgres: {
                enabled: USE_POSTGRES,
                status: postgresStatus,
            },
            s3: {
                enabled: USE_S3,
                status: s3Status,
                bucket: process.env.S3_BUCKET_NAME,
            },
            encryption: {
                enabled: !!process.env.S3_ENCRYPTION_KEY,
                algorithm: 'AES-256-GCM',
            },
        },
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TengriChecker Honey Pot Tracker',
        version: '2.0.0',
        endpoints: {
            log: 'POST /api/honey-log',
            events: 'POST /api/honey-events',
            visitors: 'GET /api/visitors',
            stats: 'GET /api/stats',
            forensics: 'POST /api/honey-forensics',
            xAssociation: 'POST /api/honey-x-association',
        },
        features: [
            'ip-lookup',
            'geolocation',
            'fingerprinting',
            'behavior-tracking',
            'phone-forensics',
            'x-association',
            'postgresql-storage',
            's3-blob-storage',
            'jwt-authentication',
            'encrypted-payloads',
        ],
    });
});

// Authentication middleware for protected endpoints
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    const signature = req.headers['x-signature'];

    // Check JWT token
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const verified = await auth.verifyToken(token);
        req.auth = { token, verified };
    }

    // Verify HMAC signature if provided
    if (signature && req.rawBody) {
        const secret = process.env.SIGNING_SECRET || process.env.JWT_SECRET || 'tengrichecker-signing-key';
        const encoder = new TextEncoder();
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        const providedSig = Uint8Array.from(signature.split(','), c => parseInt(c));
        const expectedSig = await window.crypto.subtle.sign(
            { name: 'HMAC', hash: 'SHA-256' },
            cryptoKey,
            req.rawBody
        );

        const isMatch = providedSig.length === expectedSig.length &&
            providedSig.every((val, i) => val === expectedSig[i]);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid signature',
                message: 'Request payload has been modified',
            });
        }
    }

    next();
};

// Log incoming visitor data
app.post('/api/honey-log', async (req, res) => {
    try {
        let visitorData = req.body;

        // Decrypt if encrypted
        if (req.headers['content-type'] === 'application/encrypted') {
            visitorData = decryptData(visitorData);
            req.body = visitorData;
        }

        const visitorId = visitorData.visitorId || visitorData.id || auth.generateVisitorId();
        const sessionId = visitorData.sessionId || visitorData.session || auth.generateSessionId();

        // Generate auth token for this visitor
        const token = auth.generateVisitorToken(visitorId, sessionId, {
            device: visitorData.system?.device,
            ip: visitorData.ip,
        });

        // Determine IP
        const ip = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.ip ||
            'unknown';

        // Create log entry
        const logEntry = {
            visitorId,
            sessionId,
            timestamp: new Date().toISOString(),
            ip,
            userAgent: visitorData.userAgent || req.headers['user-agent'] || 'unknown',
            referrer: visitorData.referrer || req.headers.referer || req.headers.referrer || 'direct',
            page: visitorData.page || {},
            location: visitorData.ip || {},
            geolocation: visitorData.geolocation || {},
            fingerprint: visitorData.fingerprint || {},
            network: visitorData.network || {},
            behavioral: visitorData.behavioral || {},
            system: visitorData.system || {},
            timing: visitorData.timing || {},
            visitNumber: visitorData.visitNumber || 1,
        };

        // Save to file (fallback)
        const dateDir = new Date().toISOString().split('T')[0];
        const datePath = path.join(DATA_DIR, dateDir);

        if (!fs.existsSync(datePath)) {
            fs.mkdirSync(datePath, { recursive: true });
        }

        const filePath = path.join(datePath, `${visitorId}_${sessionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));

        // Save to PostgreSQL if enabled
        if (USE_POSTGRES) {
            try {
                await db.insertVisitor({
                    ...logEntry,
                    token,
                    extra: {
                        s3Enabled: USE_S3,
                        encrypted: req.headers['content-type'] === 'application/encrypted',
                    },
                });
                console.log(`[DB] Saved visitor ${visitorId} to PostgreSQL`);
            } catch (dbError) {
                console.error('[DB] PostgreSQL save error:', dbError);
            }
        }

        // Save to S3 if enabled
        if (USE_S3 && USE_S3 !== 'false') {
            try {
                const buffer = Buffer.from(JSON.stringify(logEntry));
                const compressed = compressData(buffer);
                await s3.uploadFile({
                    visitorId,
                    filePath: `${dateDir}/${visitorId}_${sessionId}.json`,
                    fileBuffer: compressed,
                    fileType: 'application/json',
                    metadata: { source: 'honey-log', encrypted: 'true' },
                });
                console.log(`[S3] Uploaded visitor ${visitorId} to S3`);
            } catch (s3Error) {
                console.error('[S3] S3 upload error:', s3Error);
            }
        }

        // Add to active sessions
        activeSessions.set(visitorId, {
            ...logEntry,
            lastActive: new Date().toISOString(),
            token,
        });

        console.log(`Honey Pot: Logged visitor ${visitorId} from ${logEntry.location.details?.city || 'Unknown'}`);

        res.status(201).json({
            status: 'logged',
            visitorId,
            sessionId,
            token,
            savedTo: filePath,
        });
    } catch (error) {
        console.error('Error logging visitor:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Log events from the honey pot
app.post('/api/honey-events', authenticate, (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const visitorId = req.query.visitorId || req.body.visitorId || req.body.id || 'anonymous';

    events.forEach(async (event) => {
        const eventLog = {
            visitorId,
            timestamp: event.timestamp || new Date().toISOString(),
            type: event.type,
            details: event.details || {},
        };

        // Save to file
        const eventDir = path.join(DATA_DIR, 'events');
        if (!fs.existsSync(eventDir)) {
            fs.mkdirSync(eventDir, { recursive: true });
        }

        const eventFile = path.join(eventDir, `${visitorId}_events.json`);
        let eventsData = [];

        if (fs.existsSync(eventFile)) {
            eventsData = JSON.parse(fs.readFileSync(eventFile));
        }

        eventsData.push(eventLog);
        fs.writeFileSync(eventFile, JSON.stringify(eventsData, null, 2));

        // Save to PostgreSQL
        if (USE_POSTGRES) {
            try {
                await db.insertEvent({
                    visitorId,
                    sessionId: event.sessionId,
                    type: event.type,
                    details: event.details,
                });
            } catch (dbError) {
                console.error('[DB] Event save error:', dbError);
            }
        }
    });

    res.status(201).json({
        status: 'events_logged',
        count: events.length,
        visitorId,
    });
});

// Log phone forensics data
app.post('/api/honey-forensics', authenticate, async (req, res) => {
    const forensicsData = req.body;
    const visitorId = forensicsData.visitorId || req.query.visitorId || auth.generateVisitorId();
    const sessionId = forensicsData.sessionId || req.query.sessionId || auth.generateSessionId();
    const forensicsType = forensicsData.type || 'phone_forensics';

    // Save to file
    const dateDir = new Date().toISOString().split('T')[0];
    const forensicsDir = path.join(DATA_DIR, dateDir, 'forensics');
    if (!fs.existsSync(forensicsDir)) {
        fs.mkdirSync(forensicsDir, { recursive: true });
    }

    const filePath = path.join(forensicsDir, `${visitorId}_${sessionId}_${forensicsType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(forensicsData, null, 2));

    // Save to PostgreSQL
    if (USE_POSTGRES) {
        try {
            await db.insertForensics({
                visitorId,
                sessionId,
                type: forensicsType,
                data: forensicsData,
            });
            console.log(`[DB] Saved forensics for ${visitorId}`);
        } catch (dbError) {
            console.error('[DB] Forensics save error:', dbError);
        }
    }

    // Save to S3 if enabled
    if (USE_S3 && USE_S3 !== 'false') {
        try {
            const buffer = Buffer.from(JSON.stringify(forensicsData));
            const compressed = compressData(buffer);
            await s3.uploadFile({
                visitorId,
                filePath: `${dateDir}/forensics/${visitorId}_${sessionId}_${forensicsType}.json`,
                fileBuffer: compressed,
                fileType: 'application/json',
                metadata: { type: forensicsType, encrypted: 'true' },
            });
            console.log(`[S3] Uploaded forensics for ${visitorId}`);
        } catch (s3Error) {
            console.error('[S3] Forensics upload error:', s3Error);
        }
    }

    res.status(201).json({
        status: 'forensics_logged',
        visitorId,
        sessionId,
        type: forensicsType,
        savedTo: filePath,
    });
});

// Log X/Twitter association data
app.post('/api/honey-x-association', authenticate, async (req, res) => {
    const xData = req.body;
    const visitorId = xData.visitorId || req.query.visitorId || auth.generateVisitorId();
    const sessionId = xData.sessionId || req.query.sessionId || auth.generateSessionId();

    const dateDir = new Date().toISOString().split('T')[0];
    const xDir = path.join(DATA_DIR, dateDir, 'x_associations');
    if (!fs.existsSync(xDir)) {
        fs.mkdirSync(xDir, { recursive: true });
    }

    const filePath = path.join(xDir, `${visitorId}_${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(xData, null, 2));

    // Save to PostgreSQL
    if (USE_POSTGRES) {
        try {
            await db.insertXAssociation({
                visitorId,
                sessionId,
                xUserId: xData.xUserId,
                xUsername: xData.xUsername,
                followersCount: xData.followersCount,
                followingCount: xData.followingCount,
                isVerified: xData.isVerified,
                engagementScore: xData.engagementScore,
            });
            console.log(`[DB] Saved X association for ${visitorId}`);
        } catch (dbError) {
            console.error('[DB] X association save error:', dbError);
        }
    }

    res.status(201).json({
        status: 'x_association_logged',
        visitorId,
        sessionId,
        savedTo: filePath,
    });
});

// Get all logged visitors
app.get('/api/visitors', async (req, res) => {
    const dateFilter = req.query.date || new Date().toISOString().split('T')[0];
    const datePath = path.join(DATA_DIR, dateFilter);

    let visitors = [];

    if (fs.existsSync(datePath)) {
        const files = fs.readdirSync(datePath);
        visitors = files
            .filter((f) => f.endsWith('.json'))
            .map((f) => {
                const filePath = path.join(datePath, f);
                return JSON.parse(fs.readFileSync(filePath));
            });
    }

    // Add active sessions
    const active = Array.from(activeSessions.entries()).map(([id, data]) => ({
        ...data,
        isActive: true,
    }));

    res.json({
        date: dateFilter,
        loggedVisitors: visitors.length,
        activeVisitors: active.length,
        visitors: [...active, ...visitors],
    });
});

// Get visitor by ID
app.get('/api/visitors/:id', async (req, res) => {
    const { id } = req.params;
    let visitorData = null;

    if (activeSessions.has(id)) {
        visitorData = activeSessions.get(id);
    } else {
        const dateDirs = fs.readdirSync(DATA_DIR).filter((d) => fs.statSync(path.join(DATA_DIR, d)).isDirectory());

        for (const dateDir of dateDirs) {
            const filePath = path.join(DATA_DIR, dateDir, `${id}.json`);
            if (fs.existsSync(filePath)) {
                visitorData = JSON.parse(fs.readFileSync(filePath));
                break;
            }
        }
    }

    if (visitorData) {
        res.json(visitorData);
    } else {
        res.status(404).json({ error: 'Visitor not found', id });
    }
});

// Get summary statistics
app.get('/api/stats', async (req, res) => {
    const stats = {
        totalVisitors: 0,
        activeVisitors: activeSessions.size,
        byDay: {},
        byLocation: {},
        byBrowser: {},
        byDevice: {},
        geolocationSuccess: 0,
        geolocationFailed: 0,
        vpnUsers: 0,
        phoneForensics: 0,
        xAssociations: 0,
        timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    };

    const dateDirs = fs.readdirSync(DATA_DIR).filter((d) => fs.statSync(path.join(DATA_DIR, d)).isDirectory());

    for (const dateDir of dateDirs) {
        const datePath = path.join(DATA_DIR, dateDir);
        const files = fs.readdirSync(datePath).filter((f) => f.endsWith('.json'));
        stats.byDay[dateDir] = files.length;
        stats.totalVisitors += files.length;

        for (const file of files) {
            const filePath = path.join(datePath, file);
            const data = JSON.parse(fs.readFileSync(filePath));

            // Count by location
            const country = data.location?.details?.country || 'Unknown';
            stats.byLocation[country] = (stats.byLocation[country] || 0) + 1;

            // Count by browser
            const browser = data.fingerprint?.browser?.name || 'Unknown';
            stats.byBrowser[browser] = (stats.byBrowser[browser] || 0) + 1;

            // Count by device
            const device = data.system?.screen ? 'desktop' : 'mobile';
            stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;

            // Count geolocation
            if (data.geolocation) {
                if (data.geolocation.coords) {
                    stats.geolocationSuccess++;
                } else if (data.geolocation.error) {
                    stats.geolocationFailed++;
                }
            }

            // Count VPN users
            if (data.network?.vpnDetection?.isVPNDomain || data.network?.vpnDetection?.likelyVPNNetwork) {
                stats.vpnUsers++;
            }

            // Count phone forensics
            if (data.phoneForensics || data.type === 'phone_forensics' || data.germanSignals) {
                stats.phoneForensics++;
            }

            // Time of day analysis
            const hour = new Date(data.timestamp).getHours();
            if (hour >= 5 && hour < 12) stats.timeOfDay.morning++;
            else if (hour >= 12 && hour < 17) stats.timeOfDay.afternoon++;
            else if (hour >= 17 && hour < 21) stats.timeOfDay.evening++;
            else stats.timeOfDay.night++;
        }

        // Count phone forensics files
        const forensicsPath = path.join(datePath, 'forensics');
        if (fs.existsSync(forensicsPath)) {
            const forensicsFiles = fs.readdirSync(forensicsPath);
            stats.phoneForensics += forensicsFiles.length;
        }

        // Count X association files
        const xPath = path.join(datePath, 'x_associations');
        if (fs.existsSync(xPath)) {
            const xFiles = fs.readdirSync(xPath);
            stats.xAssociations += xFiles.length;
        }
    }

    // Add PostgreSQL stats if enabled
    if (USE_POSTGRES) {
        try {
            const dbStats = await db.getStats();
            stats.totalVisitors += dbStats.totalVisitors || 0;
            stats.phoneForensics += dbStats.phoneForensics || 0;
            stats.xAssociations += dbStats.xAssociations || 0;
        } catch (dbError) {
            console.error('[DB] Stats error:', dbError);
        }
    }

    res.json(stats);
});

// Initialize database and S3 on startup
async function initializeServices() {
    console.log('[Startup] Initializing services...');

    // Initialize database
    if (USE_POSTGRES) {
        try {
            await db.initDB();
            console.log('[Startup] Database initialized');
        } catch (error) {
            console.error('[Startup] Database initialization error:', error);
        }
    }

    // Initialize S3
    if (USE_S3 && USE_S3 !== 'false') {
        try {
            await s3.ensureBucketExists();
            console.log('[Startup] S3 initialized');
        } catch (error) {
            console.error('[Startup] S3 initialization error:', error);
        }
    }

    console.log('[Startup] Services initialized successfully');
}

// Start server
console.log(`[Startup] Starting server on port ${PORT}...`);
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        TENGRI CHECKER SERVER ACTIVE                        ║
╠════════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                              ║
║  Data Dir:    ${DATA_DIR}                                        ║
║  Postgres:    ${USE_POSTGRES ? 'ENABLED' : 'DISABLED'}                                       ║
║  S3:          ${USE_S3 ? 'ENABLED' : 'DISABLED'}                                       ║
║  Encryption:  ${process.env.S3_ENCRYPTION_KEY ? 'AES-256-GCM' : 'OFF'}                                       ║
║  Static:      / (Astro dist)                                ║
║  API:         /api/*                                         ║
╚════════════════════════════════════════════════════════════╝
`);
    console.log(`Server is ready to serve requests...`);
    console.log(`[Startup] Server listening on port ${PORT}`);

    // Initialize services
    try {
        await initializeServices();
        console.log('[Startup] Services initialized successfully');
    } catch (initError) {
        console.error('[Startup] Service initialization error:', initError);
    }

    // Schedule daily archival if enabled
    if (process.env.ENABLE_ARCHIVE !== 'false') {
        scheduleDailyArchive();
    }
});

// Daily archival to S3 cold storage
function scheduleDailyArchive() {
    const ARCHIVE_HOUR = parseInt(process.env.ARCHIVE_HOUR) || 2; // 2 AM local

    console.log(`[Archive] Scheduling daily archive at ${ARCHIVE_HOUR}:00`);

    // Archive function
    async function runArchive() {
        console.log(`[Archive] Starting daily archive...`);

        const today = new Date().toISOString().split('T')[0];
        const archivePath = path.join(DATA_DIR, today);

        if (!fs.existsSync(archivePath)) {
            console.log(`[Archive] No data to archive for ${today}`);
            return;
        }

        // Archive files to S3 if enabled
        if (USE_S3 && USE_S3 !== 'false') {
            try {
                const files = fs.readdirSync(archivePath);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(archivePath, file);
                        const buffer = fs.readFileSync(filePath);
                        const compressed = s3.compressData(buffer);

                        await s3.uploadFile({
                            visitorId: file.replace('.json', ''),
                            filePath: `archive/${today}/${file}`,
                            fileBuffer: compressed,
                            fileType: 'application/json',
                            metadata: { archive: 'daily', compressed: 'true' },
                        });
                    }
                }
                console.log(`[Archive] Archived ${files.length} files to S3`);
            } catch (error) {
                console.error('[Archive] S3 archive error:', error);
            }
        }

        // Update PostgreSQL archive table
        if (USE_POSTGRES) {
            try {
                const archiveEntry = {
                    date: today,
                    filesArchived: fs.readdirSync(archivePath).length,
                    path: archivePath,
                    metadata: { completedAt: new Date().toISOString() },
                };

                await db.pool.query(
                    `INSERT INTO archives (date, files_archived, path, metadata)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (date) DO UPDATE SET
                         files_archived = EXCLUDED.files_archived,
                         path = EXCLUDED.path,
                         completed_at = CURRENT_TIMESTAMP`,
                    [
                        today,
                        archiveEntry.filesArchived,
                        archiveEntry.path,
                        JSON.stringify(archiveEntry.metadata),
                    ]
                );
                console.log('[Archive] Archived to PostgreSQL');
            } catch (error) {
                console.error('[Archive] PostgreSQL archive error:', error);
            }
        }

        console.log(`[Archive] Daily archive completed for ${today}`);
    }

    // Run archive at scheduled time each day
    function scheduleNextArchive() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(ARCHIVE_HOUR, 0, 0, 0);

        const msUntilArchive = tomorrow.getTime() - now.getTime();

        console.log(`[Archive] Next archive in ${Math.round(msUntilArchive / 1000 / 60)} minutes`);

        setTimeout(() => {
            runArchive();
            // Schedule next day's archive
            scheduleNextArchive();
        }, msUntilArchive);
    }

    // Start the archive schedule
    scheduleNextArchive();
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Expose the app for Railway to use
export { app };
