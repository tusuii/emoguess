# Deployment Guide

Complete guide for deploying the 2-tier inventory application.

## Prerequisites Checklist

### Infrastructure Requirements
- [ ] Kubernetes cluster (v1.24+) with 2+ nodes
- [ ] kubectl configured and connected
- [ ] Gitea instance running
- [ ] Gitea Container Registry enabled
- [ ] SonarQube instance running
- [ ] ArgoCD installed in cluster

### Access Requirements
- [ ] Git credentials for Gitea
- [ ] Registry credentials for pushing images
- [ ] Kubernetes cluster admin access
- [ ] SonarQube token for CI

## Step 1: Setup Git Repositories

### Create Repositories in Gitea

```bash
# 1. Create three repositories in Gitea UI or via API:
# - inventory/backend-service
# - inventory/frontend-service
# - inventory/k8s-manifests

# 2. Push code to repositories
cd backend-service
git init
git add .
git commit -m "Initial commit: Backend service"
git remote add origin https://gitea.example.com/inventory/backend-service.git
git push -u origin main

cd ../frontend-service
git init
git add .
git commit -m "Initial commit: Frontend service"
git remote add origin https://gitea.example.com/inventory/frontend-service.git
git push -u origin main

cd ../k8s-manifests
git init
git add .
git commit -m "Initial commit: K8s manifests"
git remote add origin https://gitea.example.com/inventory/k8s-manifests.git
git push -u origin main
```

## Step 2: Configure CI/CD Secrets

Add secrets to each repository (Gitea Settings → Secrets):

### Backend & Frontend Repositories
- `SONAR_TOKEN` - SonarQube authentication token
- `REGISTRY_USERNAME` - Gitea registry username
- `REGISTRY_PASSWORD` - Gitea registry password/token

### How to Get Tokens

#### SonarQube Token
```bash
# In SonarQube UI:
# My Account → Security → Generate Token
# Name: gitea-actions
# Copy token and save as secret
```

#### Gitea Registry Credentials
```bash
# Use your Gitea username
# Generate application token:
# Gitea → Settings → Applications → Generate Token
# Permissions: write:package
```

## Step 3: Update Configuration Files

### 3.1 Update Registry URLs

Replace `gitea.example.com` with your actual Gitea domain:

```bash
# Backend CI workflow
sed -i 's/gitea.example.com/your-gitea-domain.com/g' backend-service/.gitea/workflows/ci.yaml

# Frontend CI workflow
sed -i 's/gitea.example.com/your-gitea-domain.com/g' frontend-service/.gitea/workflows/ci.yaml

# K8s manifests
sed -i 's/gitea.example.com/your-gitea-domain.com/g' k8s-manifests/base/backend/deployment.yaml
sed -i 's/gitea.example.com/your-gitea-domain.com/g' k8s-manifests/base/frontend/deployment.yaml
sed -i 's/gitea.example.com/your-gitea-domain.com/g' k8s-manifests/overlays/prod/kustomization.yaml
```

### 3.2 Update SonarQube URL

```bash
# Backend
sed -i 's|http://sonarqube.example.com|http://your-sonarqube-url|g' backend-service/.gitea/workflows/ci.yaml

# Frontend
sed -i 's|http://sonarqube.example.com|http://your-sonarqube-url|g' frontend-service/.gitea/workflows/ci.yaml
```

### 3.3 Update Ingress Domain

```bash
# Edit k8s-manifests/base/frontend/ingress.yaml
vim k8s-manifests/base/frontend/ingress.yaml

# Change:
# - host: inventory.local
# To:
# - host: inventory.yourdomain.com
```

### 3.4 Secure MySQL Secrets

```bash
# Generate secure passwords
MYSQL_ROOT_PASS=$(openssl rand -base64 32)
MYSQL_APP_PASS=$(openssl rand -base64 32)

# Update secret
cat > k8s-manifests/base/mysql/secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
stringData:
  root-password: "${MYSQL_ROOT_PASS}"
  user: "inventory_user"
  password: "${MYSQL_APP_PASS}"
EOF

echo "Save these credentials securely:"
echo "Root password: ${MYSQL_ROOT_PASS}"
echo "App password: ${MYSQL_APP_PASS}"
```

## Step 4: Setup SonarQube Projects

### Create Projects in SonarQube

1. **Backend Project**
   ```
   Project Key: inventory-backend
   Project Name: Inventory Backend Service
   ```

2. **Frontend Project**
   ```
   Project Key: inventory-frontend
   Project Name: Inventory Frontend Service
   ```

3. **Configure Quality Gates** (optional)
   - Administration → Quality Gates
   - Set thresholds for Coverage, Bugs, Vulnerabilities

## Step 5: Deploy to Kubernetes

### Option A: With ArgoCD (Recommended)

```bash
# 1. Ensure ArgoCD is installed
kubectl get pods -n argocd

# 2. Login to ArgoCD CLI
argocd login <argocd-server-url>

# 3. Add Git repository to ArgoCD
argocd repo add https://gitea.example.com/inventory/k8s-manifests.git \
  --username <gitea-username> \
  --password <gitea-token>

# 4. Create ArgoCD application
kubectl apply -f k8s-manifests/argocd/applications/inventory-app.yaml

# 5. Watch deployment
argocd app get inventory-app
argocd app sync inventory-app
```

### Option B: Manual kubectl

```bash
# 1. Create namespace
kubectl create namespace inventory

# 2. Apply manifests
kubectl apply -k k8s-manifests/overlays/prod

# 3. Check status
kubectl get all -n inventory
kubectl rollout status deployment/backend -n inventory
kubectl rollout status deployment/frontend -n inventory
kubectl rollout status statefulset/mysql -n inventory
```

## Step 6: Verify Deployment

### 6.1 Check Pods
```bash
kubectl get pods -n inventory

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxxx-yyyy           1/1     Running   0          2m
# backend-xxxx-zzzz           1/1     Running   0          2m
# frontend-xxxx-yyyy          1/1     Running   0          2m
# frontend-xxxx-zzzz          1/1     Running   0          2m
# mysql-0                     1/1     Running   0          2m
```

### 6.2 Check Services
```bash
kubectl get svc -n inventory

# Expected output:
# NAME       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
# backend    ClusterIP   10.x.x.x        <none>        3000/TCP   2m
# frontend   ClusterIP   10.x.x.x        <none>        80/TCP     2m
# mysql      ClusterIP   None            <none>        3306/TCP   2m
```

### 6.3 Check Ingress
```bash
kubectl get ingress -n inventory

# Get ingress IP/hostname
kubectl describe ingress inventory-ingress -n inventory
```

### 6.4 Test Backend API
```bash
# Port-forward for testing
kubectl port-forward -n inventory svc/backend 3000:3000

# In another terminal, test endpoints
curl http://localhost:3000/health
# Expected: {"status":"ok"}

curl http://localhost:3000/ready
# Expected: {"status":"ready","database":"connected"}

curl http://localhost:3000/api/items
# Expected: JSON array with sample items
```

### 6.5 Access Frontend

```bash
# Option 1: Port-forward
kubectl port-forward -n inventory svc/frontend 8080:80
# Open http://localhost:8080 in browser

# Option 2: Via Ingress (production)
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
# <ingress-ip> inventory.yourdomain.com
# Open http://inventory.yourdomain.com in browser
```

## Step 7: Test CI/CD Pipeline

### Trigger Pipeline for Backend

```bash
cd backend-service

# Make a small change
echo "// Pipeline test" >> src/server.js

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Watch Gitea Actions in browser
# Go to: https://gitea.example.com/inventory/backend-service/actions

# Watch ArgoCD sync (if enabled)
argocd app get inventory-app --watch
```

### Trigger Pipeline for Frontend

```bash
cd frontend-service

# Make a small change
echo "/* Pipeline test */" >> src/App.css

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Watch pipeline and ArgoCD sync
```

## Step 8: Test Rollback

### Create a Breaking Change

```bash
cd backend-service

# Introduce a bug (bad syntax)
cat >> src/server.js << 'EOF'

// This will break the server
app.get('/broken', (req, res) => {
  undefinedFunction();
});
EOF

git add .
git commit -m "Introduce breaking change"
git push origin main
```

### Rollback via ArgoCD

```bash
# Wait for deployment to fail
kubectl get pods -n inventory

# Rollback to previous version
argocd app history inventory-app
argocd app rollback inventory-app <revision-id>

# Or via Git revert
cd ../k8s-manifests
git revert HEAD
git push origin main
```

## Common Deployment Issues

### Issue: Pods in CrashLoopBackOff

**Backend/Frontend**
```bash
# Check logs
kubectl logs -n inventory deployment/backend
kubectl logs -n inventory deployment/frontend

# Common causes:
# - Wrong image tag
# - Missing environment variables
# - Can't connect to MySQL
```

**MySQL**
```bash
# Check logs
kubectl logs -n inventory mysql-0

# Common causes:
# - PVC not bound (check storage class)
# - Invalid configuration
```

### Issue: Images Not Pulling

```bash
# Check image pull secrets
kubectl get pods -n inventory -o yaml | grep -A 5 imagePullSecrets

# Test registry access
docker login gitea.example.com
docker pull gitea.example.com/inventory/backend:latest
```

### Issue: ArgoCD Not Syncing

```bash
# Check application status
argocd app get inventory-app

# Check repository connection
argocd repo list

# Re-add repository if needed
argocd repo add https://gitea.example.com/inventory/k8s-manifests.git \
  --username <username> \
  --password <token>
```

### Issue: CI Pipeline Fails

**SonarQube Connection**
```bash
# Check SonarQube URL in workflow
# Verify SONAR_TOKEN secret is set
# Test SonarQube accessibility from runners
```

**Registry Push Fails**
```bash
# Verify REGISTRY_USERNAME and REGISTRY_PASSWORD secrets
# Check registry is accessible
# Ensure user has write permissions
```

## Cleanup

### Remove Everything

```bash
# Delete from Kubernetes
kubectl delete namespace inventory

# Delete ArgoCD application
kubectl delete -f k8s-manifests/argocd/applications/inventory-app.yaml

# Optional: Delete Git repositories and images
# - Gitea UI → Settings → Delete Repository
# - Gitea UI → Packages → Delete Package
```

## Production Checklist

Before going to production:

- [ ] Replace all placeholder passwords
- [ ] Configure TLS/HTTPS (cert-manager)
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backup strategy for MySQL
- [ ] Implement network policies
- [ ] Set resource quotas per namespace
- [ ] Configure pod disruption budgets
- [ ] Set up log aggregation (ELK/Loki)
- [ ] Configure alerting (AlertManager)
- [ ] Document incident response procedures
- [ ] Test disaster recovery procedures
- [ ] Configure automatic backups
- [ ] Set up rate limiting on Ingress

## Useful Commands Reference

```bash
# View all resources
kubectl get all -n inventory

# Describe resource
kubectl describe pod <pod-name> -n inventory

# Logs (follow)
kubectl logs -f deployment/backend -n inventory

# Execute command in pod
kubectl exec -it <pod-name> -n inventory -- /bin/sh

# Port forward service
kubectl port-forward svc/backend 3000:3000 -n inventory

# Scale deployment
kubectl scale deployment backend --replicas=5 -n inventory

# Update image manually
kubectl set image deployment/backend backend=gitea.example.com/inventory/backend:v1.2.3 -n inventory

# View rollout history
kubectl rollout history deployment/backend -n inventory

# Rollback deployment
kubectl rollout undo deployment/backend -n inventory

# ArgoCD commands
argocd app list
argocd app get inventory-app
argocd app sync inventory-app
argocd app history inventory-app
argocd app rollback inventory-app <revision>
argocd app diff inventory-app
```

---

**You're now ready to deploy!** Follow the steps in order and refer to troubleshooting section if issues arise.
