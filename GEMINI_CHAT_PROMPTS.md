# AURA AWS Hosting - Gemini Chat Prompts

Use these prompts in **Google Gemini** (chat.google.com) to get detailed, AI-assisted guidance for hosting your AURA system on AWS.

---

## Prompt 1: Complete AWS Setup Overview

**Copy & paste this into Gemini:**

/ (repo root)
├─ QUICK_REFERENCE.md
├─ README.md
├─ README_AWS_DEPLOYMENT.md
├─ AWS_HOSTING_GUIDE.md
├─ GEMINI_CHAT_PROMPTS.md
├─ DEPLOYMENT_CHECKLIST.md
├─ DOMAIN_AND_AWS_REFERENCE.md
├─ code/
│  └─ aura-restaurant-system/
│     ├─ docker-compose.yml
│     ├─ get-docker.sh
│     ├─ README.md
│     ├─ backend/
│     │  ├─ backend-readme.md
│     │  ├─ Dockerfile
│     │  ├─ mvnw
│     │  ├─ mvnw.cmd
│     │  ├─ pom.xml
│     │  ├─ src/
│     │  │  ├─ main/
│     │  │  │  ├─ java/
│     │  │  │  └─ resources/
│     │  │  └─ test/
│     │  │     └─ java/
│     │  └─ target/
│     │     ├─ demo-0.0.1-SNAPSHOT.jar.original
│     │     ├─ classes/
│     │     │  ├─ application.properties
│     │     │  ├─ application.yml
│     │     │  └─ com/ (compiled classes)
│     │     └─ generated-sources/  (and other maven folders)
│     ├─ frontend/
│     │  ├─ frontend-readme.md
│     │  ├─ index.html
│     │  ├─ package.json
│     │  ├─ postcss.config.js
│     │  ├─ tailwind.config.js
│     │  ├─ vite.config.js
│     │  └─ src/
│     │     ├─ App.jsx
│     │     ├─ index.css
│     │     ├─ main.jsx
│     │     ├─ api/
│     │     │  ├─ authAPI.js
│     │     │  ├─ axiosInstance.js
│     │     │  ├─ INTEGRATION_GUIDE.js
│     │     │  ├─ menuAPI.js
│     │     │  ├─ mqttclient.js
│     │     │  ├─ orderAPI.js
│     │     │  ├─ README.md
│     │     │  └─ robotWebSocket.js
│     │     ├─ assets/
│     │     ├─ components/
│     │     ├─ context/
│     │     ├─ hooks/
│     │     ├─ pages/
│     │     ├─ store/
│     │     └─ utils/
│     ├─ mosquitto/
│     │  └─ config/
│     │     └─ mosquitto.conf
│     │  └─ data/
│     │  └─ log/
│     ├─ pi_controller/
│     │  ├─ audio_module.py
│     │  ├─ check_step.py
│     │  ├─ config.py
│     │  ├─ face_module.py
│     │  ├─ hardware_config.py
│     │  ├─ list_models.py
│     │  ├─ main_controller.py
│     │  ├─ mqtt_client.py
│     │  ├─ oled_module_2.py
│     │  ├─ oled_module.py
│     │  ├─ pan_tilt.py
│     │  ├─ README.md
│     │  ├─ requirements.txt
│     │  ├─ robot_face_tracker.py
│     │  ├─ robot_face_tracker1-old.py
│     │  ├─ robot_face_tracker11.py
│     │  ├─ step_motor.py
│     │  ├─ stepper_module.py
│     │  ├─ test_servo.py
│     │  ├─ test_touch_servo.py
│     │  ├─ test_voice_ai_speaker.py
│     │  ├─ test_voice.py
│     │  ├─ touch_module.py
│     │  ├─ touch_stepper.py
│     │  ├─ voice_module.py
│     ├─ voice_agent/
│     │  ├─ backend_client.py
│     │  ├─ FIX_GUIDE.md
│     │  ├─ nlp_engine.py
│     │  ├─ README.md
│     │  ├─ requirements.txt
│     │  ├─ start.sh
│     │  ├─ state_manager.py
│     │  ├─ stt_engine.py
│     │  ├─ tts_engine.py
│     │  └─ voice_agent.py
│     └─ voice-agent-test/
│        └─ src/
├─ docs/
│  ├─ _config.yml
│  ├─ index.html
│  ├─ README.md
│  ├─ assets/
│  │  └─ css/
│  │     └─ shared.css
│  ├─ pages/
│  │  ├─ architecture.html
│  │  ├─ features.html
│  │  ├─ how-it-works.html
│  │  ├─ team.html
│  │  └─ tech-stack.html
├─ data/
│  └─ index.json
├─ images/
└─ pages/


```
I have a full-stack AURA restaurant automation system with:

TECH STACK:
- Frontend: React 18 + Vite (TypeScript/JSX)
- Backend: Spring Boot 4.0.3 (Java 17, REST API, JWT Auth)
- Database: PostgreSQL 15
- Message Broker: Mosquitto MQTT (WebSockets on 9001)
- File Storage: Cloudinary for images
- Optional: Python Voice Agent (Google Generative AI)
- Containerization: Docker + Docker Compose

CURRENT DEPLOYMENT:
- Running locally via: docker-compose up
- Services: backend (8080), frontend (5173), postgres (5432), mosquitto (1883/9001)

TARGET: Deploy to AWS Free Tier for production testing

REQUIREMENTS:
1. Zero infrastructure cost in year 1 (free tier account)
2. Separate database from application servers
3. Preserve real-time MQTT communication
4. Support 50-100 concurrent users initially
5. Professional domain name
6. HTTPS/SSL certificate
7. Automated backups
8. Production-grade security

QUESTIONS:
- What's the best AWS architecture for this multi-service setup on free tier?
- Should I use Elastic Beanstalk or EC2 + manual Docker Compose?
- How do I migrate data from local PostgreSQL to RDS?
- What's the estimated AWS bill for 1 year + beyond?
- How do I handle the Raspberry Pi controllers (Pi Controller) - cloud simulation vs. real hardware?
- What's the deployment command sequence?

Please provide:
1. Recommended AWS service architecture diagram (text-based is fine)
2. Step-by-step setup for each service
3. Cost breakdown and free tier eligibility
4. Data migration strategy
5. Deployment checklist
6. Post-deployment validation steps
```

---

## Prompt 2: RDS PostgreSQL & Data Migration

**Copy & paste this into Gemini:**

```
I need to set up PostgreSQL on AWS RDS and migrate data from my local database.

CURRENT STATE:
- Local PostgreSQL 15 (via Docker)
- Database: aura_db
- User: aura_user
- Tables: users, menu_items, orders, order_items, payments, kitchen_display
- Estimated data: 1-5GB (small database)
- Framework: Spring Boot + Hibernate (using JPA for ORM)

RDS REQUIREMENTS:
- Instance type: db.t3.micro (free tier)
- Storage: 20GB (free tier)
- Engine: PostgreSQL 15
- Multi-AZ: No (to save cost)
- Backup retention: 7 days
- Automated backups: Enabled

MIGRATION PLAN:
- I'm using Spring Boot with Hibernate
- My application.yml has: spring.jpa.hibernate.ddl-auto = update
- Question: Should I use 'create' vs 'validate' vs 'update' in production?

PLEASE PROVIDE:
1. Step-by-step RDS setup on AWS console
2. Security group configuration for EC2 → RDS connectivity
3. Database migration approach (logical export/import vs. AWS DMS vs. Hibernate auto-creation)
4. Spring Boot configuration changes needed
5. Backup & recovery procedures
6. Monitoring for database performance
7. Cost estimation for RDS usage
8. What happens if I exceed free tier limits?
9. Failover and HA strategies on free tier
10. Connection pooling recommendations for Spring Boot
```

---

## Prompt 3: EC2 & Docker Deployment

**Copy & paste this into Gemini:**

```
I need to deploy a multi-container application on AWS EC2 using Docker Compose.

APPLICATION CONTAINERS:
1. Backend (Spring Boot JAR, Java 17)
   - Port: 8080
   - Environment: DB_URL, JWT_SECRET, Cloudinary credentials
   - Health check: GET /api/health
   - Memory: ~512MB
   - Startup time: 30-45 seconds

2. Frontend (Node.js + Vite, production build)
   - Port: 5173 (dev) or static served via Nginx (prod)
   - Build step: npm run build → generates dist/
   - Memory: ~100MB
   - Should I serve from Nginx instead of Vite dev server?

3. MQTT Broker (Mosquitto)
   - Ports: 1883 (MQTT), 9001 (WebSockets)
   - Config: mosquitto.conf (custom settings)
   - Persistence: data volume
   - Memory: ~50MB

EC2 SPECIFICATIONS:
- Instance type: t3.micro (free tier)
- AMI: Ubuntu 22.04 LTS
- Storage: 30GB (free tier)
- EBS Type: gp3

DEPLOYMENT STRATEGY:
- Using docker-compose.yml for orchestration
- Current file includes: postgres (need to remove), backend, frontend, mosquitto
- Database will be external RDS (not Docker container)

MY QUESTIONS:
1. What's the recommended docker-compose.yml for production (no local DB)?
2. Should frontend be served by Vite dev server or Nginx?
3. How do I setup auto-restart on crashes?
4. Should I use Docker Swarm or just compose?
5. Memory/CPU constraints for t3.micro - will all containers fit?
6. How do I monitor container health?
7. What's the log strategy for production?
8. How do I handle environment variables securely?

PLEASE PROVIDE:
1. Production-ready docker-compose.yml template
2. Recommended Dockerfile optimizations for each service
3. EC2 setup steps (instance creation, security groups, Docker install)
4. Deployment command sequence
5. Health check configuration
6. Log aggregation strategy
7. Container resource limits
8. Auto-scaling considerations (if applicable)
```

---

## Prompt 4: Domain Name & DNS Setup

**Copy & paste this into Gemini:**

```
I need to register a domain name and setup DNS for my AURA restaurant system.

REQUIREMENTS:
- Professional domain suitable for B2B/commercial use
- Should reflect "restaurant automation" or "robot ordering system"
- Budget: $10-30/year for domain
- Need HTTPS/SSL certificate
- Want to use AWS Route 53 for DNS
- Consider SEO implications (if public-facing)

DOMAIN NAME IDEAS (feedback needed):
- aura-restaurant.com
- auradining.co.uk
- auraobot.com
- aurapos.io
- robotorder.ai
- automenu.io

MY QUESTIONS:
1. Which domain would be most professional and memorable?
2. Should I register .com, .io, .ai, or other TLD?
3. What are the SEO implications of each?
4. How do I avoid domain parking/parking fees?
5. Should I buy multiple variations (aura.com, aura.io, etc.)?
6. Free domain registrars vs. paid - pros/cons?

DNS SETUP:
- My application is on EC2 (public IP: TBD)
- I have frontend on port 5173 and backend on port 8080
- Want to map: aura-restaurant.com → EC2 IP
- Want www subdomain support
- Want to add HTTPS

PLEASE PROVIDE:
1. Top 5 domain name recommendations with reasoning
2. Domain registration step-by-step (Route 53 + alternatives)
3. DNS A record configuration
4. Subdomain setup (www, api, admin, etc.)
5. Email subdomain (if needed for system notifications)
6. MX records for email (if applicable)
7. How to point third-party domain registrar to Route 53
8. Cost comparison: Route 53 vs Godaddy vs Namecheap
9. DNSSEC setup
10. What happens if I need to migrate hosting later?
```

---

## Prompt 5: HTTPS/SSL Certificate Setup

**Copy & paste this into Gemini:**

```
I need to secure my application with HTTPS/SSL certificate.

CURRENT STATE:
- Domain: aura-restaurant.com (or similar)
- Hosting: AWS EC2 with Nginx reverse proxy
- Application: Spring Boot backend (8080) + React frontend (5173)
- Requirement: HTTPS on all endpoints

CERTIFICATE OPTIONS:
1. AWS Certificate Manager (ACM)
   - Question: Is this free for EC2 instances?
   - How do I attach to Nginx?

2. Let's Encrypt with Certbot
   - Renewal: Automated?
   - Integration with Nginx: Steps?

3. Self-signed (for development only)

SSL REQUIREMENTS:
- aura-restaurant.com ✓
- www.aura-restaurant.com ✓
- api.aura-restaurant.com (optional)
- admin.aura-restaurant.com (optional)
- HSTS headers (for security)
- Redirect HTTP → HTTPS

NGINX CONFIGURATION:
- Currently running on EC2
- Routes: /api/ → backend, / → frontend, /mqtt → Mosquitto WebSocket
- Need to add SSL termination at Nginx level

MY QUESTIONS:
1. Which certificate option is best for free tier?
2. How do I automate certificate renewal?
3. What's the impact on MQTT WebSocket with HTTPS?
4. Should I use ACM or Let's Encrypt?
5. How long does certificate validation take?
6. What if I need to change IP addresses later?

PLEASE PROVIDE:
1. Complete Nginx SSL configuration
2. Certificate installation steps
3. Auto-renewal setup
4. HSTS, CSP, and other security headers
5. How to test SSL/TLS on CLI
6. Certificate monitoring and alerts
7. Renewal checklist
8. Troubleshooting common SSL errors
9. Performance implications of SSL
10. Rate limiting to prevent certificate abuse
```

---

## Prompt 6: Monitoring, Logging & Maintenance

**Copy & paste this into Gemini:**

```
I need production monitoring, logging, and maintenance procedures.

APPLICATION MONITORING NEEDS:
1. Application Health
   - Backend API uptime
   - Frontend availability
   - Database connectivity
   - MQTT broker status

2. Infrastructure Monitoring
   - EC2 CPU/Memory/Disk usage
   - RDS database performance
   - Network I/O

3. Application Logs
   - Spring Boot application logs
   - Nginx access/error logs
   - Docker container logs
   - Application error tracking

4. Alert Conditions
   - High CPU (>80%)
   - Low disk space (<5GB)
   - Database connection failures
   - API errors (5xx status codes)
   - Deployment failures

BUDGET: Minimal (free tier preferred for 1 year)

CURRENT SETUP:
- EC2 instance with Docker
- RDS PostgreSQL
- Nginx reverse proxy
- Spring Boot backend
- React frontend

MY QUESTIONS:
1. Should I use AWS CloudWatch, Datadog, New Relic, or open-source tools?
2. How do I setup log aggregation for Docker containers?
3. What's the free tier offering for monitoring?
4. How do I create dashboards for team visibility?
5. Email vs. SMS alerts - which is better?
6. How do I set historical data retention?
7. Cost implications of logging at scale?
8. How do I debug production issues?

MAINTENANCE TASKS:
- Database backups (frequency?)
- Container image updates (security patches)
- Certificate renewal (automated?)
- Dependency updates (Spring Boot, npm packages)
- Security scanning

PLEASE PROVIDE:
1. Complete monitoring architecture
2. CloudWatch setup (or alternative)
3. Alerting configuration
4. Dashboard template
5. Log aggregation strategy
6. Metrics to track
7. Maintenance schedule
8. Backup and recovery procedures
9. Disaster recovery plan
10. Cost optimization for year 2+
```

---

## Prompt 7: Security Best Practices

**Copy & paste this into Gemini:**

```
I need production-grade security for my AURA system hosted on AWS.

SECURITY REQUIREMENTS:
1. Data Protection
   - Sensitive data: user passwords, order history, payments
   - Encryption at rest: RDS, S3
   - Encryption in transit: HTTPS, TLS
   - Database credentials management

2. Access Control
   - Authentication: JWT tokens (already implemented)
   - Authorization: Role-based (admin, staff, customer, robot)
   - API authentication: Bearer token validation
   - Database user isolation

3. Network Security
   - Security groups (firewall rules)
   - VPC isolation (if needed)
   - DDoS protection
   - Rate limiting on APIs

4. Application Security
   - SQL injection prevention (using Hibernate JPA - already protected)
   - XSS prevention (React handles most of this)
   - CSRF tokens
   - Input validation
   - CORS configuration

5. Infrastructure Security
   - EC2 SSH key management
   - IAM user/role setup
   - No root account usage
   - Secrets management (Cloudinary, JWT secret)

6. Compliance & Monitoring
   - Access logging
   - Change tracking
   - Vulnerability scanning
   - Penetration testing readiness

CURRENT VULNERABILITIES CONCERNS:
- Storing passwords securely in Spring Boot
- JWT secret management
- Cloudinary credentials exposure
- MQTT broker authentication
- Database password security

BUDGET: Free tier only for security tools

QUESTIONS:
1. How do I securely store and rotate secrets?
2. Should I use AWS Secrets Manager or environment variables?
3. How do I implement rate limiting on APIs?
4. What's the security group configuration for EC2 → RDS?
5. How do I prevent unauthorized MQTT publishing?
6. Should I use VPC for isolation?
7. What's the minimum security checklist before production?
8. How do I audit access logs?

PLEASE PROVIDE:
1. AWS IAM setup (users, roles, permissions)
2. Security group configuration template
3. Secrets management strategy
4. Network security architecture
5. API rate limiting setup
6. Database access control
7. MQTT broker authentication
8. Backup encryption
9. Pre-production security checklist
10. Incident response plan template
```

---

## Prompt 8: Troubleshooting & Post-Deployment

**Copy & paste this into Gemini:**

```
Help me troubleshoot common issues after deploying AURA on AWS.

COMMON ISSUES ANTICIPATED:
1. Connection Issues
   - Backend can't reach RDS database
   - Frontend can't reach backend API
   - MQTT WebSocket connection failures
   - Timeout errors from Cloudinary

2. Performance Issues
   - Slow API responses
   - Frontend page load slow
   - Database queries taking too long
   - Memory exhaustion on t3.micro

3. Deployment Issues
   - Docker container exits unexpectedly
   - Docker image build failures
   - Port conflicts
   - Volume mount issues

4. SSL/Certificate Issues
   - Certificate expiration
   - HTTPS connection refused
   - Mixed content warnings

5. Data Issues
   - Data loss during migration
   - Backup not working
   - Database inconsistency

DEBUGGING TOOLS AVAILABLE:
- AWS CloudWatch
- Docker CLI (docker logs, docker exec)
- SSH into EC2
- AWS RDS monitoring
- Spring Boot actuators
- Browser DevTools
- curl / Postman for API testing

TYPICAL ERROR MESSAGES I MIGHT SEE:
- "Connection refused" (port not listening)
- "Timeout" (network/firewall issue)
- "Disk space low" (EC2 storage full)
- "OutOfMemory" (JVM heap)
- "CertificateVerifyFailed" (SSL issue)

BEFORE GOING LIVE:
- Load testing: Can it handle 100 concurrent users?
- Data validation: Are all records migrated correctly?
- Failover testing: What happens if EC2 crashes?
- Security scan: Any vulnerabilities detected?

QUESTIONS:
1. How do I read Docker container logs when things go wrong?
2. How do I SSH into EC2 and investigate issues?
3. What are the most common causes of Spring Boot startup failures?
4. How do I test MQTT connectivity from the server?
5. How do I check if RDS is reachable from EC2?
6. How do I monitor real-time requests/responses?
7. What should I have in a runbook for emergency fixes?

PLEASE PROVIDE:
1. Complete troubleshooting flowchart (text-based)
2. Common error messages and solutions
3. Docker debugging commands
4. AWS CLI troubleshooting commands
5. Spring Boot logs interpretation guide
6. Performance profiling methods
7. Load testing approach
8. Backup recovery procedures
9. Rollback procedures
10. On-call runbook template
```

---

## How to Use These Prompts

### Step-by-Step Process:

1. **Start with Prompt 1** (AWS Setup Overview)
   - Get overall architecture
   - Understand service interactions
   - Clarify any doubts

2. **Then use Prompts 2-5** in order:
   - Prompt 2: Database setup
   - Prompt 3: EC2 & Docker
   - Prompt 4: Domain name
   - Prompt 5: SSL certificate

3. **Finish with Prompts 6-8**:
   - Prompt 6: Monitoring
   - Prompt 7: Security
   - Prompt 8: Troubleshooting

### Tips for Best Results:

- **Be specific**: If Gemini asks clarifying questions, answer them with your actual environment details
- **Share configs**: When asked, share your actual `docker-compose.yml`, `application.yml`, or other configs
- **Ask follow-ups**: If something is unclear, ask Gemini to clarify further
- **Request commands**: Ask for exact CLI commands (AWS CLI, Docker, etc.) that you can copy/paste
- **Request templates**: Ask for configuration templates you can adapt

---

## Expected Gemini Responses

Each prompt should generate responses with:
- ✅ Architecture diagrams (text-based ASCII)
- ✅ Step-by-step procedures
- ✅ Code/configuration examples
- ✅ Command-line instructions
- ✅ Estimated costs
- ✅ Troubleshooting guides
- ✅ Security considerations
- ✅ Best practices
- ✅ Common pitfalls
- ✅ Links to AWS documentation

---

## Quick Reference: AWS Free Tier Limits

Before sharing with Gemini, remember these free tier limits:

| Service | Free Tier Limit |
|---------|-----------------|
| **EC2** | 750 hours/month t3.micro instance (1 year) |
| **RDS** | db.t3.micro, 20GB storage, 20GB backup (1 year) |
| **S3** | 5GB storage, 20K GET, 2K PUT per month |
| **Route 53** | $0.50/month per hosted zone + query fees |
| **ACM** | Free SSL/TLS certificates (unlimited) |
| **Data Out** | 100GB/month free, then $0.09/GB |
| **Data In** | All free |

After 12 months: Estimated **$30-50/month** for similar setup.

---

## Next Steps After Gemini Response

1. Take Gemini's guidance and follow the steps
2. Document what you do (for team knowledge)
3. Test each component individually
4. Integrate components gradually
5. Run load tests
6. Update security settings
7. Setup monitoring
8. Create runbooks
9. Train team on deployment
10. Plan for production scale

