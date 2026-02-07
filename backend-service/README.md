# Inventory Backend Service

Minimal Node.js/Express backend for inventory management. Focus: **DevOps/CI-CD demo**, not application complexity.

## Features (Minimal by Design)
- 4 API endpoints: GET/POST items, health check, readiness check
- MySQL database with single table (4 fields)
- Input validation
- CORS and security headers
- Non-root Docker container

## Tech Stack
- Node.js 20
- Express 4
- MySQL 8.0
- mysql2 (prepared statements for SQL injection protection)
- helmet (security headers)
- express-validator

## Local Development

### Prerequisites
- Node.js 20+
- MySQL 8.0 running locally or via Docker

### Quick Start
```bash
# 1. Start MySQL
docker run -d \
  --name mysql-local \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=inventory \
  -p 3306:3306 \
  mysql:8.0

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Start server
npm start
# Or with hot-reload:
npm run dev
```

### Testing
```bash
# Run tests
npm test

# Run linter
npm run lint
```

### API Endpoints

#### Health Check (Liveness)
```bash
curl http://localhost:3000/health
# Response: {"status": "ok"}
```

#### Readiness Check
```bash
curl http://localhost:3000/ready
# Response: {"status": "ready", "database": "connected"}
```

#### Get All Items
```bash
curl http://localhost:3000/api/items
# Response: [{"id":1,"name":"Laptop","quantity":10,"price":"999.99"},...]
```

#### Create Item
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","quantity":15,"price":299.99}'
# Response: {"id":4,"name":"Monitor","quantity":15,"price":299.99,"message":"Item created successfully"}
```

## Docker Build

```bash
# Build image
docker build -t backend-service:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=rootpass \
  backend-service:latest
```

## CI/CD Pipeline

Gitea Actions workflow:
1. Checkout → Install → Lint → Test
2. SonarQube scan + quality gate
3. Build multi-stage Docker image
4. Push to Gitea registry with tags: `{branch}-{sha}`, `{branch}`, `latest`
5. Update k8s-manifests repo

## Database Schema

```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL
);
```

**That's it!** No timestamps, no foreign keys, no complexity. Focus on CI/CD.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| DB_HOST | localhost | MySQL host |
| DB_PORT | 3306 | MySQL port |
| DB_USER | root | MySQL user |
| DB_PASSWORD | rootpass | MySQL password |
| DB_NAME | inventory | Database name |

## Security

- ✓ Non-root Docker user (nodejs:1001)
- ✓ Helmet.js security headers
- ✓ SQL injection protection (prepared statements)
- ✓ Input validation (express-validator)
- ✓ CORS configured
- ✓ Multi-stage Docker build (no dev dependencies in prod)

## Project Structure

```
backend-service/
├── src/
│   ├── server.js      # Main Express app (~100 lines, all routes inline)
│   ├── db.js          # MySQL connection pool
│   └── init.sql       # Database schema
├── tests/
│   └── server.test.js # Basic API tests
├── .gitea/workflows/
│   └── ci.yaml        # CI/CD pipeline
├── Dockerfile         # Multi-stage build
├── package.json
└── README.md
```

**Total: ~10 files** - intentionally minimal!
