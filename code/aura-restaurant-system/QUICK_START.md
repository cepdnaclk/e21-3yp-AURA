# 🚀 AURA Quick Start Guide

## ✅ Prerequisites Installed
- ✅ Frontend: 170+ npm packages
- ✅ Backend: Java/Maven build (76 MB JAR ready)
- ✅ Docker: Compose file configured

---

## Start with Docker (Recommended)

**One command to run everything:**
```bash
cd code/aura-restaurant-system
docker-compose up --build
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Database: localhost:5432 (aura_user / aura_password)

**Stop everything:** `Ctrl + C` or `docker-compose down`

---

## Native Development (3 Terminals)

**Terminal 1 - PostgreSQL:**
```bash
cd code/aura-restaurant-system
docker-compose up -d postgres
```

**Terminal 2 - Backend (Java):**
```bash
cd code/aura-restaurant-system/backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Terminal 3 - Frontend (Node):**
```bash
cd code/aura-restaurant-system/frontend
npm run dev
# Runs on http://localhost:5173
```

---

## Frontend Commands
```bash
cd frontend
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Preview build locally
```

## Backend Commands
```bash
cd backend
mvn spring-boot:run    # Start server (port 8080)
mvn clean install      # Build
mvn test              # Run tests
```

---

## 🎯 System Features
- **Table Role**: Menu browsing, order placement, payment
- **Kitchen Role**: Kitchen Display System (KDS), order management
- **Admin Role**: Analytics, menu management, fleet monitoring
- **Real-time**: WebSocket + MQTT for live updates
- **Auth**: JWT-based (credentials in .env)

---

## 📚 Documentation
- `frontend/frontend-readme.md` - Frontend architecture & API contracts
- `backend/backend-readme.md` - Backend setup & configuration
- `README.md` - Overall system overview

---

**Ready to go! 🎉**
