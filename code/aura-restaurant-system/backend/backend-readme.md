# Backend - AURA Restaurant System (Spring Boot)

This is the backend service for the AURA Restaurant System. It is built using Java and Spring Boot.

## 📦 How Dependencies Work
You **do not** need to manually download or install any external Java libraries (like Spring Web, JPA, etc.). All dependencies and their exact versions are managed automatically by Maven via the `pom.xml` file.

When you run the build commands below, Maven will look at `pom.xml`, download the exact same versions of every library that the rest of the team is using, and set them up locally.

## 🛠️ Prerequisites for Local Development

To run this backend exactly as intended, make sure you have installed on your machine:
1. **Java Development Kit (JDK)** - Minimum version 17 (or strictly the version the team agreed upon).
2. **Maven** - For building the project (alternatively, you can use the IDE's built-in Maven).
3. **Docker Desktop** (Highly Recommended) - For running the database and other infrastructure in the exact same environment as everyone else.

## 🚀 Getting Started

### 1. Start Infrastructure (Docker)
Instead of installing databases (like MySQL/PostgreSQL) manually on your laptop, use our Docker Compose file located in the root folder. This ensures every team member runs the exact same database.
```bash
cd ../ # Go to the aura-restaurant-system folder
docker-compose up -d
```

### 2. Build and Download Dependencies
Navigate to the backend folder and tell Maven to download everything and build the project:
```bash
cd backend
mvn clean install
```

### 3. Run the Application
You can start the Spring Boot application using Maven:
```bash
mvn spring-boot:run
```
Alternatively, open the `backend` folder in an IDE like **IntelliJ IDEA** or **VS Code (with Java extensions)** and run the `AuraApplication.java` main class.

The API will be available at `http://localhost:8080` (or the port defined in `src/main/resources/application.yml`).

## � Environment Variables & Passwords

For ease of local development, this project uses **default fallback credentials** for the database (`aura_user` / `aura_password`). If you run `docker-compose up -d`, these default credentials will work automatically.

If you want to use your own secure passwords or connect to a production database:
1. Copy the `.env.example` file and rename it to `.env`.
   ```bash
   cp .env.example .env
   ```
2. Update the variables inside your new `.env` file with your real credentials.
*(Note: Your `.env` file is completely ignored by Git, ensuring your passwords are never pushed to GitHub!)*

## �🐳 Running the whole app in Docker (Optional)
If a `Dockerfile` is provided for this backend, you don't even need Java installed to run it. You can simply use `docker-compose up --build` from the root directory to run both the frontend, backend, and database in isolated, identical containers!