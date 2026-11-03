/**
 * Honey Pot Backend API for TengriChecker
 * Collects visitor data from the honey pot tracker
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.HONEY_POT_PORT || 3000;
const DATA_DIR = process.env.HONEY_POT_DATA || path.join(__dirname, 'honey-data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for tracking
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '5mb' }));
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'TengriChecker Honey Pot',
        timestamp: new Date().toISOString(),
        sessionsActive: activeSessions.size,
        dataDir: DATA_DIR
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TengriChecker Honey Pot Tracker',
        version: '1.0.0',
        endpoints: {
            log: '/api/honey-log',
            events: '/api/honey-events',
            visitors: '/api/visitors',
            stats: '/api/stats',
            forensics: '/api/honey-forensics',
            xAssociation: '/api/honey-x-association'
        },
        features: [
            'ip-lookup',
            'geolocation',
            'fingerprinting',
            'behavior-tracking',
            'phone-forensics',
            'x-association'
        ]
    });
});

// Log incoming visitor data
app.post('/api/honey-log', async (req, res) => {
    try {
        const visitorData = req.body;
        const visitorId = visitorData.visitorId || visitorData.id || generateVisitorId();
        const sessionId = visitorData.sessionId || visitorData.session || generateSessionId();

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
            visitNumber: visitorData.visitNumber || 1
        };

        // Save to file
        const dateDir = new Date().toISOString().split('T')[0];
        const datePath = path.join(DATA_DIR, dateDir);

        if (!fs.existsSync(datePath)) {
            fs.mkdirSync(datePath, { recursive: true });
        }

        const filePath = path.join(datePath, `${visitorId}_${sessionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));

        // Add to active sessions
        activeSessions.set(visitorId, {
            ...logEntry,
            lastActive: new Date().toISOString()
        });

        console.log(`Honey Pot: Logged visitor ${visitorId} from ${logEntry.location.details?.city || 'Unknown'}`);

        res.status(201).json({
            status: 'logged',
            visitorId,
            sessionId,
            savedTo: filePath
        });

    } catch (error) {
        console.error('Error logging visitor:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Log events from the honey pot
app.post('/api/honey-events', (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const visitorId = req.query.visitorId || req.body.visitorId || req.body.id || 'anonymous';

    events.forEach(event => {
        const eventLog = {
            visitorId,
            timestamp: event.timestamp || new Date().toISOString(),
            type: event.type,
            details: event.details || {}
        };

        // Save event
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
    });

    res.status(201).json({
        status: 'events_logged',
        count: events.length,
        visitorId
    });
});

// Log phone forensics data
app.post('/api/honey-forensics', (req, res) => {
    const forensicsData = req.body;
    const visitorId = forensicsData.visitorId || req.query.visitorId || generateVisitorId();
    const sessionId = forensicsData.sessionId || req.query.sessionId || generateSessionId();
    const forensicsType = forensicsData.type || 'phone_forensics';

    // Save to file
    const dateDir = new Date().toISOString().split('T')[0];
    const forensicsDir = path.join(DATA_DIR, dateDir, 'forensics');
    if (!fs.existsSync(forensicsDir)) {
        fs.mkdirSync(forensicsDir, { recursive: true });
    }

    const filePath = path.join(forensicsDir, `${visitorId}_${sessionId}_${forensicsType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(forensicsData, null, 2));

    res.status(201).json({
        status: 'forensics_logged',
        visitorId,
        sessionId,
        type: forensicsType,
        savedTo: filePath
    });
});

// Log X/Twitter association data
app.post('/api/honey-x-association', (req, res) => {
    const xData = req.body;
    const visitorId = xData.visitorId || req.query.visitorId || generateVisitorId();
    const sessionId = xData.sessionId || req.query.sessionId || generateSessionId();

    const dateDir = new Date().toISOString().split('T')[0];
    const xDir = path.join(DATA_DIR, dateDir, 'x_associations');
    if (!fs.existsSync(xDir)) {
        fs.mkdirSync(xDir, { recursive: true });
    }

    const filePath = path.join(xDir, `${visitorId}_${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(xData, null, 2));

    res.status(201).json({
        status: 'x_association_logged',
        visitorId,
        sessionId,
        savedTo: filePath
    });
});

// Get all logged visitors
app.get('/api/visitors', (req, res) => {
    const dateFilter = req.query.date || new Date().toISOString().split('T')[0];
    const datePath = path.join(DATA_DIR, dateFilter);

    let visitors = [];

    if (fs.existsSync(datePath)) {
        const files = fs.readdirSync(datePath);
        visitors = files
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(datePath, f);
                return JSON.parse(fs.readFileSync(filePath));
            });
    }

    // Add active sessions
    const active = Array.from(activeSessions.entries()).map(([id, data]) => ({
        ...data,
        isActive: true
    }));

    res.json({
        date: dateFilter,
        loggedVisitors: visitors.length,
        activeVisitors: active.length,
        visitors: [...active, ...visitors]
    });
});

// Get visitor by ID
app.get('/api/visitors/:id', (req, res) => {
    const { id } = req.params;
    let visitorData = null;

    if (activeSessions.has(id)) {
        visitorData = activeSessions.get(id);
    } else {
        const dateDirs = fs.readdirSync(DATA_DIR).filter(d => fs.statSync(path.join(DATA_DIR, d)).isDirectory());

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
app.get('/api/stats', (req, res) => {
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
        timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 }
    };

    const dateDirs = fs.readdirSync(DATA_DIR).filter(d => fs.statSync(path.join(DATA_DIR, d)).isDirectory());

    for (const dateDir of dateDirs) {
        const datePath = path.join(DATA_DIR, dateDir);
        const files = fs.readdirSync(datePath).filter(f => f.endsWith('.json'));
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

    res.json(stats);
});

// Generate unique IDs
function generateVisitorId() {
    return 'vp_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

function generateSessionId() {
    return 'sess_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
}

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║      TENGRI CHECKER HONEY POT TRACKER ACTIVE               ║
╠════════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                              ║
║  Data Dir:    ${DATA_DIR}                                        ║
║  Endpoints:                                                  ║
║    POST       /api/honey-log          - Log visitor data   ║
║    POST       /api/honey-events       - Log visitor events ║
║    POST       /api/honey-forensics    - Phone forensics    ║
║    POST       /api/honey-x-association - X/Twitter assoc   ║
║    GET        /api/visitors           - List visitors      ║
║    GET        /api/stats              - Summary statistics ║
║    GET        /health                 - Health check       ║
╚════════════════════════════════════════════════════════════╝
`);
    console.log(`Honey pot is ready to catch visitors...`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
