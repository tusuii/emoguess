// Minimal Express server for inventory management
// All routes inline (no separate controllers) - focus on DevOps, not architecture
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { pool, initDatabase, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint (liveness probe)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Readiness check endpoint (checks DB connection)
app.get('/ready', async (req, res) => {
    const isConnected = await testConnection();
    if (isConnected) {
        res.status(200).json({ status: 'ready', database: 'connected' });
    } else {
        res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
});

// GET /api/items - List all items (no pagination for simplicity)
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM items ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// POST /api/items - Create new item
app.post('/api/items',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, quantity, price } = req.body;

        try {
            const [result] = await pool.query(
                'INSERT INTO items (name, quantity, price) VALUES (?, ?, ?)',
                [name, quantity, price]
            );

            res.status(201).json({
                id: result.insertId,
                name,
                quantity,
                price,
                message: 'Item created successfully'
            });
        } catch (error) {
            console.error('Error creating item:', error);
            res.status(500).json({ error: 'Failed to create item' });
        }
    }
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    try {
        // Initialize database schema
        await initDatabase();

        // Start listening
        app.listen(PORT, () => {
            console.log(`Backend service running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Ready check: http://localhost:${PORT}/ready`);
            console.log(`API endpoint: http://localhost:${PORT}/api/items`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Only start server if not in test mode
if (require.main === module) {
    startServer();
}

module.exports = app;
