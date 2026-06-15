# AURA Project - Domain Names & AWS Services Reference

---

## Part 1: Domain Name Recommendations

### Professional Domain Names for AURA

#### Tier 1: Premium (Highly Recommended)
| Domain | Price | TLD | Notes | Availability |
|--------|-------|-----|-------|--------------|
| **aura-restaurant.com** | $12/yr | .com | Professional, memorable, describes purpose | Check Route 53 |
| **auraobot.com** | $12/yr | .com | Modern, highlights robotic aspect | Check Route 53 |
| **auradining.com** | $12/yr | .com | Elegant, focuses on dining experience | Check Route 53 |
| **aurapos.io** | $15/yr | .io | Tech-focused, POS system angle | Check Route 53 |

#### Tier 2: Alternative Extensions
| Domain | Price | TLD | Notes | Best For |
|--------|-------|-----|-------|----------|
| aura-restaurant.io | $15/yr | .io | Tech-savvy audiences | B2B tech |
| auraorder.ai | $20-50/yr | .ai | AI/ML positioning | Brand focus |
| auratable.co | $20/yr | .co | Professional alternative | Design-focused |
| smartorder.tech | $15-20/yr | .tech | Highlights technology | Tech positioning |

#### Tier 3: Budget Alternatives (Free - Use for Testing)
| Domain | Price | Provider | Expiration | Notes |
|--------|-------|----------|-----------|-------|
| aura-restaurant.ml | Free | Freenom | 12 months | Great for testing, NOT for production |
| aura-system.tk | Free | Freenom | 12 months | Also testing only |
| aura.gq | Free | Freenom | 12 months | ⚠️ .gq associated with malware, avoid |

---

## Domain Selection Decision Tree

```
Does your domain need to be permanent/professional?
├─ YES → Use Tier 1 (.com)
│   ├─ Budget: Can spend $12-15/yr? → aura-restaurant.com ✅
│   └─ Want tech brand? → auraobot.com
│
└─ NO (Testing only) → Use Free domain (Freenom)
    └─ aura-restaurant.ml or aura-system.tk
```

---

## How to Check Domain Availability

### Option 1: AWS Route 53
1. Go to Route 53 console
2. Click "Registered domains"
3. Click "Search for domain"
4. Type domain name
5. Check price and availability

### Option 2: Third-Party Registrars
- **Namecheap**: namecheap.com/domains
- **GoDaddy**: godaddy.com
- **Domain.com**: domain.com
- **Freenom**: freenom.com (free only)

### Option 3: DNS Checker
```bash
# From terminal
whois aura-restaurant.com
nslookup aura-restaurant.com
dig aura-restaurant.com
```

---

## Subdomain Strategy

Once you have your main domain, consider these subdomains:

```
aura-restaurant.com          # Main site
├── www.aura-restaurant.com  # WWW alias (auto-created)
├── api.aura-restaurant.com  # Backend API (optional)
├── admin.aura-restaurant.com # Admin dashboard (optional)
├── robot.aura-restaurant.com # Robot management (optional)
├── kitchen.aura-restaurant.com # Kitchen display (optional)
└── help.aura-restaurant.com # Support/documentation (optional)
```

**For now, focus on**: `aura-restaurant.com` and `www.aura-restaurant.com`

---

## Registration Steps by Provider

### AWS Route 53 (Recommended for AWS Hosting)

1. AWS Console → Route 53
2. Click "Registered domains"
3. Click "Register domain"
4. Enter domain name
5. Click "Check"
6. If available, add to cart
7. Enter registrant information
8. Accept terms and pay
9. Confirm email
10. Hosted zone auto-created

**Pros:**
- ✅ Easy integration with Route 53
- ✅ Auto-creates hosted zone
- ✅ One-click DNS record creation
- ✅ AWS billing consolidation

**Cons:**
- ❌ Limited customer support
- ❌ Can't transfer away for 60 days
- ❌ Slightly higher fees than competitors

---

### Freenom (Free - Testing Only)

1. Go to freenom.com
2. Click "Find a new domain"
3. Type domain name
4. Select .ml, .tk, .ga, or .cf TLD
5. Click "Check Availability"
6. Select free option (if available)
7. Continue to checkout
8. Create free account
9. Complete email verification
10. Get nameservers

**Pros:**
- ✅ Completely free
- ✅ Great for testing
- ✅ No credit card required

**Cons:**
- ❌ Looks unprofessional for production
- ❌ Reputation issues with certain TLDs
- ❌ No SSL certificate provider support
- ❌ May expire if not renewed
- ❌ Often blacklisted

---

### Namecheap

1. Go to namecheap.com
2. Search for domain
3. Select desired domain
4. Add to cart
5. Proceed to checkout
6. Create account or sign in
7. Complete payment
8. Add DNS records via Namecheap dashboard

**Pros:**
- ✅ Affordable prices
- ✅ Good customer support
- ✅ Easy DNS management
- ✅ Whois privacy included

**Cons:**
- ❌ Manual DNS configuration needed
- ❌ Requires free account registration

---

## My Recommendation

### For Production (Recommended)
```
Domain: aura-restaurant.com
Registrar: AWS Route 53
Price: ~$12/year
TLD Reasoning: .com = most professional, globally recognized
```

### For Testing (Quick Start)
```
Domain: aura-restaurant.ml or aura-system.tk
Registrar: Freenom (Free)
Price: Free for 12 months
Purpose: Test deployment before production domain
```

### For Tech/Startup Brand
```
Domain: auraobot.com
Registrar: AWS Route 53 or Namecheap
Price: $12-20/year
TLD Reasoning: .com for credibility + memorable name
```

---

## Part 2: AWS Services Quick Reference

### Services Used in AURA Deployment

#### 1. **EC2 (Elastic Compute Cloud)**
- **Purpose**: Virtual machines to host your application
- **Your Config**: t3.micro instance
- **Capacity**: 1 vCPU, 1 GB memory
- **Monthly Cost** (Free Tier Year 1): $0 (750 hours/month)
- **After Year 1**: ~$10/month for t3.micro
- **What Runs Here**: Docker containers (backend, frontend, MQTT)

#### 2. **RDS (Relational Database Service)**
- **Purpose**: Managed PostgreSQL database
- **Your Config**: db.t3.micro
- **Storage**: 20 GB
- **Monthly Cost** (Free Tier Year 1): $0
- **After Year 1**: ~$20/month for db.t3.micro + storage
- **What Stores Here**: Orders, menu items, user data

#### 3. **Route 53 (DNS & Domain Registration)**
- **Purpose**: Domain name management and DNS routing
- **Your Config**: 1 hosted zone + domain registration
- **Monthly Cost**: $0.50 (hosted zone) + domain renewal (~$1)
- **Total**: ~$12/year for .com domain
- **What It Does**: Routes aura-restaurant.com → EC2 IP

#### 4. **Certificate Manager (ACM)**
- **Purpose**: HTTPS/SSL certificates
- **Your Config**: SSL certificate for domain
- **Monthly Cost**: Free
- **Renewal**: Automatic
- **What It Secures**: HTTPS connections to your site

#### 5. **S3 (Simple Storage Service)**
- **Purpose**: Cloud file storage (optional)
- **Your Config**: Optional for backups/static files
- **Monthly Cost** (Free Tier): Free (5 GB/month)
- **After Year 1**: ~$0.023 per GB stored
- **What Stores Here**: Database backups, static assets

#### 6. **CloudWatch (Monitoring)**
- **Purpose**: Application and infrastructure monitoring
- **Your Config**: Basic monitoring
- **Monthly Cost** (Free Tier): Free basic metrics
- **Advanced**: Logs, dashboards ($0.50+/month)
- **What It Tracks**: CPU, memory, errors, availability

#### 7. **Elastic IP (Static IP)**
- **Purpose**: Static public IP address
- **Your Config**: 1 Elastic IP
- **Monthly Cost**: Free if associated with running instance
- **After Year 1**: $3.50/month if not associated
- **What It Does**: Keeps your server's IP address consistent

#### 8. **VPC (Virtual Private Cloud)**
- **Purpose**: Network isolation
- **Your Config**: Default VPC
- **Monthly Cost**: Free
- **What It Provides**: Networking, security groups, subnets

#### 9. **IAM (Identity & Access Management)**
- **Purpose**: User access control
- **Your Config**: Team user accounts with permissions
- **Monthly Cost**: Free
- **What It Controls**: Who can access what resources

#### 10. **CloudTrail (Audit Logging)**
- **Purpose**: Track AWS API calls
- **Your Config**: Optional for compliance
- **Monthly Cost**: Free tier included
- **What It Logs**: Who did what, when, where

---

## AWS Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Users & Robots                         │
│            (Internet, via Domain Name)                   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────────┐
         │                          │
    ┌────▼──────────────┐    ┌─────▼────────────────┐
    │   Route 53        │    │  Certificate         │
    │   (DNS)           │    │  Manager (ACM)       │
    │   aura-rest...com │    │  (HTTPS Cert)        │
    └────┬──────────────┘    └─────┬────────────────┘
         │                         │
         └──────────┬──────────────┘
                    │ (port 443 - HTTPS)
         ┌──────────▼──────────────┐
         │  Elastic IP             │
         │  (54.xxx.xxx.xxx)       │
         └──────────┬──────────────┘
                    │
    ┌───────────────▼────────────────┐
    │      EC2 Instance               │
    │     (t3.micro, Ubuntu)          │
    │  ├── Docker Container           │
    │  │   ├── Backend (8080)         │
    │  │   ├── Frontend (5173)        │
    │  │   └── MQTT (1883, 9001)      │
    │  ├── Nginx (Reverse Proxy)      │
    │  └── CloudWatch Agent           │
    │      (Monitoring)               │
    └───────────────┬────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    ┌───▼─────────┐      ┌──────▼─────────┐
    │  RDS        │      │  CloudWatch    │
    │  PostgreSQL │      │  (Monitoring)  │
    │  (aura_db)  │      │  + Logs        │
    └─────────────┘      └────────────────┘

Optional:
┌──────────────────────────────┐
│  S3 (Backups)                │
│  IAM (Users & Permissions)   │
│  CloudTrail (Audit Log)      │
└──────────────────────────────┘
```

---

## AWS Services Pricing Summary

### Free Tier Year 1 (Estimated)

| Service | Limit | Cost |
|---------|-------|------|
| EC2 (t3.micro) | 750 hrs/month | $0 |
| RDS (db.t3.micro) | 20GB storage | $0 |
| Route 53 Queries | 1B queries/month | $0.40 included |
| Route 53 Hosted Zone | 1 zone | $0.50/month |
| ACM Certificate | Unlimited | $0 |
| CloudWatch | Basic metrics | $0 |
| Data Transfer IN | All traffic | $0 |
| Data Transfer OUT | 100GB/month | $0 |
| **Total (Year 1)** | | **$0-5/month** |

### After Year 1 (Monthly Estimate)

| Service | Configuration | Cost |
|---------|---------------|------|
| EC2 (t3.micro) | 1 month continuous | $10 |
| RDS (db.t3.micro + storage) | 20GB storage + backups | $20 |
| Route 53 | 1 hosted zone + queries | $2 |
| Domain Renewal | .com domain | ~$1 |
| Data Transfer OUT | 50GB/month avg | $4.50 |
| **Total (After Year 1)** | | **~$37-40/month** |

---

## AWS Free Tier Limits to Watch

⚠️ **Important**: These limits can cause unexpected charges after you exceed them:

1. **EC2**: 750 hours/month (stops charging after)
2. **RDS**: 750 hours/month (stops charging after)
3. **RDS Storage**: 20GB/month (overage ~$0.11/GB)
4. **Data Transfer OUT**: 100GB/month (overage ~$0.09/GB)
5. **Route 53 Queries**: 1 billion queries/month

**To Avoid Charges:**
- ✅ Don't keep more than 1 t3.micro instance running
- ✅ Don't keep more than 1 db.t3.micro database running
- ✅ Keep RDS storage under 20GB
- ✅ Set billing alerts ($1-5 recommended)

---

## How to Monitor AWS Costs

### Setup Billing Alert
```bash
# AWS Console → Billing → Billing preferences
# Set up alert: Alert when charges exceed $1
```

### View Current Charges
```bash
# AWS Console → Billing → Billing & Cost Management
# Check "Estimated charges" for current month
```

### Check Service Usage
```bash
# AWS CLI
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## AWS Services NOT Needed for AURA

These services are **optional** and **not required** for free tier deployment:

- ❌ **Lambda**: For serverless (not needed if using EC2)
- ❌ **Elastic Beanstalk**: Simplifies deployment but adds cost
- ❌ **RDS Aurora**: More expensive than PostgreSQL
- ❌ **DynamoDB**: NoSQL (not needed with PostgreSQL)
- ❌ **ElastiCache**: Caching (not needed initially)
- ❌ **CloudFront**: CDN for content distribution
- ❌ **API Gateway**: Managed API (not needed with Nginx)
- ❌ **Cognito**: User identity (use JWT instead)
- ❌ **Kinesis**: Streaming (not needed)
- ❌ **SageMaker**: ML Platform (not needed)
- ❌ **QuickSight**: Analytics (not needed)

**Stick to**: EC2, RDS, Route 53, ACM, CloudWatch

---

## Quick AWS Commands Reference

### Check Your Services
```bash
# List running EC2 instances
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]'

# List RDS databases
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]'

# List Route 53 domains
aws route53domains list-domains --query 'Domains[*].[DomainName,DomainStatus]'

# Get current AWS account ID
aws sts get-caller-identity
```

### Cost Analysis
```bash
# AWS CLI cost explorer
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table
```

---

## Recommended AWS Learning Path

1. **Start Here**: AWS Free Tier Overview
   - https://aws.amazon.com/free/

2. **Learn EC2**: EC2 User Guide
   - https://docs.aws.amazon.com/ec2/

3. **Learn RDS**: RDS PostgreSQL Guide
   - https://docs.aws.amazon.com/rds/latest/UserGuide/USER_PostgreSQL.html

4. **Learn Route 53**: Domain & DNS Guide
   - https://docs.aws.amazon.com/route53/

5. **Deep Dive**: AWS Well-Architected Framework
   - https://docs.aws.amazon.com/wellarchitected/

---

## AWS Support Options

### Free Tier Support
- **Community Support**: AWS Forums (free, community-answered)
- **AWS Health Dashboard**: Service status (free)
- **AWS Documentation**: Comprehensive guides (free)
- **AWS Training**: Free online courses (aws.amazon.com/training)

### Paid Support (Not Recommended for Testing)
- **Developer Support**: $29/month or 3% of charges
- **Business Support**: $100+/month
- **Enterprise Support**: $15,000+/month

**For testing**: Use free documentation and community forums

---

## Next Steps

1. ✅ Choose domain name from recommendations
2. ✅ Register domain (Route 53 or Freenom)
3. ✅ Setup AWS account (free tier)
4. ✅ Create RDS database
5. ✅ Launch EC2 instance
6. ✅ Deploy AURA application
7. ✅ Configure DNS records
8. ✅ Setup SSL certificate
9. ✅ Setup monitoring
10. ✅ Test end-to-end

---

## Useful AWS Dashboard Links

- **AWS Console**: https://console.aws.amazon.com/
- **Billing Dashboard**: https://console.aws.amazon.com/billing/
- **EC2 Dashboard**: https://console.aws.amazon.com/ec2/
- **RDS Dashboard**: https://console.aws.amazon.com/rds/
- **Route 53 Dashboard**: https://console.aws.amazon.com/route53/
- **CloudWatch Dashboard**: https://console.aws.amazon.com/cloudwatch/

---

## Support & Contact

For questions:
- 📧 Email AWS Support (free tier available)
- 💬 AWS Forums (community support)
- 🔗 AWS Documentation (comprehensive)
- 🆘 AWS Support Center (in AWS Console)

