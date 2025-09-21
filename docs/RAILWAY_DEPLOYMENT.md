# Railway Deployment Documentation

## 🚀 **Railway Platform Overview**
FastChecker backend is deployed on Railway.app, a modern cloud platform that provides managed PostgreSQL database, automatic deployments, and monitoring tools.

## 🏗️ **Infrastructure Setup**

### Railway Services
1. **Web Service**: Node.js application (fastchecker-backend)
2. **Database**: Managed PostgreSQL instance
3. **Domain**: Custom domain with SSL certificate
4. **Environment**: Production-ready infrastructure

### Service Configuration
- **Platform**: Railway.app
- **Runtime**: Node.js 18.x
- **Database**: PostgreSQL 14+
- **Domain**: `professionalfastchecker-production.up.railway.app`
- **SSL**: Automatic HTTPS via Railway

## 📊 **Database Infrastructure**

### PostgreSQL Configuration
```bash
# Database connection via Railway
DATABASE_URL=postgresql://postgres:password@hostname:port/database_name
NODE_ENV=production
```

### Key Features
- **Managed Service**: Railway handles backups, updates, security
- **Automatic Scaling**: Database scales based on usage
- **Connection Pooling**: Built-in connection management
- **SSL Encryption**: All connections encrypted by default

### Database Tables
```sql
-- Core tables
users                 -- User accounts and authentication
user_api_settings      -- API credentials and configuration
subscription_plans     -- Plan definitions and pricing
seller_ownership       -- Seller ID uniqueness tracking
usage_logs            -- API usage tracking

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_api_settings_user_id ON user_api_settings(user_id);
CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, created_at);
```

## 🔄 **Deployment Process**

### Automatic Deployment
```bash
# Every push to backend branch triggers deployment
cd fastchecker-backend/
git add .
git commit -m "🚀 Feature: Description"
git push origin backend  # Triggers Railway deployment
```

### Deployment Timeline
1. **Git Push** → Railway webhook triggered
2. **Build Phase** → `npm install` and dependencies
3. **Deploy Phase** → Container deployment (~2-3 minutes)
4. **Health Check** → Service availability verification
5. **Live** → New version serving traffic

### Build Configuration
```json
// package.json scripts
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate-seller-uniqueness": "node scripts/migrate-seller-uniqueness.js",
    "rollback-seller-uniqueness": "node scripts/rollback-seller-uniqueness.js"
  }
}
```

## 🛠️ **Environment Variables**

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:***@containers-us-west-xxx.railway.app:xxxx/railway

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# SendGrid Email Service
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ID=d-0ee5bf01f8b748ae902d1331632bb627
SENDGRID_FROM_EMAIL=noreply@peakpurchases.com

# Environment
NODE_ENV=production
PORT=8080

# Encryption (for sensitive data)
ENCRYPTION_MASTER_KEY=your_64_character_master_key_for_encryption_here
LEGACY_SECRET=legacy_encryption_secret_for_backwards_compatibility
```

### Setting Environment Variables
```bash
# Via Railway CLI
railway variables set JWT_SECRET="your_secret_here"
railway variables set SENDGRID_API_KEY="SG.xxx"

# Via Railway Dashboard
# Navigate to your project → Variables tab → Add variable
```

## 📈 **Monitoring and Logging**

### Application Logs
```bash
# View real-time logs
railway logs

# View logs with filtering
railway logs --tail

# Specific deployment logs
railway logs --deployment DEPLOYMENT_ID
```

### Log Examples
```
✅ Database connected successfully
🚀 FastChecker Backend running on port 8080
📊 Health check: http://localhost:8080/health
Verification email sent to user@example.com: 202
[32minfo[39m: HTTP Request {"status":200,"method":"POST","url":"/api/auth/login"}
```

### Health Monitoring
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  // Database connectivity test
  // SendGrid service test
  // Memory and CPU usage
});
```

## 🔧 **Development Commands**

### Railway CLI Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Run commands in Railway environment
railway shell

# Execute scripts
railway run node scripts/check-user-verification.js

# Database operations
railway run node scripts/migrate-seller-uniqueness.js
```

### Database Management
```bash
# Connect to production database
railway shell
psql $DATABASE_URL

# Run migrations
railway run npm run migrate-seller-uniqueness

# Check database status
railway run node -e "const pool = require('./config/database'); pool.query('SELECT NOW()', (err, res) => console.log(res.rows[0]))"
```

## 🔒 **Security Configuration**

### SSL/TLS
- **Automatic HTTPS**: Railway provides SSL certificates
- **Force HTTPS**: All HTTP requests redirect to HTTPS
- **TLS 1.2+**: Modern encryption standards

### Environment Security
```javascript
// Production security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet()); // Security headers
  app.use(compression()); // Response compression
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }));
}
```

### Database Security
- **Connection Encryption**: All database connections use SSL
- **Credential Management**: Database credentials managed by Railway
- **Network Isolation**: Database accessible only from Railway services
- **Backup Encryption**: Automatic encrypted backups

## 📋 **Backup and Recovery**

### Automatic Backups
- **Frequency**: Daily automated backups by Railway
- **Retention**: 7-day backup retention
- **Encryption**: Backups encrypted at rest
- **Recovery**: Point-in-time recovery available

### Manual Backup
```bash
# Export database
railway shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Import backup (if needed)
psql $DATABASE_URL < backup_20240916.sql
```

## 🚨 **Troubleshooting**

### Common Issues

#### Deployment Failures
```bash
# Check build logs
railway logs --deployment DEPLOYMENT_ID

# Common causes:
# - npm install failures
# - Environment variable issues
# - Node.js version conflicts
# - Database connection problems
```

#### Database Connection Issues
```bash
# Test database connectivity
railway run node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error(err);
  else console.log('✅ Database connected:', res.rows[0]);
  process.exit(0);
});
"
```

#### Email Delivery Problems
```bash
# Check SendGrid configuration
railway run node -e "
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Missing');
console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
console.log('SENDGRID_TEMPLATE_ID:', process.env.SENDGRID_TEMPLATE_ID);
"
```

### Debug Commands
```bash
# Check all environment variables
railway variables

# Test specific endpoint
curl https://professionalfastchecker-production.up.railway.app/health

# Check service status
railway status

# View recent activity
railway activity
```

## 🎯 **Performance Optimization**

### Application Performance
- **Connection Pooling**: Database connection pool (max 20 connections)
- **Response Compression**: Gzip compression for API responses
- **Caching**: In-memory caching for frequent queries
- **Optimized Queries**: Database indexes for performance

### Monitoring Metrics
```javascript
// Performance monitoring
const startTime = Date.now();
app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

## 🔄 **Scaling and Maintenance**

### Auto-Scaling
- **Horizontal Scaling**: Railway automatically scales based on traffic
- **Resource Allocation**: CPU and memory scaled dynamically
- **Load Balancing**: Built-in load balancing for high availability

### Maintenance Windows
- **Platform Updates**: Railway handles infrastructure updates
- **Database Maintenance**: Managed by Railway during low-traffic periods
- **Zero Downtime**: Deployments use blue-green deployment strategy

### Cost Optimization
- **Usage-Based Pricing**: Pay only for resources used
- **Resource Monitoring**: Track CPU, memory, and database usage
- **Optimization**: Regular review of resource utilization

## 📝 **Best Practices**

### Development Workflow
1. **Test Locally**: Use Railway shell for testing
2. **Environment Parity**: Keep local and production environments similar
3. **Gradual Rollouts**: Deploy features incrementally
4. **Monitor Deployments**: Watch logs during deployment

### Code Quality
```bash
# Pre-deployment checks
npm run test          # Run test suite
npm run lint          # Code quality checks
npm audit            # Security vulnerability scan
```

### Database Management
1. **Migrations**: Use versioned migration scripts
2. **Indexes**: Optimize database queries with appropriate indexes
3. **Monitoring**: Track query performance and connection usage
4. **Cleanup**: Regular cleanup of old logs and temporary data

This Railway deployment setup provides a robust, scalable, and secure foundation for the FastChecker backend infrastructure.