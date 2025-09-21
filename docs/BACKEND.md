# FastChecker Backend Documentation

## 🎯 Backend Overview

The FastChecker backend is a Node.js REST API built with Express.js, PostgreSQL, and integrated with Amazon SP-API and Stripe. It provides comprehensive user management, authentication, ASIN checking, and subscription services.

## 📁 Backend Structure

```
fastchecker-backend/
├── server.js                    # Express Server Entry Point
├── package.json                 # Dependencies & Scripts
├── config/
│   └── database.js              # PostgreSQL Connection Pool
├── controllers/
│   ├── authController.js        # Authentication Logic
│   ├── asinController.js        # ASIN Checking Logic
│   ├── subscriptionController.js# Subscription Management
│   └── settingsController.js    # User Settings Management
├── routes/
│   ├── auth.js                  # Authentication Endpoints
│   ├── asin.js                  # ASIN Check Endpoints
│   ├── subscription.js          # Subscription Endpoints
│   └── settings.js              # Settings Endpoints
├── middleware/
│   ├── auth.js                  # JWT Authentication Middleware
│   ├── rateLimiter.js           # Rate Limiting Configuration
│   └── validation.js            # Input Validation Middleware
├── services/
│   ├── amazonSpApi.js           # Amazon SP-API Integration
│   ├── stripeService.js         # Stripe Payment Processing
│   └── emailService.js          # Email Notifications (Future)
└── scripts/
    ├── migrate.js               # Database Migration Script
    ├── seed.js                  # Database Seed Data
    └── migrate-seller-uniqueness.js # Migration Scripts
```

## 🚀 Server Configuration

### Express Server Setup (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression & Logging
app.use(compression());
app.use(morgan('combined'));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Max requests per window
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', generalLimiter);

// Route Registration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/check', require('./routes/asin'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/settings', require('./routes/settings'));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('Global error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FastChecker API running on port ${PORT}`);
});
```

## 🗄️ Database Configuration

### PostgreSQL Connection Pool (config/database.js)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,                    // Maximum connections in pool
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Return error if can't connect within 2s
    maxUses: 7500,              // Close connection after 7500 uses
});

// Connection event handlers
pool.on('connect', (client) => {
    console.log('📦 New database connection established');
});

pool.on('error', (err) => {
    console.error('💥 Database pool error:', err);
    process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('💥 Database connection failed:', err);
        process.exit(-1);
    } else {
        console.log('✅ Database connected successfully');
    }
});

module.exports = pool;
```

## 🔐 Authentication System

### JWT Authentication Controller (controllers/authController.js)
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1', [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Hash password with salt rounds 12
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Create user with transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                `INSERT INTO users (email, password_hash, subscription_plan, monthly_usage_count, is_active) 
                 VALUES ($1, $2, 'FREE', 0, true) 
                 RETURNING id, email, subscription_plan, monthly_usage_count, created_at`,
                [email, passwordHash]
            );
            
            const user = result.rows[0];
            
            // Create default settings
            await client.query(
                `INSERT INTO user_settings (user_id, refresh_token, client_id, client_secret, seller_id, marketplace) 
                 VALUES ($1, '', '', '', '', 'ATVPDKIKX0DER')`,
                [user.id]
            );
            
            await client.query('COMMIT');
            
            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            
            res.status(201).json({
                message: 'User created successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    subscriptionPlan: user.subscription_plan,
                    monthlyUsageCount: user.monthly_usage_count,
                    createdAt: user.created_at
                }
            });
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user with password hash
        const result = await pool.query(
            `SELECT id, email, password_hash, subscription_plan, monthly_usage_count, 
                    usage_reset_date, is_active, created_at 
             FROM users WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({ error: 'Account deactivated' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if monthly usage should reset
        const now = new Date();
        const resetDate = new Date(user.usage_reset_date);
        
        if (now > resetDate) {
            // Reset monthly usage
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            await pool.query(
                'UPDATE users SET monthly_usage_count = 0, usage_reset_date = $1 WHERE id = $2',
                [nextMonth, user.id]
            );
            user.monthly_usage_count = 0;
        }
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        // Log successful login
        await pool.query(
            'INSERT INTO login_history (user_id, ip_address, user_agent, login_time) VALUES ($1, $2, $3, $4)',
            [user.id, req.ip, req.get('User-Agent'), now]
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                subscriptionPlan: user.subscription_plan.toUpperCase(),
                monthlyUsageCount: user.monthly_usage_count,
                usageResetDate: user.usage_reset_date,
                createdAt: user.created_at
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, getProfile };
```

### JWT Middleware (middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }
        
        const token = authHeader.split(' ')[1];
        
        try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user still exists and is active
            const result = await pool.query(
                'SELECT id, email, subscription_plan, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }
            
            const user = result.rows[0];
            
            if (!user.is_active) {
                return res.status(401).json({ error: 'Account deactivated' });
            }
            
            // Add user info to request object
            req.user = {
                userId: user.id,
                email: user.email,
                subscriptionPlan: user.subscription_plan
            };
            
            next();
            
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            } else {
                throw jwtError;
            }
        }
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = authMiddleware;
```

## 🛒 ASIN Checking System

### ASIN Controller (controllers/asinController.js)
```javascript
const pool = require('../config/database');
const amazonSpApi = require('../services/amazonSpApi');

const checkASINs = async (req, res) => {
    try {
        const { asins } = req.body;
        const userId = req.user.userId;
        
        // Input validation
        if (!Array.isArray(asins) || asins.length === 0) {
            return res.status(400).json({ error: 'ASINs array required' });
        }
        
        if (asins.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 ASINs per request' });
        }
        
        // Check user's current usage and plan limits
        const userResult = await pool.query(
            `SELECT monthly_usage_count, subscription_plan, usage_reset_date 
             FROM users WHERE id = $1`,
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        const planLimits = {
            'FREE': 100,
            'BASIC': 1000,
            'PREMIUM': 5000,
            'ENTERPRISE': -1 // Unlimited
        };
        
        const currentLimit = planLimits[user.subscription_plan.toUpperCase()] || 100;
        
        if (currentLimit !== -1 && user.monthly_usage_count + asins.length > currentLimit) {
            return res.status(429).json({ 
                error: 'Usage limit exceeded',
                currentUsage: user.monthly_usage_count,
                limit: currentLimit,
                requested: asins.length
            });
        }
        
        // Get user's SP-API settings
        const settingsResult = await pool.query(
            'SELECT * FROM user_settings WHERE user_id = $1',
            [userId]
        );
        
        if (settingsResult.rows.length === 0) {
            return res.status(400).json({ error: 'SP-API settings not configured' });
        }
        
        const settings = settingsResult.rows[0];
        
        if (!settings.refresh_token || !settings.client_id || !settings.client_secret) {
            return res.status(400).json({ error: 'SP-API credentials incomplete' });
        }
        
        // Process ASINs through Amazon SP-API
        const results = [];
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const asin of asins) {
                try {
                    // Check ASIN with Amazon SP-API
                    const apiResult = await amazonSpApi.checkProductEligibility(asin, settings);
                    
                    const result = {
                        asin: asin,
                        eligible: apiResult.eligible,
                        restrictions: apiResult.restrictions || [],
                        details: apiResult.details || {},
                        imageUrl: apiResult.imageUrl || null,
                        checkedAt: new Date()
                    };
                    
                    results.push(result);
                    
                    // Store in ASIN history
                    await client.query(
                        `INSERT INTO asin_history (user_id, asin, result, api_response, created_at) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [userId, asin, apiResult.eligible, JSON.stringify(apiResult), new Date()]
                    );
                    
                } catch (asinError) {
                    console.error(`Error checking ASIN ${asin}:`, asinError);
                    results.push({
                        asin: asin,
                        eligible: false,
                        error: 'API Error',
                        details: { error: asinError.message },
                        checkedAt: new Date()
                    });
                }
            }
            
            // Update user usage count
            await client.query(
                'UPDATE users SET monthly_usage_count = monthly_usage_count + $1 WHERE id = $2',
                [asins.length, userId]
            );
            
            await client.query('COMMIT');
            
            // Get updated usage info
            const updatedUser = await pool.query(
                'SELECT monthly_usage_count FROM users WHERE id = $1',
                [userId]
            );
            
            res.json({
                success: true,
                results: results,
                usage: {
                    current: updatedUser.rows[0].monthly_usage_count,
                    limit: currentLimit,
                    remaining: currentLimit === -1 ? -1 : currentLimit - updatedUser.rows[0].monthly_usage_count
                },
                processedCount: results.length
            });
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('ASIN check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get ASIN History
const getHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0 } = req.query;
        
        const result = await pool.query(
            `SELECT asin, result, api_response, created_at 
             FROM asin_history 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        const totalResult = await pool.query(
            'SELECT COUNT(*) FROM asin_history WHERE user_id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            history: result.rows,
            total: parseInt(totalResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { checkASINs, getHistory };
```

## 🏪 Amazon SP-API Integration

### SP-API Service (services/amazonSpApi.js)
```javascript
const fetch = require('node-fetch');
const crypto = require('crypto');

class AmazonSpApiService {
    constructor() {
        this.baseUrls = {
            'ATVPDKIKX0DER': 'https://sellingpartnerapi-na.amazon.com', // US
            'A1PA6795UKMFR9': 'https://sellingpartnerapi-na.amazon.com', // CA
            'A1RKKUPIHCS9HS': 'https://sellingpartnerapi-eu.amazon.com', // ES
            'A1F83G8C2ARO7P': 'https://sellingpartnerapi-eu.amazon.com', // UK
            'A13V1IB3VIYZZH': 'https://sellingpartnerapi-eu.amazon.com', // FR
            'A1PA6795UKMFR9': 'https://sellingpartnerapi-eu.amazon.com', // DE
            'APJ6JRA9NG5V4':  'https://sellingpartnerapi-eu.amazon.com', // IT
            'A1VC38T7YXB528': 'https://sellingpartnerapi-fe.amazon.com', // JP
            'AAHKV2X7AFYLW':  'https://sellingpartnerapi-fe.amazon.com', // AU
        };
    }
    
    async getAccessToken(settings) {
        try {
            const tokenUrl = 'https://api.amazon.com/auth/o2/token';
            
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: settings.refresh_token,
                client_id: settings.client_id,
                client_secret: settings.client_secret
            });
            
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
            }
            
            const tokenData = await response.json();
            return tokenData.access_token;
            
        } catch (error) {
            console.error('Token refresh error:', error);
            throw new Error('Failed to refresh access token');
        }
    }
    
    async checkProductEligibility(asin, settings) {
        try {
            const accessToken = await this.getAccessToken(settings);
            const baseUrl = this.baseUrls[settings.marketplace] || this.baseUrls['ATVPDKIKX0DER'];
            
            // Get product information
            const productInfo = await this.getProductInfo(asin, accessToken, baseUrl, settings.marketplace);
            
            // Check FBA eligibility
            const eligibility = await this.getFBAEligibility(asin, accessToken, baseUrl, settings.marketplace);
            
            // Check for restrictions
            const restrictions = await this.getProductRestrictions(asin, accessToken, baseUrl, settings.marketplace);
            
            return {
                eligible: eligibility.eligible,
                restrictions: restrictions.restrictions || [],
                details: {
                    title: productInfo.title,
                    brand: productInfo.brand,
                    category: productInfo.category,
                    rank: productInfo.rank,
                    dimensions: productInfo.dimensions,
                    weight: productInfo.weight
                },
                imageUrl: productInfo.imageUrl,
                lastChecked: new Date()
            };
            
        } catch (error) {
            console.error(`SP-API error for ASIN ${asin}:`, error);
            
            // Return structured error response
            return {
                eligible: false,
                restrictions: ['API_ERROR'],
                details: { error: error.message },
                imageUrl: null,
                lastChecked: new Date()
            };
        }
    }
    
    async getProductInfo(asin, accessToken, baseUrl, marketplace) {
        const url = `${baseUrl}/catalog/v0/items/${asin}?MarketplaceId=${marketplace}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-amz-access-token': accessToken
            }
        });
        
        if (!response.ok) {
            throw new Error(`Product info API error: ${response.status}`);
        }
        
        const data = await response.json();
        const item = data.payload;
        
        return {
            title: item.AttributeSets?.[0]?.Title || 'N/A',
            brand: item.AttributeSets?.[0]?.Brand || 'N/A',
            category: item.AttributeSets?.[0]?.ProductGroup || 'N/A',
            imageUrl: item.AttributeSets?.[0]?.SmallImage?.URL || null,
            dimensions: item.AttributeSets?.[0]?.PackageDimensions || null,
            weight: item.AttributeSets?.[0]?.PackageDimensions?.Weight || null
        };
    }
    
    async getFBAEligibility(asin, accessToken, baseUrl, marketplace) {
        const url = `${baseUrl}/fba/inbound/v0/preorder/guidance?MarketplaceId=${marketplace}&SellerSKU=${asin}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-amz-access-token': accessToken
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return { eligible: true, guidance: data.payload };
            } else {
                return { eligible: false, reason: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { eligible: false, reason: error.message };
        }
    }
    
    async getProductRestrictions(asin, accessToken, baseUrl, marketplace) {
        const url = `${baseUrl}/listings/2021-08-01/restrictions?asin=${asin}&conditionType=new&marketplaceIds=${marketplace}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-amz-access-token': accessToken
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    restrictions: data.restrictions || [],
                    details: data.payload || {}
                };
            } else {
                return { restrictions: [] };
            }
        } catch (error) {
            return { restrictions: [`API_ERROR: ${error.message}`] };
        }
    }
}

module.exports = new AmazonSpApiService();
```

## 💳 Stripe Integration

### Subscription Controller (controllers/subscriptionController.js)
```javascript
const pool = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get subscription plans
const getPlans = async (req, res) => {
    try {
        const plans = [
            {
                code: 'FREE',
                name: 'Free Plan',
                price: 0,
                limit: 100,
                features: ['100 ASIN checks per month', 'Basic support'],
                stripePriceId: null
            },
            {
                code: 'BASIC',
                name: 'Basic Plan', 
                price: 29.99,
                limit: 1000,
                features: ['1,000 ASIN checks per month', 'Priority support', 'Export results'],
                stripePriceId: 'price_basic_monthly'
            },
            {
                code: 'PREMIUM',
                name: 'Premium Plan',
                price: 79.99, 
                limit: 5000,
                features: ['5,000 ASIN checks per month', 'Priority support', 'Advanced analytics', 'API access'],
                stripePriceId: 'price_premium_monthly'
            },
            {
                code: 'ENTERPRISE',
                name: 'Enterprise Plan',
                price: 199.99,
                limit: -1, // Unlimited
                features: ['Unlimited ASIN checks', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
                stripePriceId: 'price_enterprise_monthly'
            }
        ];
        
        res.json({ success: true, plans });
        
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create checkout session
const createCheckoutSession = async (req, res) => {
    try {
        const { planCode } = req.body;
        const userId = req.user.userId;
        const userEmail = req.user.email;
        
        // Get plan details
        const validPlans = {
            'BASIC': 'price_basic_monthly',
            'PREMIUM': 'price_premium_monthly', 
            'ENTERPRISE': 'price_enterprise_monthly'
        };
        
        const stripePriceId = validPlans[planCode.toUpperCase()];
        if (!stripePriceId) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            payment_method_types: ['card'],
            line_items: [{
                price: stripePriceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
            metadata: {
                userId: userId.toString(),
                planCode: planCode.toUpperCase()
            },
            subscription_data: {
                metadata: {
                    userId: userId.toString(),
                    planCode: planCode.toUpperCase()
                }
            }
        });
        
        res.json({
            success: true,
            checkoutUrl: session.url,
            sessionId: session.id
        });
        
    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

// Handle Stripe webhooks
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
                
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        
        res.json({ received: true });
        
    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

async function handleCheckoutCompleted(session) {
    const userId = parseInt(session.metadata.userId);
    const planCode = session.metadata.planCode;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update user subscription
        await client.query(
            'UPDATE users SET subscription_plan = $1, stripe_customer_id = $2 WHERE id = $3',
            [planCode, session.customer, userId]
        );
        
        // Reset usage count for new subscription
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        
        await client.query(
            'UPDATE users SET monthly_usage_count = 0, usage_reset_date = $1 WHERE id = $2',
            [nextMonth, userId]
        );
        
        // Record subscription history
        await client.query(
            `INSERT INTO subscription_history (user_id, plan_code, stripe_session_id, status, created_at) 
             VALUES ($1, $2, $3, 'active', $4)`,
            [userId, planCode, session.id, new Date()]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Subscription activated for user ${userId}: ${planCode}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Subscription activation error:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getPlans,
    createCheckoutSession,
    handleWebhook
};
```

## 🛡️ Security & Rate Limiting

### Rate Limiting Configuration (middleware/rateLimiter.js)
```javascript
const rateLimit = require('express-rate-limit');

// Authentication rate limiting (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts per window
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: Math.ceil(15 * 60) // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ASIN checking rate limiting
const asinLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Max 20 requests per window
    message: {
        error: 'Too many ASIN check requests, please slow down.',
        retryAfter: Math.ceil(5 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Max 1000 requests per window
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(15 * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    asinLimiter,
    generalLimiter
};
```

## 📊 Database Operations

### Migration System (scripts/migrate.js)
```javascript
const pool = require('../config/database');

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
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
            )
        `);
        
        // Create user_settings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
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
            )
        `);
        
        // Create asin_history table
        await client.query(`
            CREATE TABLE IF NOT EXISTS asin_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                asin VARCHAR(20) NOT NULL,
                result BOOLEAN,
                api_response JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create subscription_history table
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscription_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                plan_code VARCHAR(50) NOT NULL,
                stripe_session_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )
        `);
        
        // Create login_history table
        await client.query(`
            CREATE TABLE IF NOT EXISTS login_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                ip_address INET,
                user_agent TEXT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create indexes for performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_asin_history_user_id ON asin_history(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_asin_history_created_at ON asin_history(created_at)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id)');
        
        await client.query('COMMIT');
        console.log('✅ All migrations completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('💥 Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = runMigrations;
```

---

**Backend Version**: 2.0  
**Last Updated**: 2025-01-15  
**Runtime**: Node.js 18+  
**Database**: PostgreSQL 14+  
**Deployment**: Railway.app