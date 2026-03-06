# AURA Restaurant System

This project consists of a React (Vite) frontend, a Spring Boot backend, and a PostgreSQL database.

## 🚀 The Easiest Way to Run Everything (For Teammates)

We have configured **Docker** so that nobody needs to manually install Java, Node.js, or PostgreSQL. The entire system will run exactly the same way for everyone.

### Prerequisites:
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it is running.

### How to Start the Entire Application (Frontend, Backend, Database):
1. Open your terminal and navigate to this folder (`code/aura-restaurant-system/`).
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Docker will automatically:
   * Start the PostgreSQL database on port 5432.
   * Download Maven/Java, build the Spring Boot Backend, and start it on port 8080.
   * Download Node.js, install NPM packages, and start the React Frontend on port 5173.

### Accessing the App
* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:8080](http://localhost:8080)
* **Database Credentials** (if you want to connect via DBeaver/PgAdmin):
  * URL: `localhost:5432`
  * database: `aura_db`
  * username: `aura_user`
  * password: `aura_password`

### How to Stop Everything:
To gracefully shut down all servers, hit `Ctrl + C` in the terminal, or open a new terminal in the same folder and run:
```bash
docker-compose down
```

---

## 🛠️ Advanced: Running Components Separately (Native Development)

If you prefer to run things natively to write code and debug, follow these steps:

### 1. Start ONLY the Database (Required)
```bash
docker-compose up -d postgres
```

### 2. Run the Backend Natively
Make sure you have **Java 21** and **Maven** installed.
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
*(See `backend/backend-readme.md` for more info).*

### 3. Run the Frontend Natively
Make sure you have **Node.js** installed.
```bash
cd frontend
npm install
npm run dev
```
*(See `frontend/frontend-readme.md` for more info).*
