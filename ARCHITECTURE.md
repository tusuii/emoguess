# Architecture Documentation

## System Overview

This is a **2-tier microservices application** demonstrating production-ready DevOps practices.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Ingress Controller                       │   │
│  │  Routes: /api → backend, / → frontend                    │   │
│  └─────────┬─────────────────────────────┬─────────────────┘   │
│            │                               │                     │
│            │ /api/*                        │ /*                  │
│            ▼                               ▼                     │
│  ┌─────────────────┐            ┌─────────────────┐            │
│  │   Backend Pods  │            │  Frontend Pods  │            │
│  │   (3 replicas)  │            │   (3 replicas)  │            │
│  │                 │            │                 │            │
│  │ Node.js/Express │            │  React + nginx  │            │
│  │   Port: 3000    │            │    Port: 80     │            │
│  └────────┬────────┘            └─────────────────┘            │
│           │                                                      │
│           │ MySQL Protocol                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  MySQL Pod      │                                            │
│  │  (StatefulSet)  │                                            │
│  │                 │                                            │
│  │  MySQL 8.0      │                                            │
│  │  Port: 3306     │                                            │
│  │  + PVC (10Gi)   │                                            │
│  └─────────────────┘                                            │
│                                                                   │
└───────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (React + Vite + nginx)

```
┌─────────────────────────────────────────────────────┐
│              Frontend Container                      │
│                                                       │
│  ┌───────────────────────────────────────────┐     │
│  │           nginx (Port 80)                  │     │
│  │  Serves: /usr/share/nginx/html             │     │
│  └───────────────────────────────────────────┘     │
│                                                       │
│  Static Files:                                       │
│  ├── index.html                                      │
│  ├── assets/                                         │
│  │   ├── index.js (React app bundle)                │
│  │   └── index.css (styles)                         │
│  └── vite.svg                                        │
│                                                       │
│  React App Structure:                                │
│  └── App.jsx (Single Component)                     │
│      ├── Items List (Table)                         │
│      ├── Add Item Form                               │
│      ├── Loading States                              │
│      └── Error Handling                              │
│                                                       │
│  API Client: axios → http://backend:3000/api        │
└─────────────────────────────────────────────────────┘
```

### Backend (Node.js + Express)

```
┌─────────────────────────────────────────────────────┐
│              Backend Container                       │
│                                                       │
│  ┌───────────────────────────────────────────┐     │
│  │      Express Server (Port 3000)            │     │
│  │                                             │     │
│  │  Routes:                                    │     │
│  │  ├── GET  /health      (Liveness)         │     │
│  │  ├── GET  /ready       (Readiness)        │     │
│  │  ├── GET  /api/items   (List)             │     │
│  │  └── POST /api/items   (Create)           │     │
│  └───────────┬───────────────────────────────┘     │
│              │                                       │
│  ┌───────────▼───────────────────────────────┐     │
│  │       MySQL2 Connection Pool               │     │
│  │  Host: mysql, Port: 3306                   │     │
│  │  Database: inventory                        │     │
│  └───────────┬───────────────────────────────┘     │
│              │                                       │
│  ┌───────────▼───────────────────────────────┐     │
│  │      Database Initialization               │     │
│  │  Runs: init.sql on startup                 │     │
│  │  Creates: items table + seed data          │     │
│  └────────────────────────────────────────────┘     │
│                                                       │
│  Middleware:                                         │
│  ├── helmet (Security headers)                       │
│  ├── cors (Cross-origin)                             │
│  ├── express.json (Body parser)                      │
│  └── express-validator (Input validation)            │
└─────────────────────────────────────────────────────┘
```

### Database (MySQL 8.0)

```
┌─────────────────────────────────────────────────────┐
│              MySQL Container                         │
│                                                       │
│  ┌───────────────────────────────────────────┐     │
│  │        MySQL 8.0 Server                    │     │
│  │        Port: 3306                          │     │
│  └───────────┬───────────────────────────────┘     │
│              │                                       │
│  ┌───────────▼───────────────────────────────┐     │
│  │     Database: inventory                    │     │
│  │                                             │     │
│  │     Table: items                            │     │
│  │     ├── id (INT, PK, AUTO_INCREMENT)       │     │
│  │     ├── name (VARCHAR 255)                 │     │
│  │     ├── quantity (INT)                     │     │
│  │     └── price (DECIMAL 10,2)               │     │
│  └────────────────────────────────────────────┘     │
│                                                       │
│  ┌────────────────────────────────────────────┐     │
│  │     Persistent Volume (10Gi)                │     │
│  │     Mount: /var/lib/mysql                   │     │
│  │     Survives pod restarts                    │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

## CI/CD Architecture

### Source to Deployment Flow

```
Developer                  Gitea                   Gitea Actions           SonarQube
    │                        │                          │                      │
    │  1. git push main      │                          │                      │
    ├───────────────────────>│                          │                      │
    │                        │  2. Webhook trigger      │                      │
    │                        ├─────────────────────────>│                      │
    │                        │                          │                      │
    │                        │                    3. Checkout code             │
    │                        │                    4. Install deps              │
    │                        │                    5. Lint                      │
    │                        │                    6. Test                      │
    │                        │                          │                      │
    │                        │                    7. Scan code                 │
    │                        │                          ├─────────────────────>│
    │                        │                          │    8. Quality Gate   │
    │                        │                          │<─────────────────────┤
    │                        │                          │    Pass/Fail         │
    │                        │                          │                      │
    │                        │                    9. Build Docker image         │
    │                        │                   10. Tag: main-abc1234         │
    │                        │                          │                      │
    │                        │  11. Push image          │                      │
    │                        │<─────────────────────────┤                      │
    │                        │                          │                      │
    │                        │                   12. Update k8s-manifests      │
    │                        │                       (new image tag)           │
    │                        │<─────────────────────────┤                      │
    │                        │                          │                      │
    │                        │                                                 │
    ▼                        ▼                                                 ▼

k8s-manifests Repo      ArgoCD                  Kubernetes Cluster
    │                       │                           │
    │  Git poll/webhook     │                           │
    ├──────────────────────>│                           │
    │                       │  Compare desired          │
    │                       │  vs actual state          │
    │                       │                           │
    │                       │  kubectl apply            │
    │                       ├──────────────────────────>│
    │                       │                           │
    │                       │  Watch rollout            │
    │                       │<──────────────────────────┤
    │                       │  (Readiness probes)       │
    │                       │                           │
    │                       │  Deployment complete      │
    │                       │<──────────────────────────┤
    ▼                       ▼                           ▼
```

## Kubernetes Resource Architecture

### Namespace Organization

```
Namespace: inventory
│
├── StatefulSet: mysql
│   ├── Pod: mysql-0
│   │   └── Volume: mysql-data (PVC)
│   └── Service: mysql (Headless ClusterIP)
│       └── Port: 3306
│
├── Deployment: backend (3 replicas)
│   ├── Pod: backend-xxxxx-yyyyy
│   ├── Pod: backend-xxxxx-zzzzz
│   ├── Pod: backend-xxxxx-aaaaa
│   └── Service: backend (ClusterIP)
│       └── Port: 3000
│
├── Deployment: frontend (3 replicas)
│   ├── Pod: frontend-xxxxx-yyyyy
│   ├── Pod: frontend-xxxxx-zzzzz
│   ├── Pod: frontend-xxxxx-aaaaa
│   └── Service: frontend (ClusterIP)
│       └── Port: 80
│
├── Ingress: inventory-ingress
│   ├── Rule: inventory.local
│   ├── Path: /api → backend:3000
│   ├── Path: /health → backend:3000
│   ├── Path: /ready → backend:3000
│   └── Path: / → frontend:80
│
├── ConfigMap: backend-config
│   ├── db-host: "mysql"
│   └── db-name: "inventory"
│
└── Secret: mysql-secret
    ├── root-password: (base64)
    ├── user: (base64)
    └── password: (base64)
```

## Data Flow

### Read Items Flow

```
User Browser
    │
    │ 1. HTTP GET /
    ▼
Ingress (inventory.local)
    │
    │ 2. Route to frontend
    ▼
Frontend Pod (nginx)
    │
    │ 3. Serve index.html + JS bundle
    ▼
User Browser (React App)
    │
    │ 4. Fetch GET /api/items
    ▼
Ingress (inventory.local)
    │
    │ 5. Route to backend
    ▼
Backend Pod (Express)
    │
    │ 6. SQL: SELECT * FROM items
    ▼
MySQL Pod
    │
    │ 7. Query result
    ▼
Backend Pod
    │
    │ 8. JSON response
    ▼
User Browser
    │
    │ 9. Render table
    ▼
User sees items list
```

### Create Item Flow

```
User Browser (Form Submit)
    │
    │ 1. POST /api/items
    │    Body: {name, quantity, price}
    ▼
Ingress
    │
    │ 2. Route to backend
    ▼
Backend Pod (Express)
    │
    │ 3. Validate input
    │ 4. SQL: INSERT INTO items...
    ▼
MySQL Pod
    │
    │ 5. Insert + return ID
    ▼
Backend Pod
    │
    │ 6. JSON response: {id, name, quantity, price}
    ▼
User Browser
    │
    │ 7. Refresh items list
    │ 8. Show success message
    ▼
User sees new item in table
```

## Deployment Strategy

### Rolling Update Process

```
Current State           New Deployment Triggered        Update in Progress
──────────────         ───────────────────────         ──────────────────

Backend Pods:          ArgoCD detects Git change       Old v1.0 → New v1.1
┌──────────┐          ┌──────────┐                    ┌──────────┐
│ v1.0     │          │ v1.0     │ ◄── traffic       │ v1.0     │ ◄┐
├──────────┤          ├──────────┤                    ├──────────┤  │
│ v1.0     │          │ v1.0     │ ◄── traffic       │ v1.1     │  ├─ Load
├──────────┤          ├──────────┤                    ├──────────┤  │  Balanced
│ v1.0     │          │ v1.0     │ ◄── traffic       │ v1.1     │ ◄┘
└──────────┘          └──────────┘                    └──────────┘
                              │                               │
                              │ kubectl apply                 │
                              │ New ReplicaSet                │
                              ▼                               ▼
                       ┌──────────┐                   ┌──────────┐
                       │ v1.1     │ ◄── wait ready    │ v1.1     │
                       └──────────┘                   └──────────┘
                                                           │
                       Readiness probe passes              │
                       Add to load balancer ───────────────┘
                       Terminate old pod
```

### Rollback Strategy

```
Current (Broken v1.1)              Rollback to v1.0             Restored
─────────────────────             ────────────────             ─────────

┌──────────┐                      ┌──────────┐                ┌──────────┐
│ v1.1 ✗   │                      │ v1.1 ✗   │                │ v1.0 ✓   │
├──────────┤                      ├──────────┤                ├──────────┤
│ v1.1 ✗   │  ← Failing           │ v1.0 ✓   │  ← Rollback   │ v1.0 ✓   │
├──────────┤     pods              ├──────────┤     in         ├──────────┤
│ v1.1 ✗   │                      │ v1.0 ✓   │     progress   │ v1.0 ✓   │
└──────────┘                      └──────────┘                └──────────┘

Methods:
1. ArgoCD UI        → Click rollback (30s)
2. Git revert       → git revert HEAD (3m)
3. Manual tag edit  → Update kustomization.yaml (5m)
4. kubectl undo     → kubectl rollout undo (1m)
```

## Network Architecture

### Service Discovery

```
Pod: backend-xxxxx-yyyyy
Environment:
  DB_HOST=mysql              ← Kubernetes DNS resolves to mysql Service
  DB_PORT=3306               ← Service port

DNS Resolution:
  mysql → mysql.inventory.svc.cluster.local → 10.x.x.x (ClusterIP)

Connection:
  backend pod → mysql service (ClusterIP) → mysql-0 pod
```

### Ingress Routing

```
External Request: http://inventory.local/api/items
    │
    ▼
Ingress Controller (nginx)
    │
    │ Match host: inventory.local
    │ Match path: /api
    │
    ▼
Backend Service (ClusterIP 10.x.x.x:3000)
    │
    │ Round-robin load balancing
    ▼
Backend Pod (one of 3 replicas)
```

## Security Architecture

### Multi-Layer Security

```
Layer 1: Container Security
┌─────────────────────────────────────┐
│ ✓ Non-root user (nodejs:1001)       │
│ ✓ Multi-stage build                 │
│ ✓ Minimal base image (alpine)        │
│ ✓ No dev dependencies in prod        │
└─────────────────────────────────────┘

Layer 2: Application Security
┌─────────────────────────────────────┐
│ ✓ SQL injection protection          │
│ ✓ Input validation                   │
│ ✓ Security headers (helmet)          │
│ ✓ CORS configured                    │
│ ✓ No secrets in code                 │
└─────────────────────────────────────┘

Layer 3: Kubernetes Security
┌─────────────────────────────────────┐
│ ✓ Secrets for credentials           │
│ ✓ ConfigMaps for config             │
│ ✓ Resource limits enforced           │
│ ✓ Namespace isolation                │
│ ✓ Network policies (to be added)    │
└─────────────────────────────────────┘

Layer 4: CI/CD Security
┌─────────────────────────────────────┐
│ ✓ SonarQube scanning                │
│ ✓ Quality gates enforced             │
│ ✓ Secrets in CI environment only    │
│ ✓ Image scanning (to be added)      │
└─────────────────────────────────────┘
```

## Scalability Architecture

### Horizontal Scaling

```
Low Traffic (2 replicas)          High Traffic (6 replicas)
────────────────────────          ────────────────────────

Backend:                          Backend:
┌──────────┐                      ┌──────────┐
│ Pod 1    │                      │ Pod 1    │
├──────────┤                      ├──────────┤
│ Pod 2    │                      │ Pod 2    │
└──────────┘                      ├──────────┤
                                  │ Pod 3    │
Frontend:                          ├──────────┤
┌──────────┐                      │ Pod 4    │
│ Pod 1    │                      ├──────────┤
├──────────┤                      │ Pod 5    │
│ Pod 2    │                      ├──────────┤
└──────────┘                      │ Pod 6    │
                                  └──────────┘
MySQL:
┌──────────┐                      Frontend:
│ Pod 0    │                      ┌──────────┐
└──────────┘                      │ Pod 1    │
(StatefulSet: 1 replica)          ├──────────┤
                                  │ Pod 2    │
Manual scaling:                   ├──────────┤
kubectl scale deployment          │ Pod 3    │
  backend --replicas=6            ├──────────┤
                                  │ Pod 4    │
                                  ├──────────┤
                                  │ Pod 5    │
                                  ├──────────┤
                                  │ Pod 6    │
                                  └──────────┘

                                  MySQL:
                                  ┌──────────┐
                                  │ Pod 0    │
                                  └──────────┘
                                  (StatefulSet: 1 replica)

                                  Future: HPA with metrics
```

## Observability Architecture (To Be Added)

### Monitoring Stack (Future Enhancement)

```
┌─────────────────────────────────────────────────────┐
│                   Prometheus                         │
│  Metrics Collection & Storage                        │
│  ← Scrapes metrics from all pods                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Metrics Query
                   ▼
┌─────────────────────────────────────────────────────┐
│                    Grafana                           │
│  Visualization & Dashboards                          │
│  - Pod CPU/Memory                                    │
│  - HTTP request rates                                │
│  - Database query times                              │
└─────────────────────────────────────────────────────┘
```

---

This architecture demonstrates **production-ready microservices** with focus on DevOps practices!
