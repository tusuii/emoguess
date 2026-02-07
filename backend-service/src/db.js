// MySQL connection pool setup
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpass',
    database: process.env.DB_NAME || 'inventory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database schema
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

        // Split by semicolon and execute each statement
        const statements = initSQL.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

module.exports = {
    pool,
    initDatabase,
    testConnection
};
