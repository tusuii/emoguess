# Quick Start Guide

Get the inventory app running locally in **5 minutes** without Kubernetes!

## Prerequisites

- Node.js 20+
- Docker Desktop running

## Step 1: Start MySQL (30 seconds)

```bash
docker run -d \
  --name mysql-local \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=inventory \
  -p 3306:3306 \
  mysql:8.0
```

Wait 15 seconds for MySQL to initialize:
```bash
docker logs -f mysql-local
# Wait for: "ready for connections"
# Press Ctrl+C to exit logs
```

## Step 2: Start Backend (1 minute)

Open a new terminal:

```bash
cd backend-service
npm install
cp .env.example .env
npm start
```

You should see:
```
Backend service running on port 3000
Health check: http://localhost:3000/health
```

**Test it:**
```bash
# In another terminal
curl http://localhost:3000/health
# Should return: {"status":"ok"}

curl http://localhost:3000/api/items
# Should return: JSON array with 3 sample items
```

## Step 3: Start Frontend (1 minute)

Open another terminal:

```bash
cd frontend-service
npm install
cp .env.example .env
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Step 4: Use the App! (30 seconds)

Open your browser to **http://localhost:5173**

You should see:
- **Header**: "Inventory Management"
- **Form**: Add new item (name, quantity, price)
- **Table**: List of items (Laptop, Mouse, Keyboard)

**Try it:**
1. Fill in the form:
   - Name: `Monitor`
   - Quantity: `15`
   - Price: `299.99`
2. Click "Add Item"
3. See the new item appear in the table!

## Troubleshooting

### Backend won't start

**Error: "Cannot connect to MySQL"**
```bash
# Check MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs mysql-local

# Restart MySQL
docker restart mysql-local
```

**Error: "Port 3000 already in use"**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend-service/.env
PORT=3001
```

### Frontend won't start

**Error: "Port 5173 already in use"**
```bash
# Vite will automatically try next available port
# Or specify port:
npm run dev -- --port 5174
```

**Error: "Cannot connect to backend"**
```bash
# Make sure backend is running on port 3000
curl http://localhost:3000/health

# Check .env file
cat .env
# Should have: VITE_API_URL=http://localhost:3000
```

### Items not showing

**Check backend logs:**
```bash
# In backend terminal, you should see:
# GET /api/items
```

**Check browser console:**
```bash
# Open browser DevTools (F12)
# Go to Console tab
# Should NOT see CORS errors
```

**Test backend directly:**
```bash
curl http://localhost:3000/api/items
# Should return JSON array
```

## What's Running?

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| MySQL | 3306 | localhost:3306 | Database |
| Backend | 3000 | http://localhost:3000 | REST API |
| Frontend | 5173 | http://localhost:5173 | Web UI |

## API Endpoints

Test these with `curl`:

```bash
# Health check (always returns ok)
curl http://localhost:3000/health

# Readiness check (checks DB connection)
curl http://localhost:3000/ready

# Get all items
curl http://localhost:3000/api/items

# Add new item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Headphones",
    "quantity": 25,
    "price": 89.99
  }'
```

## Stop Everything

```bash
# Stop frontend (Ctrl+C in frontend terminal)
# Stop backend (Ctrl+C in backend terminal)

# Stop MySQL
docker stop mysql-local

# Remove MySQL (deletes data)
docker rm mysql-local

# Or keep MySQL for next time (just stop it)
docker stop mysql-local
```

## Next Time

```bash
# Start MySQL (if you kept it)
docker start mysql-local

# Or create new one (if you removed it)
docker run -d --name mysql-local \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=inventory \
  -p 3306:3306 mysql:8.0

# Start backend
cd backend-service && npm start

# Start frontend
cd frontend-service && npm run dev
```

## Development Tips

### Backend Auto-Restart

Install nodemon for auto-restart on file changes:
```bash
cd backend-service
npm install -D nodemon
npm run dev  # Instead of npm start
```

### Frontend Hot Reload

Already enabled! Edit `src/App.jsx` and see changes instantly.

### View Database

Connect with any MySQL client:
```
Host: localhost
Port: 3306
User: root
Password: rootpass
Database: inventory
```

Or use command line:
```bash
docker exec -it mysql-local mysql -u root -p
# Enter password: rootpass

mysql> USE inventory;
mysql> SELECT * FROM items;
mysql> exit
```

## What's Next?

Once local development works:

1. **Read the main README.md** for full project overview
2. **Read DEPLOYMENT.md** for Kubernetes deployment
3. **Check PROJECT_SUMMARY.md** for implementation details

## Common Questions

**Q: Can I use a different database?**
A: Yes, but you'll need to change connection string and init.sql syntax.

**Q: Can I run this in production?**
A: Not without Kubernetes! This is just for local dev. See DEPLOYMENT.md for production.

**Q: Why is the app so simple?**
A: By design! This project focuses on **DevOps/CI-CD**, not application features.

**Q: Can I add more features?**
A: Absolutely! Add edit/delete, search, authentication, etc. The DevOps setup stays the same.

---

**You're all set!** 🎉 Enjoy experimenting with the app locally.
