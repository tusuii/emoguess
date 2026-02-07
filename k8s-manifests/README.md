# Kubernetes Manifests for Inventory App

GitOps repository for inventory management system deployment. Managed by ArgoCD.

## Structure

```
k8s-manifests/
├── base/
│   ├── mysql/          # MySQL StatefulSet + Service + Secret
│   ├── backend/        # Backend Deployment + Service + ConfigMap
│   └── frontend/       # Frontend Deployment + Service + Ingress
├── overlays/
│   ├── prod/           # Production configuration
│   ├── dev/            # Development configuration (optional)
│   └── staging/        # Staging configuration (optional)
└── argocd/
    └── applications/   # ArgoCD Application manifests
```

## Components

### MySQL (StatefulSet)
- **Image**: mysql:8.0
- **Storage**: 10Gi PVC
- **Replicas**: 1 (StatefulSet)
- **Service**: Headless ClusterIP
- **Secrets**: Root password, app user credentials

### Backend (Deployment)
- **Image**: Updated by CI/CD pipeline
- **Replicas**: 3 (prod), 2 (base)
- **Service**: ClusterIP on port 3000
- **InitContainer**: Wait for MySQL readiness
- **Probes**:
  - Liveness: `/health`
  - Readiness: `/ready` (checks DB)

### Frontend (Deployment)
- **Image**: Updated by CI/CD pipeline
- **Replicas**: 3 (prod), 2 (base)
- **Service**: ClusterIP on port 80
- **Ingress**: Routes `/api` to backend, `/` to frontend

## Deployment Flow

1. **CI/CD pushes code** → Triggers Gitea Actions
2. **Build & test** → Docker image created
3. **Image pushed** → Gitea container registry
4. **Update manifests** → CI updates image tag in `overlays/prod/kustomization.yaml`
5. **ArgoCD detects change** → Syncs cluster to Git state
6. **Rollout** → Kubernetes deploys new version

## Image Tagging Strategy

CI/CD pipeline tags images as:
```
{branch}-{git-sha}     # e.g., main-a3f5c21 (immutable)
{branch}               # e.g., main (moving)
latest                 # Latest on main branch
```

Kustomize uses immutable SHA tags for predictable rollbacks.

## Manual Deployment (Without ArgoCD)

```bash
# Create namespace
kubectl create namespace inventory

# Deploy base + production overlay
kubectl apply -k overlays/prod

# Check status
kubectl get all -n inventory

# View logs
kubectl logs -n inventory deployment/backend
kubectl logs -n inventory deployment/frontend
kubectl logs -n inventory mysql-0
```

## Deploy with ArgoCD

```bash
# Apply ArgoCD application
kubectl apply -f argocd/applications/inventory-app.yaml

# Check sync status
argocd app get inventory-app

# Manual sync (if auto-sync disabled)
argocd app sync inventory-app

# View history
argocd app history inventory-app
```

## Rollback Procedures

### Method 1: ArgoCD UI
1. Open ArgoCD → Select `inventory-app`
2. Click "History and Rollback"
3. Select previous healthy revision
4. Click "Rollback"

### Method 2: Git Revert (GitOps)
```bash
# Find bad commit
git log overlays/prod/kustomization.yaml

# Revert to previous state
git revert <bad-commit-sha>
git push

# ArgoCD auto-syncs within 3 minutes
```

### Method 3: Manual Image Update
```bash
# Edit overlays/prod/kustomization.yaml
vim overlays/prod/kustomization.yaml

# Change image tags to previous working SHA
images:
  - name: gitea.example.com/inventory/backend
    newTag: main-abc1234  # Previous working version

git add overlays/prod/kustomization.yaml
git commit -m "Rollback to known-good version"
git push
```

### Method 4: Emergency kubectl (Last Resort)
```bash
# Rollback deployment
kubectl rollout undo deployment/backend -n inventory

# Update Git to match (important for GitOps!)
# Otherwise ArgoCD will revert back
```

## Configuration Management

### Secrets
MySQL credentials stored in `base/mysql/secret.yaml`:
- **IMPORTANT**: Replace placeholder passwords before deploying!
- Consider using external secret management (Sealed Secrets, Vault)

```bash
# Generate secure passwords
openssl rand -base64 32
```

### ConfigMaps
Backend configuration in `base/backend/configmap.yaml`:
- Database host
- Database name

### Environment-Specific Overrides
Use Kustomize overlays to customize per environment:
```yaml
# overlays/prod/kustomization.yaml
replicas:
  - name: backend
    count: 3
```

## Ingress Configuration

Default host: `inventory.local`

**Change for your domain:**
```yaml
# base/frontend/ingress.yaml
spec:
  rules:
  - host: inventory.yourdomain.com  # Update this
```

Routes:
- `inventory.local/api/*` → Backend service
- `inventory.local/health` → Backend health
- `inventory.local/ready` → Backend readiness
- `inventory.local/*` → Frontend (catch-all)

## Monitoring & Troubleshooting

### Check pod status
```bash
kubectl get pods -n inventory
kubectl describe pod <pod-name> -n inventory
```

### View logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n inventory

# Frontend logs
kubectl logs -f deployment/frontend -n inventory

# MySQL logs
kubectl logs -f mysql-0 -n inventory
```

### Test connectivity
```bash
# Port-forward backend
kubectl port-forward -n inventory svc/backend 3000:3000

# Test API
curl http://localhost:3000/health
curl http://localhost:3000/api/items

# Port-forward frontend
kubectl port-forward -n inventory svc/frontend 8080:80
# Open http://localhost:8080
```

### Check ArgoCD sync status
```bash
argocd app get inventory-app
argocd app diff inventory-app
argocd app sync inventory-app --dry-run
```

## Resource Requirements

### Minimal Cluster Size
- **Nodes**: 2+ (for HA)
- **CPU**: 2 cores minimum
- **Memory**: 4GB minimum
- **Storage**: 20GB for MySQL PVC

### Production Recommendations
- **Nodes**: 3+ (one per replica)
- **CPU**: 4+ cores
- **Memory**: 8GB+
- **Storage**: StorageClass with backup support

## CI/CD Integration

CI pipeline automatically updates this repo:
```bash
# In Gitea Actions
sed -i "s|newTag:.*|newTag: ${BRANCH}-${SHA}|" overlays/prod/kustomization.yaml
git commit -m "Update image to ${BRANCH}-${SHA}"
git push
```

ArgoCD polls Git every 3 minutes or receives webhooks for instant sync.

## Security Considerations

- ✓ Non-root containers
- ✓ Resource limits enforced
- ✓ Network policies (optional, add if needed)
- ✓ Secrets not in Git (use external secrets in production)
- ✓ Ingress TLS (add cert-manager for HTTPS)
- ✓ RBAC for ArgoCD service accounts

## Next Steps

1. **Replace secret passwords** in `base/mysql/secret.yaml`
2. **Update Ingress host** to your domain
3. **Configure TLS** with cert-manager
4. **Set up monitoring** (Prometheus, Grafana)
5. **Add network policies** for pod isolation
6. **Configure backup** for MySQL PVC
