# AURA System - Quick Reference Card

## 🎯 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Frontend (React) │ Kitchen Display │ Admin Dashboard │ RobotUI │
│              (Vite @ http://localhost:5173)                     │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ REST API / WebSocket
┌──────────────────────────────────▼──────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│   Spring Boot Backend (Controllers → Services → Repositories)   │
│              (@ http://localhost:8080)                          │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ JDBC/JPA
┌──────────────────────────────────▼──────────────────────────────┐
│                      DATA PERSISTENCE LAYER                      │
│         PostgreSQL Database (aura_db @ localhost:5432)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Root Structure

```
e21-3yp-AURA/
├── README.md                    # Main project README
├── CODEBASE_OVERVIEW.md        # Complete documentation (this file)
│
└── code/aura-restaurant-system/
    ├── docker-compose.yml       # Multi-container orchestration
    ├── .env                     # Secrets & config
    │
    ├── backend/                 # Java Spring Boot (Port 8080)
    │   ├── pom.xml
    │   └── src/main/java/com/aura/
    │       ├── controller/      # REST endpoints
    │       ├── service/         # Business logic
    │       ├── model/           # Database entities
    │       ├── security/        # JWT & auth
    │       └── config/          # Spring config
    │
    ├── frontend/                # React + Vite (Port 5173)
    │   ├── package.json
    │   ├── vite.config.js
    │   └── src/
    │       ├── pages/           # LoginPage, RobotUI, KitchenDisplay, AdminDashboard
    │       ├── components/      # Button, Card, Input, StatusBadge, Navbar, Footer
    │       ├── api/             # authAPI, menuAPI, orderAPI, mqttclient
    │       ├── context/         # AppContext, RestaurantContext
    │       ├── store/           # useOrderStore (Zustand)
    │       └── utils/           # helpers, menuImages
    │
    ├── pi_controller/           # Python Raspberry Pi
    │   ├── main_controller.py   # Orchestrator
    │   ├── voice_module.py      # Speech + AI (Gemini)
    │   ├── audio_module.py      # Text-to-speech
    │   ├── face_module.py       # Face tracking (OpenCV)
    │   ├── servo_module.py      # Pan/Tilt control
    │   ├── mqtt_client.py       # MQTT communication
    │   └── requirements.txt     # Python dependencies
    │
    ├── mosquitto/               # MQTT Broker (Port 1883)
    │   ├── config/mosquitto.conf
    │   ├── data/
    │   └── log/
    │
    └── docs/                    # Documentation website
        ├── index.html           # Homepage
        ├── pages/               # architecture, features, tech-stack, team, how-it-works
        └── assets/              # CSS, images
```

---

## 🚀 Quick Start Commands

### **Backend (Java/Spring Boot)**
```bash
cd code/aura-restaurant-system/backend
mvn clean install          # Download dependencies
mvn spring-boot:run        # Start server (localhost:8080)
```

### **Frontend (React/Vite)**
```bash
cd code/aura-restaurant-system/frontend
npm install                # Install dependencies
npm run dev                # Start dev server (localhost:5173)
npm run build              # Production build
```

### **Pi Controller (Python)**
```bash
cd code/aura-restaurant-system/pi_controller
python -m venv venv
source venv/bin/activate   # (Or: venv\Scripts\activate on Windows)
pip install -r requirements.txt
python main_controller.py
```

### **Everything with Docker**
```bash
cd code/aura-restaurant-system
docker-compose up -d       # Start all services
docker-compose logs -f     # View logs
docker-compose down        # Stop all services
```

---

## 🔌 Services & Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 5173 | http://localhost:5173 | React UI |
| **Backend** | 8080 | http://localhost:8080 | REST API |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **MQTT Broker** | 1883 | localhost:1883 | Message broker |
| **MQTT WebSocket** | 9001 | localhost:9001 | WebSocket broker |

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Spring Boot | 4.0.3 |
| | Java | 17 |
| | PostgreSQL | 15 |
| | JWT | 0.11.5 |
| **Frontend** | React | 18.3.1 |
| | Vite | 6.0.0 |
| | Tailwind CSS | 3.4.16 |
| | Axios | 1.7.9 |
| | Zustand | 4.5.5 |
| **Pi Controller** | Python | 3.x |
| | OpenCV | Latest |
| | Google Gemini API | Latest |
| **Infrastructure** | Docker | Latest |
| | Docker Compose | Latest |
| | MQTT (Mosquitto) | Latest |

---

## 📋 File Purpose Quick Reference

### Backend Java Classes
```
AuthController.java        → Login, register, token validation
AdminController.java       → Admin dashboard APIs
ImageController.java       → Image upload to Cloudinary
AuthService.java          → Authentication business logic
AdminAnalyticsService.java → Revenue stats & analytics
ImageService.java         → Image management
User.java                 → User database entity
```

### Frontend React Components
```
pages/LoginPage.jsx           → Login screen
pages/RobotUI.jsx             → Table ordering interface
pages/KitchenDisplay.jsx       → Kitchen order display
pages/AdminDashboard.jsx       → Admin analytics
components/common/Button.jsx   → Reusable button
components/common/Card.jsx     → Card container
components/layout/Navbar.jsx   → Top navigation
context/AppContext.jsx         → Global state & mock data
api/authAPI.js                 → Authentication endpoints
api/orderAPI.js                → Order operations
api/mqttclient.js              → MQTT connection
store/useOrderStore.js         → Zustand order store
```

### Pi Controller Python Modules
```
main_controller.py    → Entry point & orchestrator
voice_module.py       → Speech recognition + Gemini AI
audio_module.py       → Text-to-speech (gTTS)
face_module.py        → Face tracking (OpenCV)
servo_module.py       → Pan/Tilt servo control
mqtt_client.py        → MQTT communication
touch_module.py       → Touch input handling
oled_module.py        → OLED display driver
config.py             → Configuration settings
```

---

## 🔐 Environment Variables

### Backend (`.env` in root)
```
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Pi Controller (`.env` in pi_controller/)
```
GEMINI_API_KEY=your_gemini_api_key
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### Database (from docker-compose.yml)
```
POSTGRES_USER=aura_user
POSTGRES_PASSWORD=aura_password
POSTGRES_DB=aura_db
```

---

## 🔄 System Data Flow

1. **User Ordering** (RobotUI):
   - User interacts with React UI
   - Order data stored in AppContext (frontend)
   - Sent to Backend via REST API
   - Backend stores in PostgreSQL

2. **Kitchen Display** (KitchenDisplay):
   - Backend retrieves orders from DB
   - Frontend displays on KDS
   - Status updates via WebSocket/MQTT
   - Real-time UI refresh

3. **Admin Dashboard** (AdminDashboard):
   - Backend queries analytics data
   - Displays revenue stats & metrics
   - Menu management capabilities

4. **Robot Interaction** (Pi Controller):
   - Voice input → Google Gemini API response
   - MQTT communication with backend
   - Face tracking via OpenCV
   - Servo control for pan/tilt movement

---

## 📚 Documentation Pages

| Page | Location | Content |
|------|----------|---------|
| **Architecture** | docs/pages/architecture.html | System design & components |
| **Features** | docs/pages/features.html | Core capabilities |
| **Tech Stack** | docs/pages/tech-stack.html | Technology choices |
| **How It Works** | docs/pages/how-it-works.html | User workflows |
| **Team** | docs/pages/team.html | Team members |

---

## 🐛 Debugging Tips

### Backend Issues
```bash
# View Spring Boot logs
mvn spring-boot:run -X

# Check database connection
docker-compose logs postgres

# Rebuild without cache
mvn clean install -U
```

### Frontend Issues
```bash
# Clear cache & reinstall
rm -rf node_modules package-lock.json
npm install

# Check Vite server
npm run dev -- --debug

# Build troubleshooting
npm run build -- --debug
```

### Pi Controller Issues
```bash
# Test MQTT connection
mosquitto_pub -h localhost -t "test" -m "hello"

# View dependencies
pip list

# Test Gemini API
python -c "import google.generativeai; print('OK')"
```

---

## ✅ Status Checklist

- [ ] Backend running (port 8080)
- [ ] Frontend running (port 5173)
- [ ] PostgreSQL accessible (port 5432)
- [ ] MQTT broker running (port 1883)
- [ ] .env files configured
- [ ] Dependencies installed
- [ ] Docker containers healthy (if using Docker)

---

## 📞 Team Contact

- **E/21/245**: MADHUSHAN S.K.A.K.
- **E/21/113**: DISSANAYAKE H.G.K.V.D.C.
- **E/21/024**: AMARANGA S.G.I.
- **E/21/407**: THENNAKOON T.M.I.I.C.

---

**Project**: AURA - Automated Urban Restaurant Assistant  
**Status**: In Development (May 2026)  
**Last Updated**: May 29, 2026
