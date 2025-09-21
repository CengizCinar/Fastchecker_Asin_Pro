# FastChecker Frontend Documentation

## 🎯 Frontend Overview

The FastChecker Chrome extension frontend is built with vanilla JavaScript, modern CSS3, and Chrome Extension Manifest v3. It features a professional side panel interface with multi-language support and real-time backend integration.

## 📁 File Structure

```
Frontend Structure
├── manifest.json                 # Chrome Extension Configuration
├── background.js                 # Service Worker (Future features)
├── sidepanel/
│   ├── sidepanel.html           # Main Interface HTML
│   ├── sidepanel.css            # Complete Styling System
│   └── sidepanel.js             # Core Application Logic
├── services/
│   ├── authService.js           # Authentication Management
│   └── apiClient.js             # Backend API Communication
└── icons/                       # Extension Icons (16, 32, 48, 128px)
```

## 🏗️ Core Architecture

### Main Application Class: `FastChecker`

The entire frontend is managed by a single `FastChecker` class that handles:

```javascript
class FastChecker {
    constructor() {
        this.currentTab = 'check';           // Active navigation tab
        this.isAuthenticated = false;        // Authentication state
        this.currentUser = null;             // User data object
        this.currentLanguage = 'en';         // Selected language
        this.subscriptionData = null;        // Subscription information
        this.savedSettings = {};             // SP-API settings
    }
}
```

### Component Responsibilities

1. **Navigation Management**: Tab switching and route handling
2. **Authentication**: Login/register form handling
3. **ASIN Checking**: Product eligibility verification
4. **Settings Management**: SP-API configuration
5. **Subscription**: Plan management and usage tracking
6. **Translation**: Multi-language text management

## 🖥️ User Interface Components

### 1. Header System
```html
<header class="app-header">
    <!-- Logo and Title -->
    <div class="header-top">
        <div class="logo-section">
            <div class="logo-icon">⚡</div>
            <h1 class="app-title">FastChecker</h1>
        </div>
        <!-- Language and Theme Controls -->
        <div class="header-actions">...</div>
    </div>
    
    <!-- Usage Display and Upgrade -->
    <div class="status-bar">
        <span class="usage-count">0/100 checks used</span>
        <button class="upgrade-btn">💎 Upgrade</button>
    </div>
    
    <!-- Navigation Tabs -->
    <nav class="nav-tabs">...</nav>
</header>
```

### 2. Authentication Interface
```html
<!-- Professional Login Form -->
<div class="auth-section">
    <div class="auth-language-toggle">
        <button class="auth-lang-btn">
            <span class="lang-en">🇺🇸 EN</span>
            <span class="lang-tr">🇹🇷 TR</span>
        </button>
    </div>
    
    <div class="auth-container">
        <div class="auth-header">
            <div class="auth-icon">⚡</div>
            <h2 class="auth-title">Welcome to FastChecker</h2>
            <p class="auth-subtitle">Sign in to check your ASIN eligibility</p>
        </div>
        
        <div class="auth-card">
            <!-- Login Form -->
        </div>
        
        <div class="auth-footer">
            <p>Don't have an account? 
               <a href="#" class="auth-link">Sign up</a>
            </p>
        </div>
    </div>
</div>
```

### 3. Main Application Tabs

#### Tab 1: ASIN Check Interface
```html
<div id="checkTab" class="tab-content active">
    <!-- Input Section -->
    <div class="input-section">
        <textarea id="asinInput" placeholder="Enter ASINs to check..."></textarea>
        <div class="input-actions">
            <button id="checkAsins">Check ASINs</button>
            <button id="clearAsins">Clear</button>
        </div>
    </div>
    
    <!-- Results Section -->
    <div id="resultsSection">
        <div class="results-header">
            <h3>Results (<span id="resultsCount">0</span>)</h3>
            <button class="export-btn">Export</button>
        </div>
        <div id="results" class="results-container"></div>
    </div>
</div>
```

#### Tab 2: Settings Configuration
```html
<div id="settingsTab" class="tab-content">
    <!-- SP-API Configuration -->
    <div class="settings-section">
        <h3>SP-API Configuration</h3>
        <div class="form-group">
            <label>Refresh Token</label>
            <input type="password" id="refreshToken">
        </div>
        <!-- Additional SP-API fields -->
    </div>
    
    <!-- Preferences -->
    <div class="settings-section">
        <h3>Preferences</h3>
        <div class="preference-item">
            <label>Language</label>
            <select id="languageSelect">
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
            </select>
        </div>
    </div>
</div>
```

## 🎨 Styling System

### CSS Architecture
```css
/* CSS Custom Properties for Theming */
:root {
  --primary: 142 69 173;
  --primary-foreground: 255 255 255;
  --background: 255 255 255;
  --foreground: 15 23 42;
  --card: 255 255 255;
  --border: 226 232 240;
  --radius: 8px;
}

/* Dark Theme Override */
.dark {
  --primary: 142 69 173;
  --background: 15 23 42;
  --foreground: 248 250 252;
  --card: 30 41 59;
  --border: 51 65 85;
}
```

### Component-Based Styling

1. **Auth Components**: Glass morphism with gradients
2. **Form Elements**: Modern inputs with focus states
3. **Buttons**: Gradient backgrounds with hover animations
4. **Cards**: Subtle shadows with border radius
5. **Typography**: Inter font with proper hierarchy

### Responsive Design
```css
/* Extension Viewport Optimization */
.app-container {
  width: 100%;
  height: 100vh;
  min-height: 600px;
  max-height: 800px;
  overflow: hidden;
}

/* Mobile-First Approach */
@media (max-width: 768px) {
  .main-content {
    padding: 12px;
  }
}
```

## 🔧 Core Functionality

### 1. Authentication Management

```javascript
// Login Process
async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const result = await authService.login(email, password);
        if (result.success) {
            this.isAuthenticated = true;
            this.currentUser = result.user;
            await this.loadUserData();
            this.updateUI();
        }
    } catch (error) {
        this.showToast(`Login failed: ${error.message}`, 'error');
    }
}

// Registration Process
async handleRegister() {
    // Similar pattern with validation
}
```

### 2. ASIN Checking Workflow

```javascript
async checkAsins() {
    const asinInput = document.getElementById('asinInput').value.trim();
    const asins = asinInput.split(/[\s,]+/).filter(Boolean);
    
    this.isLoading = true;
    this.updateCheckButton(true);
    
    try {
        const result = await apiClient.checkASINs(asins);
        if (result.success) {
            this.displayResults(result.results);
            this.updateUsageDisplay(result.usage);
        }
    } catch (error) {
        this.showToast(`Failed to check ASINs: ${error.message}`, 'error');
    } finally {
        this.isLoading = false;
        this.updateCheckButton(false);
    }
}
```

### 3. Dynamic Results Display

```javascript
createResultCard(result, index) {
    const card = document.createElement('div');
    card.className = `result-card ${this.getStatusClass(result)}`;
    
    const statusInfo = this.getStatusInfo(result);
    const productTitle = result.details?.title || 'N/A';
    const productImage = result.imageUrl || 'default-placeholder.svg';
    
    card.innerHTML = `
        <img src="${productImage}" alt="${productTitle}" class="result-image" />
        <div class="result-info">
            <div class="result-asin">${result.asin}</div>
            <div class="result-title">${productTitle}</div>
            <div class="status-badge ${statusInfo.class}">${statusInfo.text}</div>
        </div>
    `;
    
    return card;
}
```

## 🌍 Translation System

### Language Management
```javascript
getLanguageTexts() {
    const texts = {
        en: {
            'welcomeTitle': 'Welcome to FastChecker',
            'loginTitle': 'Login',
            'checkAsins': 'Check ASINs',
            // ... 100+ translation keys
        },
        tr: {
            'welcomeTitle': 'FastChecker\'a Hoş Geldiniz',
            'loginTitle': 'Giriş Yap',
            'checkAsins': 'ASIN Kontrol Et',
            // ... Complete Turkish translations
        }
    };
    
    return texts[this.currentLanguage] || texts.en;
}

// Dynamic Text Updates
updateLanguageTexts() {
    const texts = this.getLanguageTexts();
    
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (texts[key]) {
            element.textContent = texts[key];
        }
    });
}
```

### Language Toggle Implementation
```javascript
setLanguage(language) {
    this.currentLanguage = language;
    chrome.storage.local.set({ language: language });
    
    // Update all language toggle buttons
    const languageToggles = [
        'languageToggle',
        'authLanguageToggle', 
        'authLanguageToggle2'
    ];
    
    languageToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.classList.toggle('active', language === 'tr');
        }
    });
    
    this.updateLanguageTexts();
}
```

## 📊 State Management

### Application State
```javascript
// Core Application State
{
    // Navigation
    currentTab: 'check' | 'settings' | 'account' | 'subscription',
    
    // Authentication
    isAuthenticated: boolean,
    currentUser: {
        id: number,
        email: string,
        subscriptionPlan: string,
        monthlyUsageCount: number
    },
    
    // Settings
    savedSettings: {
        refreshToken: string,
        clientId: string,
        clientSecret: string,
        sellerId: string,
        marketplace: string
    },
    
    // Subscription
    subscriptionData: {
        currentPlan: {
            code: string,
            name: string,
            limit: number
        },
        usage: {
            current: number,
            limit: number
        }
    }
}
```

### State Persistence
```javascript
// Chrome Storage Integration
async saveState() {
    await chrome.storage.local.set({
        currentLanguage: this.currentLanguage,
        authToken: this.authToken,
        currentUser: this.currentUser
    });
}

async loadState() {
    const stored = await chrome.storage.local.get([
        'currentLanguage',
        'authToken', 
        'currentUser'
    ]);
    
    this.currentLanguage = stored.currentLanguage || 'en';
    // ... restore other state
}
```

## 🎭 UI/UX Features

### Toast Notification System
```javascript
showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${this.getToastColor(type)};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}
```

### Loading States
```javascript
updateCheckButton(loading) {
    const checkBtn = document.getElementById('checkAsins');
    const btnIcon = checkBtn.querySelector('.btn-icon');
    const btnText = checkBtn.querySelector('.btn-text');
    const btnLoader = checkBtn.querySelector('.btn-loader');

    if (loading) {
        btnIcon.style.display = 'none';
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        checkBtn.disabled = true;
    } else {
        btnIcon.style.display = 'inline';
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        checkBtn.disabled = false;
    }
}
```

### Modal System
```javascript
showConfirmModal(title, message, confirmCallback, isDestructive = false) {
    const modal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmButton = document.getElementById('modalConfirm');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmButton.className = isDestructive ? 'btn btn-destructive' : 'btn btn-primary';
    
    this.modalCallback = confirmCallback;
    modal.classList.add('show');
}
```

## 🔌 Service Integration

### Authentication Service
```javascript
// services/authService.js
class AuthService {
    constructor() {
        this.baseURL = 'https://professionalfastchecker-production.up.railway.app';
        this.token = null;
        this.user = null;
    }
    
    async login(email, password) {
        const response = await fetch(`${this.baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            this.token = data.token;
            this.user = data.user;
            await chrome.storage.local.set({
                authToken: this.token,
                currentUser: this.user
            });
            return { success: true, user: this.user };
        } else {
            throw new Error(data.error);
        }
    }
}
```

### API Client Service
```javascript
// services/apiClient.js
class APIClient {
    constructor() {
        this.baseURL = 'https://professionalfastchecker-production.up.railway.app';
    }
    
    async checkASINs(asins) {
        const response = await authService.makeAuthenticatedRequest(
            `${this.baseURL}/api/check/asins`,
            {
                method: 'POST',
                body: JSON.stringify({ asins })
            }
        );
        
        return await response.json();
    }
}
```

## 🎯 Performance Optimization

### Efficient DOM Updates
- Minimal DOM queries with element caching
- Event delegation for dynamic content
- Debounced input handling for search
- Lazy loading of heavy components

### Memory Management
```javascript
// Proper event listener cleanup
bindEvents() {
    this.boundHandlers = {
        login: this.handleLogin.bind(this),
        register: this.handleRegister.bind(this),
        checkAsins: this.checkAsins.bind(this)
    };
    
    document.getElementById('loginForm')
        .addEventListener('submit', this.boundHandlers.login);
}

cleanup() {
    // Remove event listeners when needed
    Object.values(this.boundHandlers).forEach(handler => {
        // Remove specific listeners
    });
}
```

## 🔍 Error Handling

### Comprehensive Error Management
```javascript
// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    this.showToast('An unexpected error occurred', 'error');
});

// API error handling
async makeApiCall() {
    try {
        const result = await apiClient.someMethod();
        return result;
    } catch (error) {
        if (error.status === 401) {
            await this.handleAuthenticationError();
        } else if (error.status >= 500) {
            this.showToast('Server error. Please try again later.', 'error');
        } else {
            this.showToast(error.message || 'Request failed', 'error');
        }
        throw error;
    }
}
```

---

**Frontend Version**: 2.0  
**Last Updated**: 2025-01-15  
**Technologies**: Vanilla JS, CSS3, Chrome Extensions API  
**UI Framework**: Custom Component System