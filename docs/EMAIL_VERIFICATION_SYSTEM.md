# Email Verification System Documentation

## 🎯 **Overview**
FastChecker implements a comprehensive email verification system using SendGrid for secure user registration and authentication. All new users must verify their email address before accessing the system.

## 🏗️ **System Architecture**

### Components
1. **Backend API** - Node.js/Express endpoints for verification
2. **SendGrid Service** - Email delivery and templates
3. **Database** - PostgreSQL with verification tracking
4. **Frontend UI** - Chrome extension verification interface
5. **Domain Authentication** - SPF/DKIM/DMARC for deliverability

## 📧 **SendGrid Integration**

### Configuration
```javascript
// Environment Variables (Railway)
SENDGRID_API_KEY=SG.xxx...xxx
SENDGRID_TEMPLATE_ID=d-0ee5bf01f8b748ae902d1331632bb627
SENDGRID_FROM_EMAIL=noreply@peakpurchases.com
```

### Domain Authentication
**Domain**: `peakpurchases.com`
**Provider**: Hostinger DNS
**Records**: 5 CNAME + 1 TXT (DMARC)

```dns
# DNS Records for SendGrid Authentication
s1._domainkey.peakpurchases.com → s1.domainkey.u12345678.wl123.sendgrid.net
s2._domainkey.peakpurchases.com → s2.domainkey.u12345678.wl123.sendgrid.net
mail.peakpurchases.com → u12345678.wl123.sendgrid.net
url1234.peakpurchases.com → sendgrid.net
em1234.peakpurchases.com → u12345678.wl123.sendgrid.net
_dmarc.peakpurchases.com → "v=DMARC1; p=quarantine; rua=mailto:dmarc@peakpurchases.com"
```

## 📊 **Database Schema**

### Users Table Extensions
```sql
-- Email verification fields
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_code VARCHAR(6),
ADD COLUMN verification_expires TIMESTAMP;
```

### Key Fields
- `email_verified`: Boolean flag for verification status
- `verification_code`: 6-digit numeric code (expires in 10 minutes)
- `verification_expires`: Timestamp for code expiry

## 🔧 **API Endpoints**

### 1. Registration
**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success)**:
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "requiresVerification": true,
  "userId": 123
}
```

### 2. Email Verification
**POST** `/api/auth/verify-email`
```json
{
  "userId": 123,
  "verificationCode": "123456"
}
```

**Response (Success)**:
```json
{
  "message": "Email verified successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "subscriptionPlan": "free"
  }
}
```

### 3. Resend Verification
**POST** `/api/auth/resend-verification`
```json
{
  "userId": 123
}
```

### 4. Login (with verification check)
**POST** `/api/auth/login`
- Returns `requiresVerification: true` if email not verified
- Allows login only after email verification

## 🌍 **Multi-Language Support**

### Language Detection
1. **X-Language header** (priority) - Manually selected in extension
2. **Accept-Language header** - Browser language
3. **Default fallback** - English

### Supported Languages
- **English** (en): Default
- **Turkish** (tr): Full translation

### Error Messages
```javascript
// English
"userNotFound": "No account found with this email address. Please check your email or register for a new account."

// Turkish  
"userNotFound": "Bu e-posta adresi ile kayıtlı hesap bulunamadı. E-postanızı kontrol edin veya yeni hesap oluşturun."
```

## 🎨 **Frontend Integration**

### Chrome Extension Flow
1. **Registration** → Email verification required
2. **Verification Page** → Enter 6-digit code
3. **Login** → Automatic verification check
4. **Language Toggle** → Turkish/English support

### Error Handling
```javascript
// Frontend displays backend error messages directly
if (result.userNotFound) {
    this.showToast(result.error, 'error'); // Shows localized message
    this.showRegisterForm();
}
```

## 🛠️ **Management Scripts**

### Check User Verification Status
```bash
cd fastchecker-backend/
railway run node scripts/check-user-verification.js user@example.com
```

**Output**:
```
=== USER DETAILS ===
ID: 123
Email: user@example.com
Email Verified: false
Verification Code: 123456
Code Expires At: 2025-09-16T19:43:55.395Z
Current Time: 2025-09-16T19:33:35.313Z
Code Expired?: true
⚠️  Verification code has EXPIRED
```

### Resend Verification Code
```bash
railway run node scripts/resend-verification.js user@example.com
```

**Output**:
```
Generated new code: 183405
Expires at: 2025-09-16T19:43:55.395Z
Verification email sent to user@example.com: 202
✅ Verification code sent successfully
```

## 📈 **Email Deliverability**

### Domain Authentication Benefits
- **Improved Delivery**: SPF/DKIM/DMARC authentication
- **Reduced Spam**: Proper sender reputation
- **Brand Trust**: Emails from `noreply@peakpurchases.com`

### Monitoring
- **SendGrid Dashboard**: Email analytics and delivery stats
- **Backend Logs**: `Verification email sent to user@email.com: 202`
- **Railway Logs**: `railway logs` for real-time monitoring

## 🔒 **Security Features**

### Code Generation
```javascript
// 6-digit numeric code
generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### Expiry and Validation
- **10-minute expiry**: Codes automatically expire
- **Format validation**: 6-digit numeric only
- **Single use**: Codes invalidated after successful verification
- **Rate limiting**: Prevents spam/abuse

### Password Requirements
- **Minimum 8 characters**
- **Required fields**: Email and password validation
- **Secure storage**: bcrypt hashing (rounds: 12)

## 🚨 **Troubleshooting**

### Email Not Received
1. **Check spam folder** and all Gmail tabs
2. **Search by keywords**: FastChecker, verification, noreply@peakpurchases.com
3. **Check code expiry**: Codes expire in 10 minutes
4. **Resend code**: Use resend functionality or management script

### Common Issues
```bash
# Code expired
⚠️  Verification code has EXPIRED

# Invalid code format
❌ Invalid verification code format

# User not found
❌ User not found in database

# Email already verified
✅ Email already verified
```

### Debug Commands
```bash
# Check user status
railway run node scripts/check-user-verification.js email@example.com

# Resend code manually
railway run node scripts/resend-verification.js email@example.com

# Check Railway logs
railway logs

# Test SendGrid delivery
curl -X POST "https://professionalfastchecker-production.up.railway.app/api/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'
```

## 📋 **Development Workflow**

### Backend Changes
```bash
cd fastchecker-backend/
# Make changes to email service
git add .
git commit -m "🔧 Email: Feature description"
git push origin backend  # Auto-deploys to Railway
```

### Frontend Changes
```bash
# Main directory
git add .
git commit -m "🌍 Frontend: Email verification improvements"
git push origin main  # Manual merge via GitHub
```

### Testing
1. **Register new user** with test email
2. **Check SendGrid delivery** in dashboard
3. **Verify code input** in extension
4. **Test language switching** Turkish/English
5. **Validate error handling** for expired codes

## 🎯 **Key Benefits**

### Security
- **Verified ownership** of email addresses
- **Prevents fake registrations**
- **Secure JWT authentication** post-verification

### User Experience
- **Professional emails** from branded domain
- **Multi-language support** for global users
- **Clear error messages** with actionable guidance
- **Smooth verification flow** within extension

### Operational
- **Reliable delivery** via SendGrid infrastructure
- **Monitoring and analytics** for email performance
- **Management tools** for user support
- **Scalable architecture** for growth

This email verification system provides a robust foundation for secure user onboarding while maintaining excellent deliverability and user experience across multiple languages.