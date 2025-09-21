# FastChecker API Reference Documentation

## 🌐 API Overview

FastChecker backend provides a comprehensive REST API for user management, ASIN checking, subscription management, and settings configuration. All endpoints are secured with JWT authentication and include comprehensive error handling.

## 🔗 Base URL

```
Production: https://professionalfastchecker-production.up.railway.app
Development: http://localhost:3000
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Format
```json
{
  "userId": 123,
  "email": "user@example.com",
  "iat": 1705306800,
  "exp": 1705911600,
  "iss": "fastchecker",
  "aud": "fastchecker-users"
}
```

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "subscriptionPlan": "FREE",
    "monthlyUsageCount": 0,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Email and password required"
}

// 409 Conflict
{
  "error": "User already exists"
}

// 400 Bad Request
{
  "error": "Password must be at least 8 characters"
}
```

---

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "subscriptionPlan": "FREE",
    "monthlyUsageCount": 15,
    "usageResetDate": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLogin": "2025-01-15T15:45:00.000Z"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "Invalid credentials"
}

// 401 Unauthorized
{
  "error": "Account deactivated"
}

// 429 Too Many Requests
{
  "error": "Too many authentication attempts, please try again later.",
  "retryAfter": 900
}
```

---

#### GET /api/auth/profile
Get current user profile information.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "subscriptionPlan": "BASIC",
    "monthlyUsageCount": 245,
    "usageResetDate": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLogin": "2025-01-15T15:45:00.000Z",
    "isActive": true,
    "subscription": {
      "plan_code": "BASIC",
      "status": "active",
      "subscription_date": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "Authorization token required"
}

// 404 Not Found
{
  "error": "User not found"
}
```

---

### 🔍 ASIN Checking Endpoints

#### POST /api/check/asins
Check multiple ASINs for FBA eligibility.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "asins": ["B08N5WRWNW", "B07FZ8S74R", "B09KMVJBQX"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "asin": "B08N5WRWNW",
      "eligible": true,
      "restrictions": [],
      "details": {
        "title": "Echo Dot (4th Gen)",
        "brand": "Amazon",
        "category": "Electronics",
        "rank": 1250,
        "dimensions": {
          "length": 3.9,
          "width": 3.9,
          "height": 3.5,
          "units": "inches"
        },
        "weight": {
          "value": 1.2,
          "units": "pounds"
        }
      },
      "imageUrl": "https://images-na.ssl-images-amazon.com/...",
      "checkedAt": "2025-01-15T15:30:00.000Z"
    },
    {
      "asin": "B07FZ8S74R",
      "eligible": false,
      "restrictions": ["HAZMAT", "REQUIRES_APPROVAL"],
      "details": {
        "title": "Product Title",
        "brand": "Brand Name",
        "category": "Category",
        "error": null
      },
      "imageUrl": null,
      "checkedAt": "2025-01-15T15:30:00.000Z"
    }
  ],
  "usage": {
    "current": 18,
    "limit": 100,
    "remaining": 82
  },
  "processedCount": 2
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "ASINs array required"
}

// 400 Bad Request  
{
  "error": "Maximum 100 ASINs per request"
}

// 429 Too Many Requests
{
  "error": "Usage limit exceeded",
  "currentUsage": 95,
  "limit": 100,
  "requested": 10
}

// 400 Bad Request
{
  "error": "SP-API settings not configured"
}

// 429 Too Many Requests
{
  "error": "Too many ASIN check requests, please slow down.",
  "retryAfter": 300
}
```

---

#### GET /api/check/history
Get user's ASIN check history.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```http
GET /api/check/history?limit=25&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "history": [
    {
      "asin": "B08N5WRWNW",
      "result": true,
      "api_response": {
        "eligible": true,
        "restrictions": [],
        "details": { "title": "Echo Dot (4th Gen)" }
      },
      "created_at": "2025-01-15T15:30:00.000Z"
    }
  ],
  "total": 156,
  "limit": 25,
  "offset": 0
}
```

---

### ⚙️ Settings Endpoints

#### GET /api/settings
Get user's SP-API configuration settings.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "settings": {
    "refreshToken": "encrypted_token_here",
    "clientId": "amzn1.application-oa2-client.xxx",
    "clientSecret": "encrypted_secret_here", 
    "sellerId": "A1BZXXXXXXXXXXX",
    "marketplace": "ATVPDKIKX0DER",
    "lastUpdated": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Settings not found"
}
```

---

#### POST /api/settings
Update user's SP-API configuration settings.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "Atzr|IwEBIA...",
  "clientId": "amzn1.application-oa2-client.xxx",
  "clientSecret": "client_secret_value",
  "sellerId": "A1BZXXXXXXXXXXX", 
  "marketplace": "ATVPDKIKX0DER"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Missing required fields",
  "missing": ["refreshToken", "clientId"]
}

// 400 Bad Request
{
  "error": "Invalid marketplace ID"
}
```

---

#### POST /api/settings/test
Test SP-API connection with current settings.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection test successful",
  "details": {
    "accessToken": "valid",
    "marketplace": "ATVPDKIKX0DER",
    "sellerId": "A1BZXXXXXXXXXXX",
    "testedAt": "2025-01-15T15:45:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "SP-API connection failed",
  "details": "Invalid refresh token"
}

// 400 Bad Request
{
  "error": "Settings not configured"
}
```

---

### 💳 Subscription Endpoints

#### GET /api/subscription/plans
Get available subscription plans.

**Response (200 OK):**
```json
{
  "success": true,
  "plans": [
    {
      "code": "FREE",
      "name": "Free Plan",
      "price": 0,
      "limit": 100,
      "features": ["100 ASIN checks per month", "Basic support"],
      "stripePriceId": null
    },
    {
      "code": "BASIC", 
      "name": "Basic Plan",
      "price": 29.99,
      "limit": 1000,
      "features": ["1,000 ASIN checks per month", "Priority support", "Export results"],
      "stripePriceId": "price_basic_monthly"
    },
    {
      "code": "PREMIUM",
      "name": "Premium Plan", 
      "price": 79.99,
      "limit": 5000,
      "features": ["5,000 ASIN checks per month", "Priority support", "Advanced analytics", "API access"],
      "stripePriceId": "price_premium_monthly"
    },
    {
      "code": "ENTERPRISE",
      "name": "Enterprise Plan",
      "price": 199.99,
      "limit": -1,
      "features": ["Unlimited ASIN checks", "24/7 support", "Custom integrations", "Dedicated account manager"],
      "stripePriceId": "price_enterprise_monthly"
    }
  ]
}
```

---

#### POST /api/subscription/checkout
Create Stripe checkout session for plan upgrade.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planCode": "BASIC"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid plan selected"
}

// 500 Internal Server Error
{
  "error": "Failed to create checkout session"
}
```

---

#### POST /api/subscription/webhook
Handle Stripe webhooks (internal endpoint).

**Headers:**
```http
Stripe-Signature: <webhook_signature>
Content-Type: application/json
```

**Request Body:** (Raw Stripe webhook payload)

**Response (200 OK):**
```json
{
  "received": true
}
```

---

### 📊 Usage Analytics Endpoints

#### GET /api/analytics/usage
Get usage analytics for the current user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Time period ('7d', '30d', '90d') - default: '30d'

**Response (200 OK):**
```json
{
  "success": true,
  "analytics": {
    "period": "30d",
    "totalChecks": 245,
    "successfulChecks": 198,
    "failedChecks": 47,
    "successRate": 80.8,
    "dailyBreakdown": [
      {
        "date": "2025-01-15",
        "checks": 15,
        "successful": 12,
        "failed": 3
      }
    ],
    "topAsins": [
      {
        "asin": "B08N5WRWNW",
        "checks": 5,
        "lastChecked": "2025-01-15T15:30:00.000Z"
      }
    ]
  }
}
```

---

## 🔧 Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE", // Optional
  "details": { /* Additional error details */ }, // Optional
  "timestamp": "2025-01-15T15:30:00.000Z"
}
```

### HTTP Status Codes

| Status Code | Description | Common Causes |
|------------|-------------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data, validation errors |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Error Codes

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Valid authentication token required |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INVALID_TOKEN` | JWT token is malformed or invalid |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `USAGE_LIMIT_EXCEEDED` | Monthly usage limit reached |
| `SETTINGS_NOT_CONFIGURED` | SP-API settings incomplete |
| `SP_API_ERROR` | Amazon SP-API request failed |
| `STRIPE_ERROR` | Stripe payment processing error |

## 🛡️ Rate Limiting

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1705306800
```

### Rate Limits by Endpoint

| Endpoint Category | Window | Limit | Description |
|------------------|--------|-------|-------------|
| Authentication | 15 min | 10 requests | Per IP + email combination |
| ASIN Checking | 5 min | 20 requests | Per authenticated user |
| Settings | 15 min | 100 requests | Per authenticated user |
| Subscription | 15 min | 50 requests | Per authenticated user |
| General API | 15 min | 1000 requests | Per IP address |

## 📝 Request/Response Examples

### Example: Complete ASIN Check Flow

**1. Login:**
```bash
curl -X POST https://professionalfastchecker-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**2. Check ASINs:**
```bash
curl -X POST https://professionalfastchecker-production.up.railway.app/api/check/asins \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "asins": ["B08N5WRWNW", "B07FZ8S74R"]
  }'
```

**3. Get History:**
```bash
curl -X GET "https://professionalfastchecker-production.up.railway.app/api/check/history?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example: Settings Configuration

**1. Get Current Settings:**
```bash
curl -X GET https://professionalfastchecker-production.up.railway.app/api/settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**2. Update Settings:**
```bash
curl -X POST https://professionalfastchecker-production.up.railway.app/api/settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "Atzr|IwEBIA...",
    "clientId": "amzn1.application-oa2-client.xxx",
    "clientSecret": "client_secret_value",
    "sellerId": "A1BZXXXXXXXXXXX",
    "marketplace": "ATVPDKIKX0DER"
  }'
```

**3. Test Connection:**
```bash
curl -X POST https://professionalfastchecker-production.up.railway.app/api/settings/test \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔧 Development & Testing

### Health Check Endpoint
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T15:30:00.000Z",
  "version": "2.0.0"
}
```

### API Documentation
- **OpenAPI/Swagger**: Available at `/api/docs` (development)
- **Postman Collection**: Available in project repository
- **Integration Tests**: See `/tests/api/` directory

---

**API Version**: 2.0  
**Last Updated**: 2025-01-15  
**Base URL**: https://professionalfastchecker-production.up.railway.app  
**Authentication**: JWT Bearer Token  
**Content Type**: application/json