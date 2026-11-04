/**
 * Combined server for TengriChecker
 * Serves both the Astro static site and the Network API
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as networkApp, server as networkServer } from './backend/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the combined app (Astro + Network)
const app = networkApp;

console.log(`[Server] Starting server...`);
console.log(`[Server] PORT=${process.env.PORT}, NETWORK_PORT=${process.env.NETWORK_PORT}`);

// Static file serving for Astro dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log(`Serving static files from ${distPath}`);
    app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            }
        }
    }));
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TengriChecker',
        version: '2.0.0',
        endpoints: {
            main: '/',
            network: '/api/*',
            visitors: '/api/visitors',
            stats: '/api/stats',
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

// Health check for main app
app.get('/health', (req, res) => {
    const health = res.locals.health || {
        status: 'healthy',
        service: 'TengriChecker',
        timestamp: new Date().toISOString(),
        sessionsActive: 0,
        dataDir: process.env.NETWORK_DATA || path.join(__dirname, 'network-data'),
    };
    res.json(health);
});

// API root endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'TengriChecker Network API',
        version: '2.0.0',
        endpoints: {
            log: 'POST /api/tracker-log',
            events: 'POST /api/tracker-events',
            visitors: 'GET /api/visitors',
            stats: 'GET /api/stats',
            forensics: 'POST /api/tracker-forensics',
            xAssociation: 'POST /api/tracker-x-association',
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

// Health check for API only
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Network API',
        timestamp: new Date().toISOString(),
        sessionsActive: 0,
        dataDir: process.env.NETWORK_DATA || path.join(__dirname, 'network-data'),
        postgres: process.env.DATABASE_URL ? 'connected' : 'disabled',
        s3: process.env.S3_BUCKET_NAME ? 'connected' : 'disabled',
    });
});

// Expose the app and server for Railway to use
export { app, server };
