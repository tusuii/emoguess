// Basic tests for backend API
const request = require('supertest');
const app = require('../src/server');

describe('Backend API Tests', () => {
    // Health check tests
    describe('GET /health', () => {
        it('should return 200 and status ok', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'ok');
        });
    });

    // Readiness check tests
    describe('GET /ready', () => {
        it('should return readiness status', async () => {
            const res = await request(app).get('/ready');
            expect([200, 503]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('database');
        });
    });

    // 404 handler test
    describe('GET /nonexistent', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/nonexistent');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    // Items API tests
    describe('POST /api/items', () => {
        it('should reject invalid item data', async () => {
            const res = await request(app)
                .post('/api/items')
                .send({ name: '', quantity: -1, price: 'invalid' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('should reject missing required fields', async () => {
            const res = await request(app)
                .post('/api/items')
                .send({ quantity: 10 });

            expect(res.statusCode).toBe(400);
        });
    });
});
