# AURA AWS Deployment - Quick Start Checklist

**Target**: Deploy AURA to AWS free tier in 2-3 hours

---

## Phase 1: AWS Account Setup (30 minutes)

### Account Creation
- [ ] Create AWS free tier account at aws.amazon.com
- [ ] Verify email address
- [ ] Add payment method (won't be charged in year 1)
- [ ] Enable free tier notifications
- [ ] Create billing alert ($1 limit recommended)

### Access & Security
- [ ] Create IAM user (don't use root account)
- [ ] Attach policies: EC2, RDS, S3, Route53, ACM, IAM
- [ ] Create access key for IAM user
- [ ] Download credentials file (store securely)
- [ ] Install AWS CLI v2
- [ ] Run: `aws configure` with your credentials
- [ ] Test: `aws ec2 describe-instances`

---

## Phase 2: Database Setup - RDS (20 minutes)

### Create RDS PostgreSQL Instance
- [ ] AWS Console → RDS → Databases → Create database
- [ ] Engine: PostgreSQL
- [ ] Version: 15.x (latest stable)
- [ ] DB instance class: **db.t3.micro** (free tier)
- [ ] Storage: **20GB** (free tier eligible)
- [ ] Storage type: gp3
- [ ] DB instance identifier: `aura-db`
- [ ] Master username: `aura_user`
- [ ] Master password: (generate strong - 20+ chars, store securely)
- [ ] [ ] Enable automatic backups: Yes (7 days retention)
- [ ] Enhanced monitoring: No (to save cost)
- [ ] Initial database name: `aura_db`

### Security Configuration
- [ ] Public accessibility: Yes (restrict later)
- [ ] VPC security group: Create new
- [ ] Security group name: `aura-db-sg`
- [ ] Security group description: "RDS for AURA backend"
- [ ] Inbound rule: PostgreSQL (5432) from anywhere (update later)

### After Creation
- [ ] Wait for instance to be "Available" (5-10 mins)
- [ ] Note the endpoint: `aura-db.xxxxx.rds.amazonaws.com`
- [ ] Test connectivity: `psql -h endpoint -U aura_user -d aura_db`
- [ ] Verify database is empty (ready for data)

**Store this securely:**
```
RDS_HOST: aura-db.xxxxx.us-east-1.rds.amazonaws.com
RDS_PORT: 5432
RDS_DATABASE: aura_db
RDS_USER: aura_user
RDS_PASSWORD: [your-strong-password]
```

---

## Phase 3: EC2 Instance Setup (30 minutes)

### Launch EC2 Instance
- [ ] AWS Console → EC2 → Instances → Launch instance
- [ ] Name: `aura-production`
- [ ] AMI: Ubuntu 22.04 LTS (free tier eligible)
- [ ] Instance type: **t3.micro** (free tier)
- [ ] Key pair: Create new
  - [ ] Key pair name: `aura-aws-prod`
  - [ ] Download and save .pem file (can't download again!)
  - [ ] `chmod 400 aura-aws-prod.pem`
- [ ] Network settings:
  - [ ] VPC: Default
  - [ ] Auto-assign public IP: Enable
  - [ ] Security group: Create new
    - [ ] Name: `aura-ec2-sg`
    - [ ] Description: "AURA application server"
- [ ] Inbound security group rules:
  ```
  SSH (22):     0.0.0.0/0 (restrict to your IP after)
  HTTP (80):    0.0.0.0/0
  HTTPS (443):  0.0.0.0/0
  ```
- [ ] Storage: 30GB gp3 (free tier eligible)
- [ ] Review and Launch

### After Launch
- [ ] Wait for instance to be "Running"
- [ ] Assign Elastic IP (static IP for domain later)
  - [ ] Elastic IPs → Allocate address
  - [ ] Associate with your instance
- [ ] Note the Public IP / Elastic IP

**Store this securely:**
```
EC2_INSTANCE_ID: i-xxxxxxxxxxxxx
EC2_PUBLIC_IP: 54.xxx.xxx.xxx (or Elastic IP)
EC2_KEY_PAIR: aura-aws-prod.pem
```

---

## Phase 4: Connect to EC2 & Install Docker (30 minutes)

### SSH Connection
```bash
ssh -i aura-aws-prod.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (avoid sudo)
sudo usermod -aG docker ubuntu

# Verify Docker is running
docker --version
docker ps
```

### Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### Clone Repository
```bash
git clone https://github.com/YOUR_GITHUB/e21-3yp-AURA.git
cd e21-3yp-AURA/code/aura-restaurant-system

# Check files
ls -la
```

---

## Phase 5: Environment Configuration (15 minutes)

### Create .env File for Production
```bash
cd /media/kaveesha-madhushan/New Volume3/Academic/Projects/e21-3yp-Project-AURA/code/aura-restaurant-system

cat > .env.production << 'EOF'
# Database (RDS)
DB_URL=jdbc:postgresql://aura-db.xxxxx.rds.amazonaws.com:5432/aura_db
DB_USERNAME=aura_user
DB_PASSWORD=YOUR_RDS_PASSWORD

# Application
JWT_SECRET=your-very-long-random-secret-min-32-characters-change-this
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_PROFILES_ACTIVE=production

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Frontend (for CORS)
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:5173
EOF
```

- [ ] Replace placeholder values with actual credentials
- [ ] Keep .env.production secure (don't commit to Git)

---

## Phase 6: Prepare docker-compose.yml for Production (15 minutes)

### Update docker-compose.yml
```yaml
# Backup original
cp docker-compose.yml docker-compose.local.yml

# Edit docker-compose.yml - Remove postgres service, update to use RDS
# See AWS_HOSTING_GUIDE.md for complete template
```

### Key Changes:
- [ ] Remove `postgres:` service completely
- [ ] Update backend DB_URL to RDS endpoint
- [ ] Add SPRING_JPA_HIBERNATE_DDL_AUTO=validate
- [ ] Frontend: Change from dev to production build
- [ ] Mosquitto: Keep as-is (messaging service)
- [ ] All environment variables from .env.production

---

## Phase 7: Deploy Application (30 minutes)

### Build & Start Services
```bash
# SSH to EC2 first (if not already connected)
ssh -i aura-aws-prod.pem ubuntu@YOUR_EC2_PUBLIC_IP

cd e21-3yp-AURA/code/aura-restaurant-system

# Load environment variables
export $(cat .env.production | xargs)

# Build and start (first time will take 5-10 min)
docker-compose up -d --build

# Check status
docker-compose ps

# View logs (follow in real-time)
docker-compose logs -f backend    # Press Ctrl+C to exit
```

### Verify Services
```bash
# Backend health check
curl http://localhost:8080/api/health

# Frontend (if applicable)
curl http://localhost:5173

# MQTT broker
mosquitto_sub -h localhost -t "test/#" &
mosquitto_pub -h localhost -t "test/hello" -m "Hello AURA"

# Verify database connection
docker-compose exec backend curl -I http://localhost:8080
```

---

## Phase 8: Setup Reverse Proxy with Nginx (20 minutes)

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/aura > /dev/null << 'EOF'
upstream backend {
    server 127.0.0.1:8080;
}

upstream frontend {
    server 127.0.0.1:5173;
}

upstream mqtt {
    server 127.0.0.1:9001;
}

server {
    listen 80;
    server_name _;
    
    # Increase body size for uploads
    client_max_body_size 50M;
    
    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # MQTT WebSocket
    location /mqtt {
        proxy_pass http://mqtt;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable configuration
sudo ln -s /etc/nginx/sites-available/aura /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Test Nginx Proxy
```bash
curl http://localhost/api/health
curl http://localhost/
```

---

## Phase 9: Domain Name Registration (20 minutes)

### Option A: Register with Route 53 (Recommended)
- [ ] AWS Console → Route 53 → Registered domains
- [ ] Search for domain (e.g., `aura-restaurant.com`)
- [ ] Add to cart and checkout (~$12/year)
- [ ] Complete domain registration
- [ ] Note: Route 53 automatically creates hosted zone

### Option B: Use Free Domain (Testing Only)
- [ ] Freenom.com → Register free .ml or .tk domain
- [ ] Point nameservers to Route 53 (see below)

### Create DNS Records
- [ ] AWS Console → Route 53 → Hosted zones
- [ ] Select your domain
- [ ] Create record:
  ```
  Name: aura-restaurant.com (or your domain)
  Type: A
  Value: YOUR_ELASTIC_IP
  TTL: 300
  ```
- [ ] Create record:
  ```
  Name: www.aura-restaurant.com
  Type: A
  Value: YOUR_ELASTIC_IP
  TTL: 300
  ```
- [ ] Wait for propagation (~5-30 minutes)

### Test DNS
```bash
nslookup aura-restaurant.com
dig aura-restaurant.com
ping aura-restaurant.com
```

**Store this:**
```
DOMAIN_NAME: aura-restaurant.com
ROUTE_53_HOSTED_ZONE_ID: Z1234567890ABC
ELASTIC_IP: 54.xxx.xxx.xxx
```

---

## Phase 10: SSL/TLS Certificate with Let's Encrypt (20 minutes)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Generate Certificate
```bash
sudo certbot certonly --standalone \
  -d aura-restaurant.com \
  -d www.aura-restaurant.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

### Update Nginx for HTTPS
```bash
sudo certbot --nginx -d aura-restaurant.com -d www.aura-restaurant.com
```

### Test SSL
```bash
curl -I https://aura-restaurant.com
curl -I https://www.aura-restaurant.com
```

### Auto-Renewal Test
```bash
sudo certbot renew --dry-run
```

---

## Phase 11: Verify End-to-End (15 minutes)

### Test All Endpoints
```bash
# HTTPS endpoints
curl -I https://aura-restaurant.com
curl -I https://aura-restaurant.com/api/health
curl -I https://www.aura-restaurant.com

# Test redirects
curl -I http://aura-restaurant.com  # Should redirect to HTTPS
```

### Test from Browser
- [ ] Open: `https://aura-restaurant.com`
- [ ] Check: No SSL warnings
- [ ] Check: Frontend loads
- [ ] Check: API calls work (dev console)

### Test MQTT
- [ ] Connect to MQTT: `mqtt://aura-restaurant.com:1883`
- [ ] WebSocket: `wss://aura-restaurant.com/mqtt`

### Performance Test
```bash
# Simple load test
ab -n 100 -c 10 https://aura-restaurant.com/api/health
```

---

## Phase 12: Monitoring & Backups (15 minutes)

### Enable CloudWatch Monitoring
```bash
# Check CPU usage
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].[InstanceType,State.Name]'

# Monitor logs
tail -f /var/log/syslog
```

### Setup Automated RDS Backups
- [ ] AWS Console → RDS → Databases → Modify
- [ ] Backup retention period: 7 days
- [ ] Backup window: 02:00-03:00 UTC
- [ ] Apply immediately

### Create EC2 Image (Backup)
```bash
# Create AMI from current instance
aws ec2 create-image \
  --instance-id i-xxxxx \
  --name aura-production-v1 \
  --description "AURA production deployment"
```

---

## Phase 13: Security Hardening (30 minutes)

### Restrict SSH Access
```bash
# Allow SSH only from your IP (replace YOUR_IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32
```

### Update RDS Security Group
```bash
# Allow PostgreSQL only from EC2 security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx (RDS SG) \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id sg-yyyyy (EC2 SG)

# Remove public access
aws ec2 revoke-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

### Update EC2 Security Group
```bash
# Keep HTTP/HTTPS open
# Keep SSH restricted (done above)
# Close unnecessary ports
```

### Check for Running Containers Logs
```bash
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
```

---

## Phase 14: Documentation & Team Handoff (15 minutes)

### Create Deployment Documentation
- [ ] Document EC2 IP and domain
- [ ] Document database credentials (store in password manager)
- [ ] Document Docker commands
- [ ] Create runbook for common issues
- [ ] Document monitoring dashboard
- [ ] Create disaster recovery guide

### Share with Team
- [ ] Add team members to AWS (IAM users)
- [ ] Grant appropriate permissions
- [ ] Share documentation
- [ ] Conduct deployment walkthrough
- [ ] Create on-call procedure

---

## Post-Deployment (Ongoing)

### Weekly Tasks
- [ ] Check CloudWatch metrics
- [ ] Review application logs
- [ ] Monitor RDS storage usage
- [ ] Check disk space on EC2

### Monthly Tasks
- [ ] Update OS packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Review security groups
- [ ] Check certificate expiration
- [ ] Review AWS billing
- [ ] Test backup restoration

### Quarterly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update dependencies
- [ ] Load testing
- [ ] Disaster recovery drill

---

## Troubleshooting Quick Links

| Issue | Command |
|-------|---------|
| Backend won't start | `docker-compose logs backend` |
| Database connection fails | `psql -h RDS_ENDPOINT -U aura_user -d aura_db` |
| Nginx not forwarding | `sudo systemctl status nginx` |
| Domain not resolving | `dig aura-restaurant.com` |
| SSL certificate error | `sudo certbot renew` |
| Disk space low | `df -h` |
| Memory issues | `free -h` and `docker stats` |

---

## Estimated Timeline

| Phase | Duration | Total |
|-------|----------|-------|
| 1. AWS Account Setup | 30 min | 30 min |
| 2. RDS Setup | 20 min | 50 min |
| 3. EC2 Launch | 30 min | 80 min |
| 4. Docker Installation | 30 min | 110 min |
| 5. Configuration | 15 min | 125 min |
| 6. Docker Setup | 15 min | 140 min |
| 7. Application Deploy | 30 min | 170 min |
| 8. Nginx Setup | 20 min | 190 min |
| 9. Domain Registration | 20 min | 210 min |
| 10. SSL Certificate | 20 min | 230 min |
| 11. Verification | 15 min | 245 min |
| 12. Monitoring | 15 min | 260 min |
| 13. Security | 30 min | 290 min |
| 14. Documentation | 15 min | 305 min |

**Total: ~5 hours end-to-end**

---

## Success Criteria

- ✅ All services running (`docker-compose ps` shows all healthy)
- ✅ Frontend accessible at `https://aura-restaurant.com`
- ✅ Backend API responding at `https://aura-restaurant.com/api/health`
- ✅ MQTT broker accepting connections
- ✅ Database connected and schema initialized
- ✅ SSL certificate valid (no browser warnings)
- ✅ All team members can access documentation
- ✅ Monitoring and alerts configured
- ✅ Backups scheduled and tested
- ✅ Security groups properly configured

---

## Next Steps After Deployment

1. **Load Testing**: Test with 50-100 concurrent users
2. **Data Migration**: Migrate production data from local to RDS
3. **User Acceptance Testing**: Have team test all features
4. **Performance Tuning**: Optimize database queries, caching
5. **Scaling Planning**: Plan for multi-region, auto-scaling beyond free tier
6. **Cost Optimization**: Review and optimize AWS bill
7. **Production Go-Live**: Full launch with monitoring

