# FastChecker Deployment Guide

## 🚀 Deployment Overview

FastChecker uses a multi-platform deployment strategy with Railway for backend hosting and Chrome Web Store for extension distribution. This guide covers complete production deployment, environment configuration, and maintenance procedures.

## 🏗️ Deployment Architecture

```
Production Deployment
├── Backend (Railway.app)
│   ├── Node.js Application Server
│   ├── PostgreSQL Database
│   ├── Environment Variables
│   └── Auto-Deploy from GitHub
├── Frontend (Chrome Extension)
│   ├── Local Development Build
│   ├── Production Package
│   └── Chrome Web Store Distribution
└── External Services
    ├── Stripe Payment Processing
    ├── Amazon SP-API Integration
    └── Domain & SSL (Railway)
```

## 🔧 Backend Deployment (Railway)

### 1. Railway Setup & Configuration

#### Initial Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link existing project
railway link

# Or create new project
railway new
```

#### Environment Configuration
```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Database configuration
railway variables set DATABASE_URL="postgresql://..."
railway variables set POSTGRES_URL="postgresql://..."

# JWT configuration
railway variables set JWT_SECRET="your-super-secure-jwt-secret-256-bits"
railway variables set JWT_EXPIRES_IN="7d"

# Stripe configuration
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."

# CORS configuration
railway variables set ALLOWED_ORIGINS="chrome-extension://your-extension-id"

# Optional: Monitoring
railway variables set LOG_LEVEL="info"
railway variables set ENABLE_METRICS="true"
```

### 2. Database Setup

#### PostgreSQL Add-on
```bash
# Add PostgreSQL to Railway project
railway add postgresql

# Get database URL
railway variables get DATABASE_URL
```

#### Database Migration
```bash
# Connect to Railway shell
railway shell

# Run migrations
npm run migrate

# Optional: Seed initial data
npm run seed
```

#### Database Schema Verification
```sql
-- Connect to database and verify tables
\dt

-- Check users table
SELECT COUNT(*) FROM users;

-- Check constraints and indexes
\d users
\d user_settings
\d asin_history
```

### 3. Application Deployment

#### Automatic Deployment Setup
```yaml
# railway.toml
[build]
command = "npm install"

[start]
command = "npm start"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"
```

#### Manual Deployment
```bash
# Deploy current branch
railway up

# Deploy specific branch
railway up --detach

# Check deployment status
railway status

# View logs
railway logs
```

### 4. Domain & SSL Configuration

#### Custom Domain Setup
```bash
# Add custom domain (optional)
railway domain add your-api-domain.com

# Railway automatically provides SSL certificates
# Default domain: your-project-name.up.railway.app
```

#### CORS Configuration Update
```javascript
// Update CORS in server.js for production domain
const corsOptions = {
    origin: [
        'chrome-extension://your-extension-id',
        'https://your-custom-domain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 5. Production Monitoring

#### Health Check Endpoint
```javascript
// server.js - Health check for Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV,
        database: 'connected', // Add DB health check
        uptime: process.uptime()
    });
});
```

#### Logging Configuration
```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'fastchecker-api' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

module.exports = logger;
```

#### Railway Monitoring
```bash
# View real-time logs
railway logs --follow

# Check resource usage
railway status

# View metrics (if enabled)
railway metrics
```

## 📱 Frontend Deployment (Chrome Extension)

### 1. Development Build

#### Environment Configuration
```javascript
// Update base URL for production
// services/authService.js
class AuthService {
    constructor() {
        this.baseURL = 'https://your-app-name.up.railway.app';
        // For development: 'http://localhost:3000'
    }
}
```

#### Manifest Configuration
```json
{
  "manifest_version": 3,
  "name": "FastChecker - Amazon ASIN Checker",
  "version": "2.0.0",
  "description": "Professional Amazon SP-API ASIN eligibility checker",
  "permissions": [
    "storage",
    "sidePanel",
    "activeTab"
  ],
  "host_permissions": [
    "https://sellingpartnerapi-na.amazon.com/*",
    "https://sellingpartnerapi-eu.amazon.com/*", 
    "https://sellingpartnerapi-fe.amazon.com/*",
    "https://your-app-name.up.railway.app/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "sidepanel/sidepanel.html"
  },
  "action": {
    "default_title": "FastChecker"
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png", 
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 2. Production Package Creation

#### Pre-build Checklist
```bash
# 1. Update version in manifest.json
# 2. Update API URLs to production
# 3. Remove development console.logs
# 4. Test all functionality locally
# 5. Verify all translations work
# 6. Check all icons are present
```

#### Build Process
```bash
# Create production build directory
mkdir fastchecker-extension-v2.0

# Copy production files
cp manifest.json fastchecker-extension-v2.0/
cp -r sidepanel/ fastchecker-extension-v2.0/
cp -r services/ fastchecker-extension-v2.0/
cp -r icons/ fastchecker-extension-v2.0/
cp background.js fastchecker-extension-v2.0/

# Remove development files
rm -rf fastchecker-extension-v2.0/**/*.map
rm -rf fastchecker-extension-v2.0/**/node_modules

# Create ZIP package
zip -r fastchecker-extension-v2.0.zip fastchecker-extension-v2.0/
```

#### Package Validation
```bash
# Test extension package
# 1. Load unpacked extension in Chrome
# 2. Test all core functionality
# 3. Verify API connectivity
# 4. Test authentication flow
# 5. Verify subscription system
# 6. Test ASIN checking
# 7. Validate translations
```

### 3. Chrome Web Store Deployment

#### Developer Dashboard Setup
1. **Access Chrome Web Store Developer Dashboard**
   - URL: https://chrome.google.com/webstore/devconsole
   - Login with Google account
   - Pay one-time $5 developer fee (if not done)

2. **Create New Item**
   - Click "New Item"
   - Upload ZIP package
   - Fill required information

#### Store Listing Configuration
```markdown
# Extension Name
FastChecker - Professional Amazon ASIN Checker

# Short Description
Professional Amazon SP-API ASIN eligibility checker with multi-user support

# Detailed Description
FastChecker is a professional Chrome extension that helps Amazon sellers check ASIN eligibility for FBA using the official Amazon SP-API. 

## Key Features:
✅ **Professional SP-API Integration** - Direct connection to Amazon's official API
✅ **Multi-User Support** - Secure authentication and user management
✅ **Subscription Plans** - Free, Basic, Premium, and Enterprise tiers
✅ **Bulk ASIN Checking** - Check multiple ASINs simultaneously
✅ **Real-time Results** - Instant eligibility status and restrictions
✅ **Usage Tracking** - Monitor your monthly API usage
✅ **Multi-language** - Complete English and Turkish support
✅ **Professional UI** - Modern, responsive interface optimized for productivity

## Subscription Plans:
🆓 **Free Plan**: 100 ASIN checks per month
⭐ **Basic Plan**: 1,000 checks per month + priority support
🚀 **Premium Plan**: 5,000 checks per month + advanced features
🏢 **Enterprise Plan**: Unlimited checks + dedicated support

## Security & Privacy:
- End-to-end encryption for all API credentials
- No data sharing with third parties
- SOC 2 compliant infrastructure
- Your SP-API credentials never leave your control

Perfect for Amazon sellers, FBA consultants, and e-commerce professionals who need reliable, fast ASIN eligibility checking.

## Requirements:
- Amazon SP-API credentials (refresh token, client ID, client secret)
- Active Amazon seller account
- Chrome browser

Start with our free plan and upgrade as your business grows!
```

#### Store Assets
```
Required Images:
├── icon-128x128.png (Store icon)
├── screenshot-1280x800-1.png (Main interface)
├── screenshot-1280x800-2.png (ASIN results)
├── screenshot-1280x800-3.png (Settings page)
├── screenshot-1280x800-4.png (Subscription plans)
└── promotional-440x280.png (Store tile)

Optional:
├── marquee-1400x560.png (Featured placement)
└── logo-200x200.png (Company logo)
```

#### Privacy Policy & Terms
```markdown
# Privacy Policy URL
https://your-domain.com/privacy-policy

# Terms of Service URL  
https://your-domain.com/terms-of-service

# Support URL
https://your-domain.com/support

# Homepage URL
https://your-domain.com
```

#### Publishing Process
1. **Submit for Review**
   - Click "Submit for Review"
   - Review can take 1-7 days
   - Address any reviewer feedback

2. **Post-Publication**
   - Monitor store ratings/reviews
   - Respond to user feedback
   - Plan regular updates

### 4. Extension Update Process

#### Version Management
```json
// Update manifest.json version
{
  "version": "2.1.0",
  "version_name": "2.1.0 - Performance Improvements"
}
```

#### Update Deployment
```bash
# 1. Test new version locally
# 2. Create new ZIP package
# 3. Upload to Chrome Web Store
# 4. Submit for review
# 5. Publish after approval
```

#### Auto-Update Verification
```javascript
// background.js - Handle extension updates
chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log('Update available:', details.version);
    // Optionally force restart
    chrome.runtime.reload();
});
```

## 🔧 Environment Management

### 1. Development Environment
```bash
# Backend (Local)
cd fastchecker-backend
npm install
cp .env.example .env
npm run dev

# Frontend (Chrome Extension)
# Load unpacked extension from project directory
```

### 2. Staging Environment
```bash
# Railway staging branch
railway environment create staging
railway environment set staging

# Deploy to staging
git push origin staging
railway up --environment staging
```

### 3. Production Environment
```bash
# Railway production
railway environment set production

# Deploy to production
git push origin main
railway up --environment production
```

## 📊 Monitoring & Maintenance

### 1. Performance Monitoring

#### Railway Metrics
```bash
# View app metrics
railway metrics

# Monitor resource usage
railway logs --filter error

# Database performance
railway connect postgresql
```

#### Custom Monitoring
```javascript
// server.js - Custom metrics endpoint
app.get('/metrics', authMiddleware, async (req, res) => {
    const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
        activeUsers: await getActiveUserCount(),
        apiCalls: await getApiCallCount(),
        errorRate: await getErrorRate()
    };
    
    res.json(metrics);
});
```

### 2. Database Maintenance

#### Regular Maintenance Tasks
```sql
-- Weekly maintenance (run via cron or Railway schedule)

-- Update table statistics
ANALYZE users, user_settings, asin_history, subscription_history;

-- Clean old login history (keep 1 year)
DELETE FROM login_history 
WHERE login_time < CURRENT_DATE - INTERVAL '1 year';

-- Clean old ASIN history (keep 2 years)
DELETE FROM asin_history 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

-- Vacuum tables for performance
VACUUM ANALYZE;
```

#### Backup Strategy
```bash
# Railway provides automatic backups
# Additional manual backup
railway connect postgresql --execute "pg_dump" > backup_$(date +%Y%m%d).sql

# Restore from backup
railway connect postgresql < backup_file.sql
```

### 3. Security Updates

#### Dependency Updates
```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix

# Deploy security updates immediately
railway up
```

#### SSL Certificate Renewal
```bash
# Railway handles SSL automatically
# Verify certificate status
curl -I https://your-app-name.up.railway.app

# Custom domain SSL check
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 🚨 Disaster Recovery

### 1. Backup Procedures

#### Database Backup
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
railway connect postgresql --execute "pg_dump fastchecker" > "backup_${DATE}.sql"

# Upload to cloud storage (optional)
aws s3 cp backup_${DATE}.sql s3://your-backup-bucket/
```

#### Code Backup
```bash
# Repository is backed up on GitHub
# Ensure all changes are committed and pushed

# Tag releases for easy rollback
git tag -a v2.0.0 -m "Production release v2.0.0"
git push origin v2.0.0
```

### 2. Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
railway connect postgresql < backup_file.sql

# Verify data integrity
railway connect postgresql --execute "SELECT COUNT(*) FROM users;"
```

#### Application Recovery
```bash
# Rollback to previous version
git checkout v1.9.0
railway up

# Or rollback via Railway dashboard
railway rollback
```

### 3. Incident Response

#### Monitoring Alerts
```javascript
// Basic health check monitoring
const healthCheck = async () => {
    try {
        const response = await fetch('https://your-app-name.up.railway.app/health');
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Health check failed:', error);
        // Send alert notification
        return false;
    }
};

// Run every 5 minutes
setInterval(healthCheck, 5 * 60 * 1000);
```

#### Incident Checklist
1. **Identify Issue**
   - Check Railway logs
   - Monitor user reports
   - Verify external services (Stripe, SP-API)

2. **Immediate Response**
   - Assess impact and severity
   - Implement temporary fix if possible
   - Communicate with users if needed

3. **Resolution**
   - Implement permanent fix
   - Deploy and verify
   - Monitor for regression

4. **Post-Incident**
   - Document lessons learned
   - Update monitoring/alerts
   - Improve prevention measures

---

**Deployment Version**: 2.0  
**Last Updated**: 2025-01-15  
**Backend Platform**: Railway.app  
**Frontend Distribution**: Chrome Web Store  
**Database**: PostgreSQL (Railway-managed)  
**SSL**: Automatic (Railway/Let's Encrypt)