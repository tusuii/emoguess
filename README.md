# 2-Tier Inventory Management System

**Focus: DevOps & CI/CD Demonstration** (Not Application Complexity)

This is a minimal inventory management application designed to showcase production-ready **CI/CD pipelines**, **GitOps deployment**, and **Kubernetes architecture**. The application features are intentionally basic to keep focus on infrastructure and deployment practices.

## Quick Overview

### What This Demonstrates
- ✅ Full CI/CD pipeline with Gitea Actions
- ✅ Code quality gates with SonarQube
- ✅ Multi-stage Docker builds
- ✅ GitOps deployment with ArgoCD
- ✅ Kubernetes orchestration (StatefulSets, Deployments, Services, Ingress)
- ✅ Automated rollback capability
- ✅ Production-ready security practices

### Application Features (Minimal by Design)
- Display items in a table
- Add new items via form
- **That's it!** No edit, delete, search, or pagination
- 4 API endpoints total
- Single database table with 4 fields

## Architecture

```
┌─────────────┐      HTTP      ┌──────────────┐      SQL       ┌──────────┐
│   Frontend  │ ──────────────> │   Backend    │ ─────────────> │  MySQL   │
│ React/Vite  │                 │ Node/Express │                │    DB    │
└─────────────┘                 └──────────────┘                └──────────┘
```

## Repository Structure (Multi-repo)

This project uses a **multi-repository** approach (industry best practice):

### 1. `backend-service/`
- **Tech**: Node.js 20 + Express + MySQL2
- **Features**: 4 endpoints (GET/POST items, health, ready)
- **Files**: ~10 core files
- **CI**: Lint → Test → SonarQube → Docker → Push → Update k8s manifests

### 2. `frontend-service/`
- **Tech**: React 19 + Vite + Axios
- **Features**: List items + add form (single component)
- **Files**: ~8 core files
- **CI**: Lint → Test → SonarQube → Docker → Push → Update k8s manifests

### 3. `k8s-manifests/`
- **Structure**: Kustomize with base + overlays (dev/staging/prod)
- **Resources**: MySQL StatefulSet, Backend/Frontend Deployments, Services, Ingress
- **ArgoCD**: GitOps deployment with auto-sync

## Tech Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| Frontend | React 19 + Vite | Fast dev server, modern |
| Backend | Node.js 20 + Express | Non-blocking I/O, simple |
| Database | MySQL 8.0 | ACID compliance, reliable |
| CI/CD | Gitea Actions | GitHub Actions compatible |
| Code Quality | SonarQube | Quality gates, security scanning |
| Container Registry | Gitea Registry | Self-hosted |
| GitOps | ArgoCD | Declarative, visual, rollback |
| Orchestration | Kubernetes | Industry standard, self-healing |
| Config Management | Kustomize | Native k8s, no templating |

## Local Development (No Kubernetes Required)

### Prerequisites
- Node.js 20+
- Docker (for MySQL)

### Quick Start

```bash
# 1. Start MySQL
docker run -d \
  --name mysql-local \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=inventory \
  -p 3306:3306 \
  mysql:8.0

# 2. Run Backend
cd backend-service
npm install
cp .env.example .env
npm start
# Backend: http://localhost:3000

# 3. Run Frontend (new terminal)
cd frontend-service
npm install # npm install --legacy-peer-deps
cp .env.example .env
npm run dev
# Frontend: http://localhost:5173

# 4. Open browser
# Go to http://localhost:5173 and start adding items!
```

### Testing Locally

```bash
# Test backend API
curl http://localhost:3000/health
curl http://localhost:3000/api/items

# Test backend
cd backend-service && npm test

# Test frontend
cd frontend-service && npm test
```

## CI/CD Pipeline Flow

### Per Service (Frontend & Backend)

```
Developer pushes to main
    ↓
Gitea Actions triggers
    ↓
1. Checkout (full history for SonarQube)
2. Install dependencies (npm ci)
3. Run linter (ESLint)
4. Run tests with coverage (Jest/Vitest)
5. SonarQube scan + quality gate
   └─ FAIL? Stop pipeline ❌
6. Build Docker image (multi-stage)
7. Tag: {branch}-{sha}, {branch}, latest
8. Push to Gitea registry
9. Update k8s-manifests repo (commit new tag)
    ↓
k8s-manifests change triggers ArgoCD
    ↓
1. Detect Git change
2. Calculate diff
3. Sync to cluster (kubectl apply)
4. Monitor rollout
5. Store revision for rollback ✅
```

## Deployment

### With ArgoCD (Recommended)

```bash
# 1. Apply ArgoCD application
kubectl apply -f k8s-manifests/argocd/applications/inventory-app.yaml

# 2. Watch ArgoCD sync
argocd app get inventory-app
argocd app sync inventory-app

# 3. Access application
kubectl get ingress -n inventory
# Add inventory.local to /etc/hosts pointing to your cluster IP
# Open http://inventory.local
```

### Manual Deployment (Without ArgoCD)

```bash
# 1. Create namespace
kubectl create namespace inventory

# 2. Update secrets (IMPORTANT!)
vim k8s-manifests/base/mysql/secret.yaml
# Replace placeholder passwords

# 3. Deploy
kubectl apply -k k8s-manifests/overlays/prod

# 4. Check status
kubectl get all -n inventory
kubectl get ingress -n inventory
```

## Rollback Procedures

### Method 1: ArgoCD UI (Fastest - 30 seconds)
1. Open ArgoCD → Select `inventory-app`
2. Click "History and Rollback"
3. Choose previous healthy revision
4. Click "Rollback"

### Method 2: Git Revert (GitOps - 3 minutes)
```bash
cd k8s-manifests
git log overlays/prod/kustomization.yaml
git revert <bad-commit>
git push
# ArgoCD auto-syncs
```

### Method 3: Manual Tag Update (5 minutes)
```bash
cd k8s-manifests
vim overlays/prod/kustomization.yaml
# Change image tags to previous SHA
git commit -m "Rollback to known-good version"
git push
```

### Method 4: Emergency kubectl (Last resort)
```bash
kubectl rollout undo deployment/backend -n inventory
# Then update Git to match!
```

## Database Schema (Minimal)

```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL
);
```

**Only 4 fields.** Focus on DevOps, not data modeling.

## API Endpoints (Only 4)

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness probe (always returns 200) |
| GET | /ready | Readiness probe (checks DB connection) |
| GET | /api/items | List all items (no pagination) |
| POST | /api/items | Create item (body: {name, quantity, price}) |

**No PUT, no DELETE, no GET by ID.** Focus on CI/CD.

## Security Features

- ✓ Multi-stage Docker builds (no dev deps in prod)
- ✓ Non-root container users
- ✓ Kubernetes Secrets (not in Git)
- ✓ SQL injection protection (prepared statements)
- ✓ CORS configured
- ✓ Helmet.js security headers
- ✓ Input validation
- ✓ SonarQube vulnerability scanning

## Monitoring & Troubleshooting

```bash
# Check pod status
kubectl get pods -n inventory

# View logs
kubectl logs -f deployment/backend -n inventory
kubectl logs -f deployment/frontend -n inventory
kubectl logs -f mysql-0 -n inventory

# Port-forward for testing
kubectl port-forward -n inventory svc/backend 3000:3000
kubectl port-forward -n inventory svc/frontend 8080:80

# Check ArgoCD
argocd app get inventory-app
argocd app diff inventory-app
```

## File Count Summary

- **Backend**: ~10 files (server.js, db.js, tests, Dockerfile, CI config)
- **Frontend**: ~8 files (App.jsx, api.js, tests, Dockerfile, nginx.conf, CI config)
- **K8s manifests**: ~15 files (MySQL, Backend, Frontend resources + overlays)
- **Total**: ~35-40 files

**90% of effort is CI/CD pipeline and K8s manifests, not application code!**

## What You'll Learn

### DevOps Practices
- GitOps workflow with ArgoCD
- Multi-stage Docker builds
- Image tagging strategies for rollbacks
- Kubernetes resource management
- Health checks and probes
- ConfigMaps and Secrets management

### CI/CD Pipeline
- GitHub Actions compatible workflows
- SonarQube integration and quality gates
- Automated testing in CI
- Container registry operations
- Automated manifest updates

### Kubernetes Architecture
- StatefulSets for stateful workloads (MySQL)
- Deployments for stateless services
- Service discovery
- Ingress routing
- Kustomize for config management
- Multi-environment overlays

## Next Steps After Setup

1. **Enhance Monitoring**: Add Prometheus + Grafana
2. **Add TLS**: Configure cert-manager for HTTPS
3. **Network Policies**: Isolate pod communication
4. **Backup Strategy**: Automate MySQL backups
5. **Horizontal Scaling**: Configure HPA based on metrics
6. **Observability**: Add distributed tracing (Jaeger)
7. **Advanced GitOps**: Multi-cluster with ArgoCD ApplicationSets

## Common Issues & Solutions

### MySQL won't start
```bash
# Check PVC
kubectl get pvc -n inventory
# Ensure StorageClass exists
kubectl get storageclass
```

### Backend can't connect to MySQL
```bash
# Check MySQL is ready
kubectl get pods -n inventory | grep mysql
# Check backend logs
kubectl logs deployment/backend -n inventory
# Verify secrets
kubectl get secret mysql-secret -n inventory -o yaml
```

### Frontend shows blank page
```bash
# Check frontend logs
kubectl logs deployment/frontend -n inventory
# Test backend API directly
kubectl port-forward svc/backend 3000:3000 -n inventory
curl http://localhost:3000/api/items
```

### ArgoCD not syncing
```bash
# Check application status
argocd app get inventory-app
# Manual sync
argocd app sync inventory-app
# Check Git credentials
argocd repo list
```

## Contributing

This is a demo project. Feel free to:
- Add more API endpoints
- Enhance the UI
- Add authentication
- Implement caching
- Add more tests

But remember: **Keep it focused on DevOps learning!**

## License

MIT - Use freely for learning and demonstration

---

**Key Takeaway**: This project prioritizes infrastructure and deployment practices over application features. The simple application allows you to focus on mastering CI/CD, GitOps, and Kubernetes without getting lost in business logic.
