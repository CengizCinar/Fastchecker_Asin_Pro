# FastChecker Chrome Extension - Complete Project Documentation

## 🎯 Project Overview

FastChecker is a professional Chrome extension for Amazon SP-API ASIN checking with a multi-user backend system. The project consists of a Chrome extension frontend and a Node.js/PostgreSQL backend with subscription management.

## 🏗️ Architecture Overview

```
FastChecker Project
├── Chrome Extension (Frontend)
│   ├── Manifest v3 Configuration
│   ├── Side Panel Interface
│   ├── Authentication System
│   └── Multi-language Support
└── Backend API (Node.js)
    ├── Authentication & User Management
    ├── SP-API Integration
    ├── Subscription Management (Stripe)
    └── PostgreSQL Database
```

## 📁 Project Structure

```
sidepanel_extension_4/
├── manifest.json                      # Chrome Extension Manifest v3
├── background.js                       # Service Worker
├── sidepanel/
│   ├── sidepanel.html                 # Main UI Interface
│   ├── sidepanel.css                  # Complete Styling System
│   └── sidepanel.js                   # Core Frontend Logic
├── services/
│   ├── authService.js                 # Authentication Handler
│   └── apiClient.js                   # Backend API Communication
├── icons/                             # Extension Icons
├── fastchecker-backend/               # Backend System
│   ├── server.js                      # Express Server
│   ├── controllers/                   # Business Logic
│   ├── routes/                        # API Endpoints
│   ├── middleware/                    # Auth & Rate Limiting
│   ├── config/                        # Database & Configuration
│   └── scripts/                       # Migration Scripts
└── docs/                              # Documentation (this folder)
```

## 🌟 Key Features

### Frontend Features
- **Modern UI**: Professional gradient design with glass morphism effects
- **Multi-language**: Complete Turkish/English translation system
- **Authentication**: JWT-based login/register system
- **ASIN Checking**: SP-API integration for Amazon product eligibility
- **Subscription Management**: Stripe integration for plan upgrades
- **Real-time Usage**: Dynamic usage tracking and display

### Backend Features
- **User Management**: Complete authentication system with bcrypt
- **SP-API Integration**: Amazon Selling Partner API connectivity
- **Subscription System**: Stripe payment processing
- **Rate Limiting**: API protection and abuse prevention
- **Database**: PostgreSQL with comprehensive user/usage tracking
- **Security**: Helmet, CORS, input validation, XSS protection

## 🔧 Technology Stack

### Frontend
- **Chrome Extension API**: Manifest v3, Side Panel API
- **Vanilla JavaScript**: ES6+ with modern async/await
- **CSS3**: Custom properties, gradients, animations
- **Font**: Inter from Google Fonts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with pg library
- **Authentication**: JWT + bcrypt
- **Payments**: Stripe API
- **Security**: Helmet, CORS, rate-limiting
- **Logging**: Winston
- **Validation**: Joi

## 🚀 Deployment

### Frontend (Chrome Extension)
- **Development**: Load unpacked extension from project folder
- **Production**: Package and submit to Chrome Web Store

### Backend (Railway)
- **Platform**: Railway.app
- **Environment**: Production environment with PostgreSQL addon
- **Deployment**: Connected to GitHub repository for auto-deploy
- **URL**: `https://professionalfastchecker-production.up.railway.app`

## 📋 Environment Configuration

### Backend Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# CORS
ALLOWED_ORIGINS=chrome-extension://your-extension-id

# Server
PORT=3000
NODE_ENV=production
```

## 🔄 Development Workflow

### 1. Local Development Setup
```bash
# Backend setup
cd fastchecker-backend
npm install
npm run dev

# Database migrations
npm run migrate
npm run seed
```

### 2. Frontend Development
- Load unpacked extension in Chrome
- Use Chrome DevTools for debugging
- Test with backend running locally

### 3. Deployment Process
- **Backend**: Push to GitHub → Railway auto-deploys
- **Frontend**: Git commit → Manual extension package → Chrome Store

## 📚 Documentation Structure

This documentation is organized into the following sections:

1. **[Architecture Guide](./ARCHITECTURE.md)** - Detailed system architecture
2. **[Frontend Documentation](./FRONTEND.md)** - Complete frontend guide
3. **[Backend Documentation](./BACKEND.md)** - Backend API and database
4. **[Authentication System](./AUTHENTICATION.md)** - Auth flow and security
5. **[UI Components Guide](./UI_COMPONENTS.md)** - All UI components
6. **[Translation System](./TRANSLATION.md)** - Multi-language implementation
7. **[Database Schema](./DATABASE.md)** - Complete database documentation
8. **[API Reference](./API.md)** - All backend endpoints
9. **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment steps
10. **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎨 Recent Major Updates

### v2.0 - Professional UI Redesign (Latest)
- **Login System**: Complete redesign with gradient backgrounds
- **Language Toggle**: Flag icons with glass morphism effects
- **Typography**: Refined spacing and professional fonts
- **Translation**: Complete Turkish localization
- **UX**: Removed scroll issues, optimized for extension viewport
- **Security**: Removed Google OAuth, strengthened JWT authentication

## 🔍 Quick Start Guide

### For New Developers
1. Read this README completely
2. Review [Architecture Guide](./ARCHITECTURE.md)
3. Study [Frontend Documentation](./FRONTEND.md)
4. Understand [Authentication System](./AUTHENTICATION.md)
5. Check [Database Schema](./DATABASE.md)
6. Test with [API Reference](./API.md)

### For Returning to Development
1. Check recent commits for latest changes
2. Review relevant component documentation
3. Verify environment configuration
4. Test authentication and API endpoints
5. Validate UI components and translations

## 📞 Development Notes

### Code Quality Standards
- **ES6+ JavaScript**: Modern syntax with async/await
- **CSS Custom Properties**: Consistent theming system
- **Responsive Design**: Extension viewport optimization
- **Security First**: Input validation, XSS protection
- **Performance**: Optimized queries and minimal DOM manipulation

### Git Workflow
- **Main Branch**: Production-ready code
- **Backend Branch**: Backend-specific changes
- **Feature Branches**: New feature development
- **Commit Messages**: Detailed with emoji prefixes

---

**Last Updated**: 2025-01-15  
**Version**: 2.0  
**Developer**: FastChecker Team  
**Documentation**: Complete project reference