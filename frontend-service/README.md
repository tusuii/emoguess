# Inventory Frontend Service

Minimal React frontend for inventory management. Focus: **DevOps/CI-CD demo**, not UI complexity.

## Features (Minimal by Design)
- Display items in simple table
- Add new item form (name, quantity, price)
- Basic error handling
- That's it! No edit, delete, pagination, or filters

## Tech Stack
- React 19 + Vite
- Axios for API calls
- Basic CSS (no framework)
- Nginx for production serving

## Local Development

### Prerequisites
- Node.js 20+
- Backend service running at http://localhost:3000

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Testing
```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:3000 | Backend API URL |

## Docker Build

```bash
# Build image
docker build -t frontend-service:latest .

# Run container
docker run -d -p 80:80 frontend-service:latest
```

## CI/CD Pipeline

Gitea Actions workflow:
1. Checkout → Install → Lint → Test → Build
2. SonarQube scan + quality gate
3. Build multi-stage Docker image (React build + nginx)
4. Push to Gitea registry with tags: `{branch}-{sha}`, `{branch}`, `latest`
5. Update k8s-manifests repo

## Component Structure

Single component (`App.jsx`) with:
- Items list table
- Add item form
- Loading/error states
- API integration via axios

**~80 lines total** - intentionally minimal!

## Project Structure

```
frontend-service/
├── src/
│   ├── App.jsx            # Single component (~80 lines)
│   ├── api.js             # Axios API calls (~15 lines)
│   ├── App.css            # Basic styling
│   └── main.jsx           # Entry point
├── tests/
│   └── App.test.jsx       # Basic component tests
├── .gitea/workflows/
│   └── ci.yaml            # CI/CD pipeline
├── Dockerfile             # Multi-stage build
├── nginx.conf             # Production web server config
├── package.json
└── README.md
```

**Total: ~8 files** - focus on DevOps, not application!

## Production Deployment

Built as static files served by nginx:
- React app compiled to `/usr/share/nginx/html`
- Non-root nginx user (nginx-app:1001)
- Security headers enabled
- Gzip compression
- Asset caching with cache-busting
- SPA routing support

## API Integration

Frontend calls backend endpoints:
- `GET /api/items` - Fetch all items
- `POST /api/items` - Create new item

Backend URL configured via `VITE_API_URL` environment variable.
