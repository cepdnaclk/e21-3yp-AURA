# AURA Restaurant System - AWS Free Tier Hosting Guide

## Project Overview

**AURA (Automated Urban Restaurant Assistant)** is a comprehensive restaurant automation system with the following components:

### Architecture Components
1. **Spring Boot Backend** (Java 17, Spring Boot 4.0.3)
   - REST API for orders, menu, and database management
   - JWT authentication & Spring Security
   - PostgreSQL database
   - Cloudinary integration for image uploads

2. **React Frontend** (React 18, Vite)
   - Interactive UI for orders and management
   - Tailwind CSS styling
   - MQTT WebSocket support
   - Zustand state management

3. **MQTT Broker** (Mosquitto)
   - Real-time communication between robots and servers
   - WebSocket support on port 9001

4. **Python Services** (Optional - separate deployment)
   - Pi Controller: Raspberry Pi-based robot control
   - Voice Agent: AI-powered voice interaction via Google Generative AI

5. **Database**
   - PostgreSQL (production database)

---

## AWS Free Tier Deployment Strategy

### Recommended AWS Services (All Free Tier Eligible)

| Component | AWS Service | Capacity | Cost |
|-----------|------------|----------|------|
| **Backend & Frontend** | EC2 (t3.micro) + Elastic Beanstalk | 1GB RAM, 1 vCPU | Free (1 year) |
| **Database** | RDS PostgreSQL (db.t3.micro) | 20GB storage | Free (1 year) |
| **Message Broker** | EC2 + Mosquitto (same instance) | Shared resources | Free (1 year) |
| **Static Assets** | S3 | 5GB storage | Free (always) |
| **DNS & CDN** | Route 53 + CloudFront | Basic tier | ~$0.50/month + usage |
| **SSL/TLS** | ACM (AWS Certificate Manager) | Unlimited certificates | Free |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USERS & ROBOTS                        │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────┬──────────────┐
         │                      │              │
    ┌────▼────┐          ┌──────▼──────┐  ┌──▼──────┐
    │CloudFront│          │ Elastic LB  │  │Route 53 │
    │(CDN)    │          │ (Optional)  │  │(DNS)    │
    └────┬────┘          └──────┬──────┘  └─────────┘
         │                      │
    ┌────▼──────────────────────▼──────┐
    │       EC2 Instance(s)              │
    │  (t3.micro - Docker Container)    │
    ├──────────────────────────────────┤
    │ • React Frontend (Vite)           │
    │ • Spring Boot Backend             │
    │ • Mosquitto MQTT Broker           │
    │ • Nginx (Reverse Proxy)           │
    └────┬─────────────────────────────┘
         │
    ┌────▼─────────────────┐
    │  RDS PostgreSQL      │
    │  (db.t3.micro)       │
    └──────────────────────┘
```

---

## Step-by-Step AWS Hosting Setup

### Phase 1: Prerequisites & AWS Account Setup

1. **Create AWS Account**
   - Go to aws.amazon.com and create a free tier account
   - Enable free tier
   - Set up billing alerts (recommended: $1 limit)

2. **Setup IAM User (Recommended)**
   - Don't use root account for deployments
   - Create IAM user with EC2, RDS, S3, Route53, and ACM permissions

3. **Install AWS CLI**
   ```bash
   # Install AWS CLI v2
   # Follow: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   
   # Configure AWS credentials
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region (us-east-1 recommended), Output (json)
   ```

### Phase 2: Database Setup (RDS PostgreSQL)

1. **Create RDS PostgreSQL Instance**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (free tier)
   - Storage: 20GB (free tier)
   - DB name: `aura_db`
   - Master username: `aura_user`
   - Master password: (generate strong password)
   - Public accessibility: Yes (only in testing; lock down security group later)

2. **Security Group Configuration**
   - Allow inbound traffic on port 5432
   - Source: Your EC2 security group (not public 0.0.0.0 in production)

3. **Note Down Connection String**
   ```
   postgresql://aura_user:PASSWORD@aura-db.REGION.rds.amazonaws.com:5432/aura_db
   ```

### Phase 3: EC2 Instance Setup

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS (free tier eligible)
   - Instance type: t3.micro (free tier)
   - Key pair: Create and download `.pem` file (store securely)
   - Storage: 30GB (free tier = 30GB/month)
   - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5173, 8080

2. **Connect to Instance**
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

3. **Install Docker & Docker Compose**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Verify
   docker --version
   docker-compose --version
   ```

4. **Clone Repository & Setup Environment**
   ```bash
   # Clone your project (or upload via git)
   git clone https://github.com/YOUR_GITHUB/e21-3yp-AURA.git
   cd e21-3yp-AURA/code/aura-restaurant-system
   
   # Create environment file for AWS RDS
   cat > .env.aws << EOF
   DB_URL=jdbc:postgresql://aura-db.REGION.rds.amazonaws.com:5432/aura_db
   DB_USERNAME=aura_user
   DB_PASSWORD=YOUR_RDS_PASSWORD
   JWT_SECRET=your-secret-key-here-min-32-chars
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EOF
   ```

### Phase 4: Docker Deployment on EC2

1. **Create Modified docker-compose.yml for AWS**
   ```yaml
   # Save as docker-compose.aws.yml
   version: '3.8'
   
   services:
     # Only deploy to AWS (no local PostgreSQL)
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       container_name: aura_backend
       restart: always
       ports:
         - "8080:8080"
       environment:
         DB_URL: jdbc:postgresql://aura-db.REGION.rds.amazonaws.com:5432/aura_db
         DB_USERNAME: aura_user
         DB_PASSWORD: ${DB_PASSWORD}
         SPRING_JPA_HIBERNATE_DDL_AUTO: validate
         JWT_SECRET: ${JWT_SECRET}
         CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
         CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
         CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
     
     frontend:
       image: node:20-alpine
       container_name: aura_frontend
       working_dir: /app
       volumes:
         - ./frontend:/app
         - /app/node_modules
       ports:
         - "5173:5173"
       environment:
         - VITE_BACKEND_URL=http://YOUR_EC2_PUBLIC_IP:8080
       command: sh -c "npm install && npm run build && npm run preview -- --host 0.0.0.0"
     
     mosquitto:
       image: eclipse-mosquitto
       container_name: aura_mosquitto
       restart: always
       ports:
         - "1883:1883"
         - "9001:9001"
       volumes:
         - ./mosquitto/config:/mosquitto/config
         - ./mosquitto/data:/mosquitto/data
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Load environment variables
   export $(cat .env.aws | xargs)
   
   # Start services (on EC2)
   docker-compose -f docker-compose.aws.yml up -d
   
   # View logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
   # Test services
   curl http://localhost:8080/health
   curl http://localhost:5173
   curl http://localhost:1883
   ```

### Phase 5: Setup Nginx Reverse Proxy (Optional but Recommended)

1. **Install Nginx**
   ```bash
   sudo apt install nginx -y
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. **Configure Nginx**
   ```bash
   # Create nginx config
   sudo tee /etc/nginx/sites-available/aura > /dev/null << EOF
   upstream backend {
       server localhost:8080;
   }
   
   upstream frontend {
       server localhost:5173;
   }
   
   upstream mqtt {
       server localhost:9001;
   }
   
   server {
       listen 80;
       server_name _;
       
       # API routes
       location /api/ {
           proxy_pass http://backend/;
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
       }
       
       # MQTT WebSocket
       location /mqtt {
           proxy_pass http://mqtt;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection "upgrade";
       }
       
       # Frontend (fallback for SPA routing)
       location / {
           proxy_pass http://frontend;
           proxy_set_header Host \$host;
       }
   }
   EOF
   
   # Enable the config
   sudo ln -s /etc/nginx/sites-available/aura /etc/nginx/sites-enabled/
   
   # Test and reload
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Phase 6: Domain Name Setup (Route 53)

#### Option A: Register Domain with Route 53

1. **Register Domain**
   - AWS Console → Route 53 → Registered domains → Register domain
   - Search for your domain name (e.g., `aura-restaurant.com`)
   - Cost: $12/year (not free, but very affordable)

2. **Create Hosted Zone** (done automatically after registration)
   - AWS Console → Route 53 → Hosted zones
   - Select your domain

3. **Create Records**
   ```
   Type: A Record
   Name: aura-restaurant.com
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 300
   
   Type: A Record (www subdomain)
   Name: www.aura-restaurant.com
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 300
   ```

#### Option B: Use Free Domain Service + Route 53

1. **Register Free Domain** (e.g., Freenom.com)
   - Get free `.ml`, `.ga`, `.cf`, or `.tk` domain

2. **Point to Route 53 Nameservers**
   - Get nameservers from Route 53 hosted zone
   - Update nameservers at Freenom

### Phase 7: SSL/TLS Certificate (HTTPS)

1. **Create Certificate with AWS ACM**
   - AWS Console → Certificate Manager → Request certificate
   - Domain: `aura-restaurant.com`, `www.aura-restaurant.com`
   - Validation: DNS validation (automatic)

2. **Setup Application Load Balancer (Optional)**
   - For free tier: Use self-signed or Let's Encrypt instead
   - Or attach the Nginx instance and use ACM

3. **Alternative: Use Let's Encrypt (Free)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Generate certificate
   sudo certbot certonly --standalone -d aura-restaurant.com -d www.aura-restaurant.com
   
   # Update Nginx config to use HTTPS
   sudo certbot --nginx
   ```

---

## Domain Name Options for AURA

### Paid Domains (Recommended)
| Domain | Price/Year | Provider | Status |
|--------|-----------|----------|--------|
| aura-restaurant.com | $12 | Route 53/Godaddy | Professional |
| auraorder.com | $10-15 | Namecheap | Available |
| aura-dining.com | $12 | Route 53 | Professional |
| myaura.ai | $20-50 | Route 53 | Modern tech |
| aurabot.co | $20 | Route 53 | Tech-focused |

### Free Domains (Testing Only)
| Domain | Provider | Notes |
|--------|----------|-------|
| aura-restaurant.ml | Freenom | May expire, unreliable |
| aura-system.tk | Freenom | Free for 12 months |
| aura.gq | Freenom | Malware reputation risk |

**Recommendation:** Use a **paid domain** from Route 53 (~$12/year) for professional deployment.

---

## Cost Estimation (Monthly)

### Free Tier (First 12 months)
- **EC2 t3.micro**: Free ($0)
- **RDS db.t3.micro**: Free ($0)
- **S3 Storage**: Free (5GB/month) ($0)
- **Data Transfer OUT**: Free 100GB/month ($0)
- **Total**: **$0 - $1/month** (only Route 53 if using paid domain)

### After 12 Months
- **EC2 t3.micro**: ~$10/month
- **RDS db.t3.micro**: ~$20/month
- **Domain**: ~$1/month
- **Total**: ~**$31+/month**

---

## Monitoring & Maintenance

### CloudWatch Monitoring
```bash
# Setup CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-usage \
  --alarm-description "Alert if CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Backup Strategy
```bash
# Backup RDS database daily
aws rds create-db-snapshot \
  --db-instance-identifier aura-db \
  --db-snapshot-identifier aura-db-$(date +%Y%m%d)
```

### Health Checks
```bash
# Test backend
curl https://your-domain.com/api/health

# Test frontend
curl https://your-domain.com

# Test MQTT
mosquitto_sub -h your-domain.com -t "test/#"
```

---

## Troubleshooting

### EC2 Instance Stops Responding
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Check Docker services
docker ps

# View logs
docker-compose logs --tail=50
```

### Database Connection Failed
```bash
# Check RDS security group
aws ec2 describe-security-groups --group-ids sg-xxxxxx

# Test connectivity
psql -h aura-db.region.rds.amazonaws.com -U aura_user -d aura_db
```

### Certificate Issues
```bash
# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

---

## Next Steps

1. ✅ Create AWS free tier account
2. ✅ Setup RDS PostgreSQL database
3. ✅ Launch EC2 instance and install Docker
4. ✅ Deploy with docker-compose
5. ✅ Register domain name
6. ✅ Setup SSL/TLS certificate
7. ✅ Configure DNS records
8. ✅ Test end-to-end deployment
9. ✅ Setup monitoring & backups
10. ✅ Document for team

---

## Gemini Prompt for AI-Assisted Setup

**Use this prompt in Google Gemini to get detailed step-by-step guidance:**

```
I have a full-stack restaurant automation system called AURA with:
- React + Vite frontend
- Spring Boot 4.0.3 backend (Java 17)
- PostgreSQL database
- Mosquitto MQTT broker
- Python voice agent (optional)
- Docker Compose setup

I need to:
1. Host this on AWS free tier for production testing
2. Setup a professional domain name
3. Get HTTPS/SSL certificate
4. Monitor the deployment

System architecture:
- Frontend: React 18 with Vite
- Backend: Spring Boot with JWT auth
- Database: PostgreSQL with Hibernate
- Message broker: Mosquitto MQTT
- Static files: Images via Cloudinary
- Container: Docker on EC2

Please provide:
1. Complete AWS setup guide (RDS, EC2, networking)
2. Docker deployment strategy for production
3. Domain name registration and DNS setup
4. SSL/TLS certificate configuration
5. Monitoring and backup procedures
6. Cost optimization tips
7. Troubleshooting guide
8. Scaling strategy for production

Focus on AWS free tier limits and production-ready security.
```

---

## Security Best Practices

### Before Going to Production

1. **Change Default Credentials**
   ```bash
   # Rotate RDS password
   aws rds modify-db-instance \
     --db-instance-identifier aura-db \
     --master-user-password new-strong-password \
     --apply-immediately
   ```

2. **Restrict Security Groups**
   ```bash
   # Allow only from your IP for SSH
   aws ec2 authorize-security-group-ingress \
     --group-id sg-xxxxxx \
     --protocol tcp \
     --port 22 \
     --cidr YOUR_IP/32
   ```

3. **Enable Encryption**
   - RDS: Enable automated backups with encryption
   - S3: Enable default bucket encryption
   - EC2 EBS: Encrypt volumes

4. **Setup WAF (Web Application Firewall)**
   - AWS Console → WAF & Shield
   - Configure rate limiting
   - Block SQL injection attempts

---

## Additional Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **EC2 User Guide**: https://docs.aws.amazon.com/ec2/
- **RDS PostgreSQL**: https://docs.aws.amazon.com/rds/latest/UserGuide/USER_PostgreSQL.html
- **Route 53 Domain Registration**: https://docs.aws.amazon.com/route53/latest/DeveloperGuide/
- **ACM SSL/TLS**: https://docs.aws.amazon.com/acm/
- **Docker Documentation**: https://docs.docker.com/
- **Spring Boot Production Guide**: https://spring.io/guides/gs/deploying-spring-boot-app-to-aws/

