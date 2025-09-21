# FastChecker UI Components Documentation

## 🎨 UI Overview

FastChecker features a modern, professional interface built with vanilla CSS3 and custom components. The design system emphasizes glassmorphism, gradients, and smooth animations optimized for Chrome extension side panel.

## 🎯 Design System

### Color Palette
```css
/* CSS Custom Properties */
:root {
  /* Primary Colors */
  --primary: 142 69 173;           /* Purple/Pink gradient base */
  --primary-foreground: 255 255 255;
  
  /* Background Colors */
  --background: 255 255 255;       /* Main background */
  --foreground: 15 23 42;          /* Text color */
  --card: 255 255 255;             /* Card backgrounds */
  --card-foreground: 15 23 42;
  
  /* Border & Interactive */
  --border: 226 232 240;           /* Light borders */
  --ring: 142 69 173;              /* Focus rings */
  --radius: 8px;                   /* Border radius */
  
  /* Semantic Colors */
  --destructive: 220 38 38;        /* Error/danger */
  --muted: 241 245 249;            /* Muted backgrounds */
  --muted-foreground: 100 116 139; /* Muted text */
  --accent: 241 245 249;           /* Accent backgrounds */
  --secondary: 241 245 249;        /* Secondary elements */
}

/* Dark Theme Override */
.dark {
  --background: 15 23 42;          /* Dark background */
  --foreground: 248 250 252;       /* Light text */
  --card: 30 41 59;                /* Dark card */
  --border: 51 65 85;              /* Dark borders */
  --muted: 51 65 85;               /* Dark muted */
  --muted-foreground: 148 163 184; /* Dark muted text */
}
```

### Typography
```css
/* Font System */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

/* Typography Scale */
.text-xs { font-size: 12px; line-height: 16px; }
.text-sm { font-size: 14px; line-height: 20px; }
.text-base { font-size: 16px; line-height: 24px; }
.text-lg { font-size: 18px; line-height: 28px; }
.text-xl { font-size: 20px; line-height: 28px; }
.text-2xl { font-size: 24px; line-height: 32px; }
.text-3xl { font-size: 30px; line-height: 36px; }
```

## 🏗️ Layout Components

### 1. Main Application Container
```html
<div class="app-container">
  <header class="app-header">...</header>
  <main class="main-content">...</main>
</div>
```

```css
.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow: hidden;
}

.main-content {
  flex: 1;
  background: hsl(var(--background));
  padding: 0;
  overflow-y: auto;
  margin-top: 132px; /* Header height */
  height: calc(100vh - 132px);
}

/* Auth mode override for full-screen login */
.main-content.auth-mode {
  margin-top: 0;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}
```

### 2. Header System
```html
<header class="app-header">
  <!-- Logo & Title -->
  <div class="header-top">
    <div class="logo-section">
      <div class="logo-icon">⚡</div>
      <h1 class="app-title">FastChecker</h1>
    </div>
    <div class="header-actions">
      <!-- Language & Theme Controls -->
    </div>
  </div>
  
  <!-- Usage Display -->
  <div class="status-bar">
    <div class="usage-info">
      <span class="usage-count">0/100 checks used</span>
    </div>
    <button class="upgrade-btn">💎 Upgrade</button>
  </div>
  
  <!-- Navigation Tabs -->
  <nav class="nav-tabs">...</nav>
</header>
```

```css
.app-header {
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 132px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  height: 52px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 20px;
  color: hsl(var(--primary));
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
```

## 🔐 Authentication Components

### 1. Authentication Layout
```html
<div class="auth-section">
  <!-- Language Toggle (Top Right) -->
  <div class="auth-language-toggle">
    <button class="auth-lang-btn">
      <span class="lang-en">🇺🇸 EN</span>
      <span class="lang-tr">🇹🇷 TR</span>
    </button>
  </div>
  
  <!-- Main Auth Container -->
  <div class="auth-container">
    <div class="auth-header">
      <div class="auth-icon">⚡</div>
      <h2 class="auth-title">Welcome to FastChecker</h2>
      <p class="auth-subtitle">Sign in to check your ASIN eligibility</p>
    </div>
    
    <div class="auth-card">
      <!-- Form Content -->
    </div>
    
    <div class="auth-footer">
      <p>Don't have an account? 
         <a href="#" class="auth-link">Sign up</a>
      </p>
    </div>
  </div>
</div>
```

```css
/* Full-Screen Auth Background */
.auth-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground)) 100%);
}

/* Language Toggle Button */
.auth-language-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
}

.auth-lang-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 25px;
  padding: 10px 18px;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  outline: none;
}

.auth-lang-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* Language Indicator Pills */
.auth-lang-btn .lang-en,
.auth-lang-btn .lang-tr {
  padding: 2px 6px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.auth-lang-btn .lang-en {
  background: rgba(255, 255, 255, 0.25);
  color: #047857;
  font-weight: 800;
}

.auth-lang-btn .lang-tr {
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.auth-lang-btn.active .lang-en {
  opacity: 0.6;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.auth-lang-btn.active .lang-tr {
  background: rgba(255, 255, 255, 0.25);
  color: #047857;
  font-weight: 800;
}
```

### 2. Authentication Card
```css
.auth-container {
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-header {
  text-align: center;
  margin-bottom: 16px;
  color: white;
}

.auth-icon {
  font-size: 36px;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.auth-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.auth-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 400;
}

.auth-card {
  background: white;
  border: none;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 350px;
}
```

### 3. Form Components
```html
<form class="auth-form">
  <div class="form-group">
    <label for="email" class="form-label">Email</label>
    <input type="email" id="email" class="form-input" 
           placeholder="m@example.com" required>
  </div>
  
  <div class="form-group">
    <label for="password" class="form-label">Password</label>
    <input type="password" id="password" class="form-input" 
           placeholder="••••••••" required>
  </div>
  
  <button type="submit" class="auth-btn primary">Sign In</button>
</form>
```

```css
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.form-input {
  height: 44px;
  padding: 0 14px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  background: #f8f9fa;
  color: #1a1a1a;
  font-size: 15px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  background: white;
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 15px;
}
```

### 4. Authentication Buttons
```css
.auth-btn {
  height: 46px;
  padding: 0 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.auth-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.auth-btn.primary:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Sign Up Link */
.auth-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
  display: inline-block;
  margin-left: 4px;
  backdrop-filter: blur(10px);
  font-size: 13px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
}

.auth-link:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
```

## 🧭 Navigation Components

### 1. Tab Navigation System
```html
<nav class="nav-tabs">
  <button class="nav-tab active" data-tab="check">
    <span class="nav-icon">✓</span>
    <span class="nav-label">Check</span>
  </button>
  <button class="nav-tab" data-tab="settings">
    <span class="nav-icon">⚙️</span>
    <span class="nav-label">Settings</span>
  </button>
  <div class="nav-indicator"></div>
</nav>
```

```css
.nav-tabs {
  display: flex;
  padding: 0 16px;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  position: relative;
  height: 48px;
}

.nav-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tab:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

.nav-tab.active {
  color: hsl(var(--primary));
  font-weight: 600;
}

.nav-icon {
  font-size: 16px;
}

.nav-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: hsl(var(--primary));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px 2px 0 0;
}
```

### 2. Header Controls
```html
<div class="header-actions">
  <button class="language-toggle" id="languageToggle">
    <span class="lang-en">EN</span>
    <span class="lang-tr">TR</span>
  </button>
  <button class="theme-toggle" id="themeToggle">
    <span class="sun-icon">☀️</span>
    <span class="moon-icon">🌙</span>
  </button>
  <button class="external-link" id="externalLink">↗</button>
</div>
```

```css
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-toggle,
.theme-toggle,
.external-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 600;
}

.language-toggle:hover,
.theme-toggle:hover,
.external-link:hover {
  background: hsl(var(--accent));
  transform: translateY(-1px);
}

.language-toggle.active .lang-tr,
.language-toggle:not(.active) .lang-en {
  opacity: 1;
}

.language-toggle:not(.active) .lang-tr,
.language-toggle.active .lang-en {
  opacity: 0.5;
}
```

## 📊 Content Components

### 1. ASIN Check Interface
```html
<div class="tab-content" id="checkTab">
  <!-- Input Section -->
  <div class="input-section">
    <div class="input-header">
      <h3>ASIN Input</h3>
      <div class="input-stats">
        <span class="char-count">0/2000</span>
      </div>
    </div>
    
    <textarea id="asinInput" class="asin-textarea" 
              placeholder="Enter ASINs to check (one per line or comma-separated)"></textarea>
    
    <div class="input-actions">
      <button id="checkAsins" class="btn btn-primary">
        <span class="btn-icon">🔍</span>
        <span class="btn-text">Check ASINs</span>
        <span class="btn-loader" style="display: none;">⏳</span>
      </button>
      <button id="clearAsins" class="btn btn-secondary">Clear</button>
    </div>
  </div>
  
  <!-- Results Section -->
  <div id="resultsSection" class="results-section">
    <div class="results-header">
      <h3>Results (<span id="resultsCount">0</span>)</h3>
      <div class="results-actions">
        <button class="export-btn" id="exportResults">📥 Export</button>
      </div>
    </div>
    <div id="results" class="results-container"></div>
  </div>
</div>
```

```css
.input-section {
  padding: 20px;
  border-bottom: 1px solid hsl(var(--border));
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.char-count {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.asin-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.asin-textarea:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.input-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
```

### 2. Result Cards
```html
<div class="result-card eligible">
  <div class="result-image-container">
    <img src="product-image.jpg" alt="Product" class="result-image">
  </div>
  
  <div class="result-info">
    <div class="result-asin">B08N5WRWNW</div>
    <div class="result-title">Product Title Here</div>
    <div class="result-details">
      <span class="result-brand">Brand Name</span>
      <span class="result-category">Electronics</span>
    </div>
  </div>
  
  <div class="result-status">
    <div class="status-badge eligible">
      <span class="status-icon">✅</span>
      <span class="status-text">Eligible</span>
    </div>
    <div class="result-timestamp">Just now</div>
  </div>
</div>
```

```css
.results-container {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition: all 0.2s ease;
}

.result-card:hover {
  border-color: hsl(var(--ring));
  box-shadow: 0 2px 8px hsl(var(--ring) / 0.1);
}

.result-card.eligible {
  border-left: 4px solid #10b981;
}

.result-card.restricted {
  border-left: 4px solid #f59e0b;
}

.result-card.ineligible {
  border-left: 4px solid #ef4444;
}

.result-image-container {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: hsl(var(--muted));
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-asin {
  font-size: 14px;
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
  color: hsl(var(--primary));
  margin-bottom: 4px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.result-status {
  flex-shrink: 0;
  text-align: right;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.eligible {
  background: #10b98120;
  color: #047857;
}

.status-badge.restricted {
  background: #f59e0b20;
  color: #d97706;
}

.status-badge.ineligible {
  background: #ef444420;
  color: #dc2626;
}
```

## 🎛️ Settings Components

### 1. Settings Form Layout
```html
<div class="settings-page">
  <div class="settings-section">
    <h3 class="section-title">SP-API Configuration</h3>
    <p class="section-description">Configure your Amazon SP-API credentials</p>
    
    <div class="settings-form">
      <div class="form-group">
        <label class="form-label">Refresh Token</label>
        <input type="password" class="form-input" id="refreshToken">
        <p class="form-hint">Your SP-API refresh token</p>
      </div>
      <!-- More fields... -->
    </div>
  </div>
</div>
```

```css
.settings-page {
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid hsl(var(--border));
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 4px;
}

.section-description {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 16px;
}

.form-hint {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-top: 4px;
}
```

### 2. Custom Dropdown Component
```html
<div class="custom-select" data-value="ATVPDKIKX0DER">
  <button class="select-trigger">
    <span class="select-value">Amazon US</span>
    <span class="select-icon">▼</span>
  </button>
  
  <div class="select-dropdown">
    <div class="option selected" data-value="ATVPDKIKX0DER">Amazon US</div>
    <div class="option" data-value="A1F83G8C2ARO7P">Amazon UK</div>
    <!-- More options... -->
  </div>
</div>
```

```css
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-trigger:hover {
  border-color: hsl(var(--ring));
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: 0 4px 12px hsl(var(--ring) / 0.15);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

.custom-select.open .select-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.option {
  padding: 8px 12px;
  font-size: 14px;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.option:hover {
  background: hsl(var(--accent));
}

.option.selected {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-weight: 500;
}
```

## 🎭 Interactive Components

### 1. Toast Notification System
```javascript
// Toast implementation in JavaScript
showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        'info': '#2196f3',
        'success': '#00c853', 
        'error': '#d50000',
        'warning': '#ff9800'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
```

### 2. Modal Components
```html
<div id="confirmModal" class="modal">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="modalTitle">Confirm Action</h3>
      <button class="modal-close">×</button>
    </div>
    
    <div class="modal-body">
      <p id="modalMessage">Are you sure?</p>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-secondary" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="modalConfirm">Confirm</button>
    </div>
  </div>
</div>
```

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.modal.show {
  opacity: 1;
  visibility: visible;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: hsl(var(--card));
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  transform: scale(0.95);
  transition: transform 0.2s ease;
}

.modal.show .modal-content {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid hsl(var(--border));
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid hsl(var(--border));
}
```

## 📱 Responsive Design & Animations

### 1. Responsive Breakpoints
```css
/* Chrome Extension specific responsive design */
@media (max-width: 400px) {
  .main-content {
    padding: 8px;
  }
  
  .header-top {
    padding: 8px 12px;
  }
  
  .auth-container {
    max-width: 320px;
    padding: 0 12px;
  }
}

@media (max-height: 600px) {
  .auth-section {
    min-height: 100vh;
    padding: 12px;
  }
  
  .auth-card {
    padding: 16px;
  }
}
```

### 2. Animation Keyframes
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 1.5s ease-in-out infinite;
}
```

## 🎯 Accessibility Features

### 1. Focus Management
```css
/* Focus states for keyboard navigation */
.nav-tab:focus,
.btn:focus,
.form-input:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.auth-lang-btn:focus {
  outline: none;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3), 
              0 0 0 2px rgba(16, 185, 129, 0.5);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0 0;
    --ring: 0 0 0;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. ARIA Labels and Screen Reader Support
```html
<!-- Accessible navigation -->
<nav class="nav-tabs" role="tablist" aria-label="Main navigation">
  <button class="nav-tab active" role="tab" 
          aria-selected="true" aria-controls="checkTab">
    <span class="nav-icon" aria-hidden="true">✓</span>
    <span class="nav-label">Check</span>
  </button>
</nav>

<!-- Accessible forms -->
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input type="email" id="email" class="form-input" 
         aria-describedby="email-hint" required>
  <p id="email-hint" class="form-hint">Enter your email address</p>
</div>

<!-- Accessible status messages -->
<div role="status" aria-live="polite" id="statusMessage"></div>
```

---

**UI Components Version**: 2.0  
**Last Updated**: 2025-01-15  
**Design System**: Custom CSS3 with glassmorphism  
**Framework**: Vanilla JavaScript + CSS Custom Properties  
**Accessibility**: WCAG 2.1 AA compliant