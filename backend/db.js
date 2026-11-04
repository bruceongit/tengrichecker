/**
 * PostgreSQL connection pool for Network Tracker
 */

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE) || 30000,
});

// Test connection
pool.on('connect', () => {
    console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client', err);
});

// Initialize database schema
export async function initDB() {
    const client = await pool.connect();
    try {
        // Visitors table
        await client.query(`
            CREATE TABLE IF NOT EXISTS visitors (
                id SERIAL PRIMARY KEY,
                visitor_id VARCHAR(255) UNIQUE NOT NULL,
                session_id VARCHAR(255) NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ip VARCHAR(45),
                user_agent TEXT,
                referrer TEXT,
                page_url TEXT,
                location JSONB,
                geolocation JSONB,
                fingerprint JSONB,
                network JSONB,
                behavioral JSONB,
                system JSONB,
                timing JSONB,
                extra JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index on visitor_id for fast lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id)
        `);

        // Events table
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                visitor_id VARCHAR(255) NOT NULL,
                session_id VARCHAR(255),
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                event_type VARCHAR(100) NOT NULL,
                event_details JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id)
        `);

        // Forensics table
        await client.query(`
            CREATE TABLE IF NOT EXISTS forensics (
                id SERIAL PRIMARY KEY,
                visitor_id VARCHAR(255) NOT NULL,
                session_id VARCHAR(255),
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                forensic_type VARCHAR(100) NOT NULL,
                data JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_forensics_visitor_id ON forensics(visitor_id)
        `);

        // X/Twitter associations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS x_associations (
                id SERIAL PRIMARY KEY,
                visitor_id VARCHAR(255) NOT NULL,
                session_id VARCHAR(255),
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                x_user_id VARCHAR(255),
                x_username VARCHAR(255),
                followers_count INTEGER,
                following_count INTEGER,
                is_verified BOOLEAN,
                engagement_score INTEGER,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_x_associations_visitor_id ON x_associations(visitor_id)
        `);

        // S3 uploads tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS s3_uploads (
                id SERIAL PRIMARY KEY,
                visitor_id VARCHAR(255) NOT NULL,
                file_key VARCHAR(500) NOT NULL,
                file_type VARCHAR(100),
                file_size BIGINT,
                s3_bucket VARCHAR(100),
                s3_key VARCHAR(500),
                s3_etag VARCHAR(100),
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_s3_uploads_visitor_id ON s3_uploads(visitor_id)
        `);

        // Archives table for daily backups
        await client.query(`
            CREATE TABLE IF NOT EXISTS archives (
                id SERIAL PRIMARY KEY,
                date DATE UNIQUE NOT NULL,
                files_archived INTEGER NOT NULL,
                path VARCHAR(500),
                metadata JSONB,
                completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('[DB] Schema initialized successfully');
    } catch (error) {
        console.error('[DB] Error initializing schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Insert visitor data
export async function insertVisitor(data) {
    const query = `
        INSERT INTO visitors (
            visitor_id, session_id, timestamp, ip, user_agent, referrer,
            page_url, location, geolocation, fingerprint, network,
            behavioral, system, timing, extra
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (visitor_id) DO UPDATE SET
            session_id = EXCLUDED.session_id,
            timestamp = EXCLUDED.timestamp,
            ip = EXCLUDED.ip,
            user_agent = EXCLUDED.user_agent,
            location = EXCLUDED.location,
            geolocation = EXCLUDED.geolocation,
            fingerprint = EXCLUDED.fingerprint,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, visitor_id, session_id, created_at
    `;
    const values = [
        data.visitorId,
        data.sessionId,
        data.timestamp || new Date(),
        data.ip,
        data.userAgent,
        data.referrer,
        data.page?.url,
        JSON.stringify(data.location || {}),
        JSON.stringify(data.geolocation || {}),
        JSON.stringify(data.fingerprint || {}),
        JSON.stringify(data.network || {}),
        JSON.stringify(data.behavioral || {}),
        JSON.stringify(data.system || {}),
        JSON.stringify(data.timing || {}),
        JSON.stringify(data.extra || {})
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

// Insert event
export async function insertEvent(data) {
    const query = `
        INSERT INTO events (visitor_id, session_id, event_type, event_details)
        VALUES ($1, $2, $3, $4)
        RETURNING id, timestamp
    `;
    const values = [
        data.visitorId,
        data.sessionId,
        data.type,
        JSON.stringify(data.details || {})
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

// Insert forensics data
export async function insertForensics(data) {
    const query = `
        INSERT INTO forensics (visitor_id, session_id, forensic_type, data)
        VALUES ($1, $2, $3, $4)
        RETURNING id, timestamp
    `;
    const values = [
        data.visitorId,
        data.sessionId,
        data.type || 'phone_forensics',
        JSON.stringify(data)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

// Insert X/Twitter association
export async function insertXAssociation(data) {
    const query = `
        INSERT INTO x_associations (
            visitor_id, session_id, x_user_id, x_username,
            followers_count, following_count, is_verified, engagement_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, timestamp
    `;
    const values = [
        data.visitorId,
        data.sessionId,
        data.xUserId,
        data.xUsername,
        data.followersCount,
        data.followingCount,
        data.isVerified,
        data.engagementScore
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

// Insert S3 upload record
export async function insertS3Upload(data) {
    const query = `
        INSERT INTO s3_uploads (
            visitor_id, file_key, file_type, file_size,
            s3_bucket, s3_key, s3_etag, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
    `;
    const values = [
        data.visitorId,
        data.fileKey,
        data.fileType,
        data.fileSize,
        data.s3Bucket,
        data.s3Key,
        data.s3Etag,
        JSON.stringify(data.metadata || {})
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

// Get visitor by ID
export async function getVisitor(visitorId) {
    const query = `
        SELECT * FROM visitors WHERE visitor_id = $1
    `;
    const result = await pool.query(query, [visitorId]);
    return result.rows[0] || null;
}

// Get visitors by date range
export async function getVisitorsByDate(startDate, endDate) {
    const query = `
        SELECT visitor_id, session_id, timestamp, ip, location,
               geolocation, fingerprint, system
        FROM visitors
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp DESC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
}

// Get statistics
export async function getStats() {
    const stats = {
        totalVisitors: 0,
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

    // Total visitors
    const total = await pool.query('SELECT COUNT(*) as count FROM visitors');
    stats.totalVisitors = parseInt(total.rows[0].count);

    // By day
    const byDay = await pool.query(`
        SELECT DATE(timestamp) as day, COUNT(*) as count
        FROM visitors
        GROUP BY DATE(timestamp)
        ORDER BY day DESC
    `);
    for (const row of byDay.rows) {
        stats.byDay[row.day.toISOString().split('T')[0]] = row.count;
    }

    // By location (country)
    const byLocation = await pool.query(`
        SELECT location->>'country' as country, COUNT(*) as count
        FROM visitors
        WHERE location ? 'country'
        GROUP BY location->>'country'
        ORDER BY count DESC
    `);
    for (const row of byLocation.rows) {
        stats.byLocation[row.country] = row.count;
    }

    // By browser
    const byBrowser = await pool.query(`
        SELECT fingerprint->'browser'->>'name' as browser, COUNT(*) as count
        FROM visitors
        WHERE fingerprint ? 'browser'
        GROUP BY fingerprint->'browser'->>'name'
        ORDER BY count DESC
    `);
    for (const row of byBrowser.rows) {
        stats.byBrowser[row.browser] = row.count;
    }

    // By device
    const byDevice = await pool.query(`
        SELECT CASE
            WHEN system->'screen' IS NOT NULL THEN 'desktop'
            ELSE 'mobile'
        END as device, COUNT(*) as count
        FROM visitors
        GROUP BY device
    `);
    for (const row of byDevice.rows) {
        stats.byDevice[row.device] = row.count;
    }

    // Geolocation success
    const geoSuccess = await pool.query(`
        SELECT COUNT(*) as count FROM visitors
        WHERE geolocation ? 'coords'
    `);
    stats.geolocationSuccess = parseInt(geoSuccess.rows[0].count);

    // Geolocation failed
    const geoFailed = await pool.query(`
        SELECT COUNT(*) as count FROM visitors
        WHERE geolocation ? 'error'
    `);
    stats.geolocationFailed = parseInt(geoFailed.rows[0].count);

    // VPN users
    const vpn = await pool.query(`
        SELECT COUNT(*) as count FROM visitors
        WHERE network @> '{"vpnDetection": {}}'
           OR network->'vpnDetection' IS NOT NULL
    `);
    stats.vpnUsers = parseInt(vpn.rows[0].count);

    // Phone forensics
    const forensics = await pool.query(`
        SELECT COUNT(*) as count FROM forensics
    `);
    stats.phoneForensics = parseInt(forensics.rows[0].count);

    // X associations
    const xAssoc = await pool.query(`
        SELECT COUNT(*) as count FROM x_associations
    `);
    stats.xAssociations = parseInt(xAssoc.rows[0].count);

    // Archives
    const archives = await pool.query(`
        SELECT COUNT(*) as count FROM archives
    `);
    stats.archives = parseInt(archives.rows[0].count);

    return stats;
}

// Get active sessions count
export async function getActiveSessions() {
    const result = await pool.query(`
        SELECT COUNT(DISTINCT visitor_id) as active
        FROM visitors
        WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);
    return parseInt(result.rows[0].active) || 0;
}

// Close pool connection
export async function closeDB() {
    await pool.end();
    console.log('[DB] Connection pool closed');
}

export default pool;
