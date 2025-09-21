# FastChecker Database Schema Documentation

## 🗄️ Database Overview

FastChecker uses PostgreSQL as its primary database with a well-structured relational schema designed for user management, ASIN tracking, subscription billing, and comprehensive analytics.

## 📊 Database Schema Diagram

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│       users         │    │   user_settings     │    │   asin_history      │
├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤
│ id (PK)            │◄───┤ user_id (FK)        │    │ id (PK)            │
│ email (UNIQUE)     │    │ refresh_token       │    │ user_id (FK)        │◄──┐
│ password_hash      │    │ client_id           │    │ asin                │   │
│ subscription_plan  │    │ client_secret       │    │ result              │   │
│ monthly_usage_count│    │ seller_id           │    │ api_response        │   │
│ usage_reset_date   │    │ marketplace         │    │ created_at          │   │
│ stripe_customer_id │    │ created_at          │    └─────────────────────┘   │
│ is_active          │    │ updated_at          │                            │
│ created_at         │    └─────────────────────┘                            │
│ updated_at         │                                                       │
└─────────────────────┘                                                       │
         │                                                                    │
         ├──────────────────────────────────────────────────────────────────┘
         │
         ├─── ┌─────────────────────┐    ┌─────────────────────┐
         │    │ subscription_history│    │   login_history     │
         │    ├─────────────────────┤    ├─────────────────────┤
         └───►│ user_id (FK)        │    │ id (PK)            │
              │ plan_code           │    │ user_id (FK)        │◄─────┘
              │ stripe_session_id   │    │ ip_address          │
              │ stripe_subscription_id│  │ user_agent          │
              │ status              │    │ login_time          │
              │ created_at          │    └─────────────────────┘
              │ ended_at            │
              └─────────────────────┘
```

## 🏗️ Table Structures

### 1. Users Table - Core User Management

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'FREE',
    monthly_usage_count INTEGER DEFAULT 0,
    usage_reset_date TIMESTAMP DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    stripe_customer_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_plan);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Field Descriptions:
- **id**: Primary key, auto-incrementing user identifier
- **email**: Unique user email address, used for login
- **password_hash**: bcrypt hashed password (salt rounds: 12)
- **subscription_plan**: Current plan ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')
- **monthly_usage_count**: Current month's ASIN check count
- **usage_reset_date**: When usage count resets (monthly billing cycle)
- **stripe_customer_id**: Stripe customer identifier for billing
- **is_active**: Account status (for deactivation/suspension)
- **created_at**: Account creation timestamp
- **updated_at**: Last profile update timestamp

#### Business Rules:
- Email must be unique across all users
- Password must be at least 8 characters (enforced in API)
- Usage count resets monthly based on usage_reset_date
- Default plan is 'FREE' with 100 monthly checks
- New users get usage_reset_date set to next month

---

### 2. User Settings Table - SP-API Configuration

```sql
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT,
    client_id VARCHAR(255),
    client_secret VARCHAR(255),
    seller_id VARCHAR(255),
    marketplace VARCHAR(50) DEFAULT 'ATVPDKIKX0DER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

#### Field Descriptions:
- **id**: Primary key
- **user_id**: Foreign key to users table (1:1 relationship)
- **refresh_token**: Amazon SP-API refresh token (encrypted in storage)
- **client_id**: SP-API client identifier
- **client_secret**: SP-API client secret
- **seller_id**: Amazon seller/merchant identifier
- **marketplace**: Amazon marketplace ID (US, EU, FE regions)

#### Supported Marketplaces:
```javascript
const MARKETPLACES = {
    'ATVPDKIKX0DER': 'Amazon US',
    'A1PA6795UKMFR9': 'Amazon Canada',
    'A1RKKUPIHCS9HS': 'Amazon Spain',
    'A1F83G8C2ARO7P': 'Amazon UK',
    'A13V1IB3VIYZZH': 'Amazon France',
    'A1PA6795UKMFR9': 'Amazon Germany',
    'APJ6JRA9NG5V4': 'Amazon Italy',
    'A1VC38T7YXB528': 'Amazon Japan',
    'AAHKV2X7AFYLW': 'Amazon Australia'
};
```

#### Business Rules:
- One settings record per user (enforced by UNIQUE constraint)
- Cascade delete when user is deleted
- All SP-API fields required for ASIN checking functionality
- Marketplace defaults to US Amazon (ATVPDKIKX0DER)

---

### 3. ASIN History Table - Search Analytics

```sql
CREATE TABLE asin_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asin VARCHAR(20) NOT NULL,
    result BOOLEAN,
    api_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and analytics
CREATE INDEX idx_asin_history_user_id ON asin_history(user_id);
CREATE INDEX idx_asin_history_created_at ON asin_history(created_at);
CREATE INDEX idx_asin_history_asin ON asin_history(asin);
CREATE INDEX idx_asin_history_result ON asin_history(result);
```

#### Field Descriptions:
- **id**: Primary key
- **user_id**: Foreign key to users table
- **asin**: Amazon Standard Identification Number (10-character alphanumeric)
- **result**: Boolean indicating if ASIN is eligible for FBA
- **api_response**: Complete SP-API response (JSON format)
- **created_at**: Timestamp of ASIN check

#### API Response Structure:
```json
{
    "eligible": true,
    "restrictions": ["HAZMAT", "REQUIRES_APPROVAL"],
    "details": {
        "title": "Product Name",
        "brand": "Brand Name",
        "category": "Electronics",
        "rank": 15420,
        "dimensions": {
            "length": 10.5,
            "width": 8.2,
            "height": 2.1,
            "units": "inches"
        },
        "weight": {
            "value": 1.2,
            "units": "pounds"
        }
    },
    "imageUrl": "https://images-na.ssl-images-amazon.com/...",
    "lastChecked": "2025-01-15T10:30:00.000Z"
}
```

#### Business Rules:
- Each ASIN check creates a new history record
- JSON response stored for analytics and debugging
- Users can view their complete search history
- History used for usage tracking and billing

---

### 4. Subscription History Table - Billing Tracking

```sql
CREATE TABLE subscription_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_code VARCHAR(50) NOT NULL,
    stripe_session_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_status ON subscription_history(status);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at);
```

#### Field Descriptions:
- **id**: Primary key
- **user_id**: Foreign key to users table
- **plan_code**: Subscription plan identifier
- **stripe_session_id**: Stripe checkout session ID
- **stripe_subscription_id**: Stripe subscription ID (for recurring billing)
- **status**: Subscription status
- **created_at**: Subscription start date
- **ended_at**: Subscription end date (NULL for active)

#### Subscription Status Values:
- **active**: Currently active subscription
- **canceled**: User canceled subscription
- **past_due**: Payment failed, grace period
- **unpaid**: Payment failed, access restricted
- **expired**: Subscription period ended

#### Plan Codes & Limits:
```javascript
const SUBSCRIPTION_PLANS = {
    'FREE': {
        name: 'Free Plan',
        monthlyLimit: 100,
        price: 0,
        stripePriceId: null
    },
    'BASIC': {
        name: 'Basic Plan',
        monthlyLimit: 1000,
        price: 29.99,
        stripePriceId: 'price_basic_monthly'
    },
    'PREMIUM': {
        name: 'Premium Plan',
        monthlyLimit: 5000,
        price: 79.99,
        stripePriceId: 'price_premium_monthly'
    },
    'ENTERPRISE': {
        name: 'Enterprise Plan',
        monthlyLimit: -1, // Unlimited
        price: 199.99,
        stripePriceId: 'price_enterprise_monthly'
    }
};
```

---

### 5. Login History Table - Security Auditing

```sql
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for security analysis
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_time ON login_history(login_time);
CREATE INDEX idx_login_history_ip_address ON login_history(ip_address);
```

#### Field Descriptions:
- **id**: Primary key
- **user_id**: Foreign key to users table
- **ip_address**: Client IP address (supports IPv4/IPv6)
- **user_agent**: Browser/client user agent string
- **login_time**: Login timestamp

#### Security Use Cases:
- Track suspicious login patterns
- Detect unusual geographic access
- Monitor brute force attempts
- Audit successful authentications
- Compliance and forensic analysis

---

## 🔍 Database Queries & Analytics

### Common Query Patterns

#### 1. User Authentication & Profile
```sql
-- User login with usage information
SELECT u.id, u.email, u.subscription_plan, u.monthly_usage_count, 
       u.usage_reset_date, u.is_active, u.created_at
FROM users u 
WHERE u.email = $1 AND u.is_active = true;

-- Get user with SP-API settings
SELECT u.*, s.refresh_token, s.client_id, s.client_secret, 
       s.seller_id, s.marketplace
FROM users u
LEFT JOIN user_settings s ON u.id = s.user_id
WHERE u.id = $1;
```

#### 2. Usage Tracking & Billing
```sql
-- Check current usage against plan limit
SELECT u.subscription_plan, u.monthly_usage_count,
       CASE 
           WHEN u.subscription_plan = 'FREE' THEN 100
           WHEN u.subscription_plan = 'BASIC' THEN 1000
           WHEN u.subscription_plan = 'PREMIUM' THEN 5000
           WHEN u.subscription_plan = 'ENTERPRISE' THEN -1
           ELSE 100
       END as plan_limit
FROM users u WHERE u.id = $1;

-- Monthly usage reset (scheduled job)
UPDATE users 
SET monthly_usage_count = 0, 
    usage_reset_date = DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
WHERE usage_reset_date <= CURRENT_DATE;
```

#### 3. ASIN Analytics
```sql
-- User's recent ASIN history
SELECT asin, result, api_response->>'details' as details, created_at
FROM asin_history 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 50;

-- ASIN success rate analytics
SELECT 
    COUNT(*) as total_checks,
    SUM(CASE WHEN result = true THEN 1 ELSE 0 END) as eligible_count,
    ROUND(AVG(CASE WHEN result = true THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
FROM asin_history 
WHERE user_id = $1 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
```

#### 4. Subscription Management
```sql
-- Active subscribers by plan
SELECT subscription_plan, COUNT(*) as subscriber_count
FROM users 
WHERE subscription_plan != 'FREE' 
    AND is_active = true
GROUP BY subscription_plan;

-- Subscription lifecycle tracking
SELECT sh.plan_code, sh.status, COUNT(*) as count,
       AVG(EXTRACT(days FROM (COALESCE(sh.ended_at, CURRENT_TIMESTAMP) - sh.created_at))) as avg_duration_days
FROM subscription_history sh
GROUP BY sh.plan_code, sh.status;
```

#### 5. Security & Audit Queries
```sql
-- Suspicious login patterns (multiple IPs)
SELECT user_id, COUNT(DISTINCT ip_address) as distinct_ips
FROM login_history 
WHERE login_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 5;

-- Failed login attempts (application level tracking)
SELECT ip_address, COUNT(*) as failed_attempts
FROM failed_login_attempts 
WHERE attempt_time >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 10;
```

## 🎯 Database Performance Optimization

### Indexing Strategy
```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_asin_history_user_created ON asin_history(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_subscription_active ON subscription_history(user_id) WHERE status = 'active';

-- Analytics indexes
CREATE INDEX CONCURRENTLY idx_asin_history_monthly ON asin_history(user_id, created_at) 
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
CREATE INDEX CONCURRENTLY idx_login_history_recent ON login_history(user_id, login_time) 
    WHERE login_time >= CURRENT_DATE - INTERVAL '30 days';
```

### Query Optimization Tips
1. **Use EXPLAIN ANALYZE** for slow queries
2. **Paginate** large result sets with LIMIT/OFFSET
3. **Use partial indexes** for frequently filtered columns
4. **Avoid SELECT \*** in production queries
5. **Use connection pooling** (implemented in backend)

### Regular Maintenance
```sql
-- Weekly statistics update
ANALYZE users, user_settings, asin_history, subscription_history, login_history;

-- Monthly cleanup (older than 1 year)
DELETE FROM login_history WHERE login_time < CURRENT_DATE - INTERVAL '1 year';
DELETE FROM asin_history WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

## 🚀 Database Migration & Backup

### Migration Scripts
Located in `fastchecker-backend/scripts/`:
- **migrate.js**: Initial schema creation
- **migrate-seller-uniqueness.js**: Add seller ID constraints
- **add-google-oauth-fields.js**: OAuth field additions (removed)

### Backup Strategy
```bash
# Daily automated backup (Railway PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Point-in-time recovery available for 7 days
# Full backups retained for 30 days
```

## 📊 Data Retention Policies

### Production Data Retention
- **User Accounts**: Indefinite (until user deletion)
- **ASIN History**: 2 years for analytics
- **Login History**: 1 year for security auditing
- **Subscription History**: Indefinite for billing compliance

### Development/Testing
- **Test Data**: Cleared monthly
- **Development Backups**: 7 days retention
- **Staging Database**: Reset weekly

---

**Database Version**: PostgreSQL 14+  
**Schema Version**: 2.0  
**Last Updated**: 2025-01-15  
**Total Tables**: 5 core tables + indexes  
**Estimated Storage**: ~100MB per 100K users