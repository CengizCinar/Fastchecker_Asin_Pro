# FastChecker Translation System Documentation

## 🌍 Translation Overview

FastChecker implements a comprehensive bi-lingual translation system supporting English (EN) and Turkish (TR). The system provides real-time language switching with complete UI localization and persistent language preferences.

## 🏗️ Translation Architecture

### System Components
```
Translation System
├── Language Detection & Storage
├── Text Key Management  
├── Dynamic UI Updates
├── Placeholder Translations
├── Component-Specific Translations
└── Language Toggle Controls
```

### Translation Flow
1. **User selects language** → Language toggle clicked
2. **Language stored** → Chrome storage persistence
3. **Text lookup** → getLanguageTexts() retrieval
4. **DOM update** → All [data-translate] elements updated
5. **Component refresh** → Dynamic content re-rendered

## 📝 Translation Implementation

### 1. Core Translation Service
```javascript
class FastChecker {
    constructor() {
        this.currentLanguage = 'en'; // Default language
    }
    
    // Main translation method
    getLanguageTexts() {
        const texts = {
            en: {
                // English translations (100+ keys)
            },
            tr: {
                // Turkish translations (100+ keys)
            }
        };
        
        return texts[this.currentLanguage] || texts.en;
    }
    
    // Helper method for single text lookup
    getText(key) {
        const texts = this.getLanguageTexts();
        return texts[key] || key;
    }
}
```

### 2. Language Storage & Persistence
```javascript
// Set language and persist
setLanguage(language) {
    this.currentLanguage = language;
    
    // Store in Chrome extension storage
    chrome.storage.local.set({ language: language });
    
    // Update all UI elements
    this.updateLanguageTexts();
    
    // Update toggle button states
    this.updateLanguageToggles(language);
}

// Load language on app initialization
async loadLanguage() {
    const stored = await chrome.storage.local.get('language');
    if (stored.language) {
        this.currentLanguage = stored.language;
    }
}
```

### 3. Dynamic UI Updates
```javascript
updateLanguageTexts() {
    const texts = this.getLanguageTexts();
    
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (texts[key]) {
            // Handle different element types
            if (element.tagName === 'INPUT' && element.type !== 'submit') {
                element.placeholder = texts[key];
            } else {
                element.textContent = texts[key];
            }
        }
    });
    
    // Update placeholder-specific translations
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (texts[key]) {
            element.placeholder = texts[key];
        }
    });
    
    // Special component updates
    this.updateSpecialTranslations();
}

updateSpecialTranslations() {
    // Update usage count with plan badge
    this.updateUsageCountText();
    
    // Update auth links  
    this.updateAuthLinks();
    
    // Update result status texts
    this.updateResultStatusTexts();
    
    // Update subscription plan descriptions
    this.updatePlanDescriptions();
}
```

## 🎛️ Language Toggle Controls

### 1. Header Language Toggle
```html
<button class="language-toggle" id="languageToggle">
    <span class="lang-en">EN</span>
    <span class="lang-tr">TR</span>
</button>
```

```css
.language-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: hsl(var(--secondary));
    cursor: pointer;
    transition: all 0.2s ease;
}

.language-toggle .lang-tr {
    opacity: 0.5;
}

.language-toggle.active .lang-en {
    opacity: 0.5;
}

.language-toggle.active .lang-tr {
    opacity: 1;
}
```

### 2. Authentication Page Language Toggle
```html
<div class="auth-language-toggle">
    <button class="auth-lang-btn" id="authLanguageToggle">
        <span class="lang-en">🇺🇸 EN</span>
        <span class="lang-tr">🇹🇷 TR</span>
    </button>
</div>
```

```css
.auth-lang-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 25px;
    padding: 10px 18px;
    color: white;
    font-weight: 700;
    text-transform: uppercase;
}

.auth-lang-btn .lang-en {
    background: rgba(255, 255, 255, 0.25);
    color: #047857;
    padding: 2px 6px;
    border-radius: 12px;
}

.auth-lang-btn .lang-tr {
    opacity: 0.6;
    color: rgba(255, 255, 255, 0.7);
}

.auth-lang-btn.active .lang-en {
    opacity: 0.6;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
}

.auth-lang-btn.active .lang-tr {
    background: rgba(255, 255, 255, 0.25);
    color: #047857;
}
```

### 3. Settings Dropdown Language Selector
```html
<div class="custom-select" id="languageSelect">
    <button class="select-trigger">
        <span class="select-value">English</span>
        <span class="select-icon">▼</span>
    </button>
    <div class="select-dropdown">
        <div class="option" data-value="en" data-translate="english">English</div>
        <div class="option" data-value="tr" data-translate="turkish">Türkçe</div>
    </div>
</div>
```

## 📚 Complete Translation Keys

### 1. Navigation & UI Elements
```javascript
const translations = {
    en: {
        // Navigation tabs
        'checkTab': 'Check',
        'settingsTab': 'Settings', 
        'accountTab': 'Account',
        'subscriptionTab': 'Subscription',
        
        // Header elements
        'upgrade': 'Upgrade',
        'checksUsed': 'checks used',
        'loadingUsage': 'Loading usage...',
        
        // Language options
        'english': 'English',
        'turkish': 'Türkçe',
    },
    tr: {
        // Navigation tabs
        'checkTab': 'Kontrol',
        'settingsTab': 'Ayarlar',
        'accountTab': 'Hesap', 
        'subscriptionTab': 'Abonelik',
        
        // Header elements
        'upgrade': 'Yükselt',
        'checksUsed': 'kontrol kullanıldı',
        'loadingUsage': 'Kullanım yükleniyor...',
        
        // Language options
        'english': 'English',
        'turkish': 'Türkçe',
    }
};
```

### 2. Authentication System
```javascript
const authTranslations = {
    en: {
        // Login page
        'welcomeTitle': 'Welcome to FastChecker',
        'welcomeSubtitle': 'Sign in to check your ASIN eligibility',
        'loginTitle': 'Login',
        'loginDesc': 'Enter your email below to login to your account',
        'email': 'Email',
        'password': 'Password',
        'signIn': 'Sign In',
        'signUp': 'Sign up',
        'dontHaveAccount': 'Don\'t have an account?',
        
        // Register page  
        'createAccount': 'Create Account',
        'createAccountSubtitle': 'Sign up to start checking ASINs',
        'registerTitle': 'Register', 
        'registerDesc': 'Create your account to get started',
        'confirmPassword': 'Confirm Password',
        'createAccountBtn': 'Create Account',
        'alreadyHaveAccount': 'Already have an account?',
        'signInLink': 'Sign in',
        
        // Welcome message
        'newUserWelcome': '👋 Welcome! Please configure your SP-API credentials to start checking ASINs.',
        
        // Placeholders
        'emailPlaceholder': 'm@example.com',
        'passwordPlaceholder': '••••••••',
    },
    tr: {
        // Login page
        'welcomeTitle': 'FastChecker\'a Hoş Geldiniz',
        'welcomeSubtitle': 'ASIN uygunluğunu kontrol etmek için giriş yapın',
        'loginTitle': 'Giriş Yap',
        'loginDesc': 'Hesabınıza giriş yapmak için e-posta adresinizi girin',
        'email': 'E-posta',
        'password': 'Şifre',
        'signIn': 'Giriş Yap',
        'signUp': 'Kayıt ol',
        'dontHaveAccount': 'Hesabınız yok mu?',
        
        // Register page
        'createAccount': 'Hesap Oluştur',
        'createAccountSubtitle': 'ASIN kontrolüne başlamak için kayıt olun',
        'registerTitle': 'Kayıt Ol',
        'registerDesc': 'Başlamak için hesabınızı oluşturun',
        'confirmPassword': 'Şifreyi Onayla',
        'createAccountBtn': 'Hesap Oluştur',
        'alreadyHaveAccount': 'Zaten hesabınız var mı?',
        'signInLink': 'Giriş yap',
        
        // Welcome message
        'newUserWelcome': '👋 Hoş geldiniz! ASIN kontrolüne başlamak için SP-API bilgilerinizi yapılandırın.',
        
        // Placeholders
        'emailPlaceholder': 'ornek@email.com',
        'passwordPlaceholder': '••••••••',
    }
};
```

### 3. ASIN Checking Interface
```javascript
const asinTranslations = {
    en: {
        // Input section
        'asinInput': 'ASIN Input',
        'enterAsins': 'Enter ASINs to check (one per line or comma-separated)',
        'checkAsins': 'Check ASINs',
        'clearInput': 'Clear',
        'exportResults': 'Export',
        
        // Results section
        'results': 'Results',
        'noResults': 'No results yet',
        'checking': 'Checking ASINs...',
        
        // Status messages
        'eligible': 'Eligible',
        'restricted': 'Restricted', 
        'ineligible': 'Ineligible',
        'apiError': 'API Error',
        'unknown': 'Unknown',
        
        // Result details
        'brand': 'Brand',
        'category': 'Category',
        'rank': 'Rank',
        'checkedJustNow': 'Just now',
        'checkedMinutesAgo': 'minutes ago',
        'checkedHoursAgo': 'hours ago',
    },
    tr: {
        // Input section
        'asinInput': 'ASIN Giriş',
        'enterAsins': 'Kontrol edilecek ASIN\'leri girin (her satırda bir veya virgülle ayrılmış)',
        'checkAsins': 'ASIN Kontrol Et',
        'clearInput': 'Temizle',
        'exportResults': 'Dışa Aktar',
        
        // Results section
        'results': 'Sonuçlar',
        'noResults': 'Henüz sonuç yok',
        'checking': 'ASIN\'ler kontrol ediliyor...',
        
        // Status messages
        'eligible': 'Uygun',
        'restricted': 'Kısıtlı',
        'ineligible': 'Uygun Değil',
        'apiError': 'API Hatası',
        'unknown': 'Bilinmiyor',
        
        // Result details
        'brand': 'Marka',
        'category': 'Kategori', 
        'rank': 'Sıralama',
        'checkedJustNow': 'Az önce',
        'checkedMinutesAgo': 'dakika önce',
        'checkedHoursAgo': 'saat önce',
    }
};
```

### 4. Settings Configuration
```javascript
const settingsTranslations = {
    en: {
        // SP-API Section
        'spApiConfig': 'SP-API Configuration',
        'spApiDesc': 'Configure your Amazon Selling Partner API credentials',
        'refreshToken': 'Refresh Token',
        'refreshTokenHint': 'Your SP-API refresh token from Amazon Developer Console',
        'clientId': 'Client ID',
        'clientIdHint': 'Your SP-API client identifier',
        'clientSecret': 'Client Secret', 
        'clientSecretHint': 'Your SP-API client secret key',
        'sellerId': 'Seller ID',
        'sellerIdHint': 'Your Amazon merchant/seller identifier',
        'marketplace': 'Marketplace',
        'marketplaceHint': 'Select your primary Amazon marketplace',
        
        // Marketplaces
        'amazonUS': 'Amazon US',
        'amazonCA': 'Amazon Canada',
        'amazonUK': 'Amazon UK',
        'amazonDE': 'Amazon Germany',
        'amazonFR': 'Amazon France',
        'amazonIT': 'Amazon Italy',
        'amazonES': 'Amazon Spain',
        'amazonJP': 'Amazon Japan',
        'amazonAU': 'Amazon Australia',
        
        // Preferences
        'preferences': 'Preferences',
        'language': 'Language',
        'theme': 'Theme',
        'lightMode': 'Light Mode',
        'darkMode': 'Dark Mode',
        'systemMode': 'System',
        
        // Actions
        'saveSettings': 'Save Settings',
        'testConnection': 'Test Connection',
        'resetSettings': 'Reset to Defaults',
    },
    tr: {
        // SP-API Section
        'spApiConfig': 'SP-API Yapılandırması',
        'spApiDesc': 'Amazon Satıcı Ortağı API kimlik bilgilerinizi yapılandırın',
        'refreshToken': 'Yenileme Anahtarı',
        'refreshTokenHint': 'Amazon Geliştirici Konsolundan SP-API yenileme anahtarınız',
        'clientId': 'İstemci ID',
        'clientIdHint': 'SP-API istemci tanımlayıcınız',
        'clientSecret': 'İstemci Gizli Anahtarı',
        'clientSecretHint': 'SP-API istemci gizli anahtarınız',
        'sellerId': 'Satıcı ID',
        'sellerIdHint': 'Amazon satıcı/tüccar tanımlayıcınız',
        'marketplace': 'Pazaryeri',
        'marketplaceHint': 'Birincil Amazon pazaryerinizi seçin',
        
        // Marketplaces  
        'amazonUS': 'Amazon ABD',
        'amazonCA': 'Amazon Kanada',
        'amazonUK': 'Amazon İngiltere',
        'amazonDE': 'Amazon Almanya',
        'amazonFR': 'Amazon Fransa',
        'amazonIT': 'Amazon İtalya',
        'amazonES': 'Amazon İspanya',
        'amazonJP': 'Amazon Japonya',
        'amazonAU': 'Amazon Avustralya',
        
        // Preferences
        'preferences': 'Tercihler',
        'language': 'Dil',
        'theme': 'Tema',
        'lightMode': 'Açık Mod',
        'darkMode': 'Koyu Mod', 
        'systemMode': 'Sistem',
        
        // Actions
        'saveSettings': 'Ayarları Kaydet',
        'testConnection': 'Bağlantıyı Test Et',
        'resetSettings': 'Varsayılanlara Sıfırla',
    }
};
```

### 5. Subscription & Account
```javascript
const subscriptionTranslations = {
    en: {
        // Account page
        'accountInfo': 'Account Information',
        'emailAddress': 'Email Address',
        'memberSince': 'Member since',
        'accountStatus': 'Account Status',
        'active': 'Active',
        'suspended': 'Suspended',
        
        // Subscription plans
        'currentPlan': 'Current Plan',
        'freePlan': 'Free Plan',
        'basicPlan': 'Basic Plan',
        'premiumPlan': 'Premium Plan',
        'enterprisePlan': 'Enterprise Plan',
        
        // Usage tracking
        'monthlyUsage': 'Monthly Usage',
        'usageResets': 'Usage resets',
        'unlimited': 'Unlimited',
        
        // Plan features
        'asinChecks': 'ASIN checks per month',
        'basicSupport': 'Basic support',
        'prioritySupport': 'Priority support',
        'exportResults': 'Export results',
        'advancedAnalytics': 'Advanced analytics',
        'apiAccess': 'API access',
        'customIntegrations': 'Custom integrations',
        'dedicatedManager': 'Dedicated account manager',
        '247Support': '24/7 support',
        
        // Actions
        'upgradePlan': 'Upgrade Plan',
        'manageBilling': 'Manage Billing',
        'cancelSubscription': 'Cancel Subscription',
        'renewSubscription': 'Renew Subscription',
    },
    tr: {
        // Account page
        'accountInfo': 'Hesap Bilgileri',
        'emailAddress': 'E-posta Adresi',
        'memberSince': 'Üyelik tarihi',
        'accountStatus': 'Hesap Durumu',
        'active': 'Aktif',
        'suspended': 'Askıya Alınmış',
        
        // Subscription plans
        'currentPlan': 'Mevcut Plan',
        'freePlan': 'Ücretsiz Plan',
        'basicPlan': 'Temel Plan',
        'premiumPlan': 'Premium Plan', 
        'enterprisePlan': 'Kurumsal Plan',
        
        // Usage tracking
        'monthlyUsage': 'Aylık Kullanım',
        'usageResets': 'Kullanım sıfırlanır',
        'unlimited': 'Sınırsız',
        
        // Plan features
        'asinChecks': 'Aylık ASIN kontrolü',
        'basicSupport': 'Temel destek',
        'prioritySupport': 'Öncelikli destek',
        'exportResults': 'Sonuçları dışa aktarma',
        'advancedAnalytics': 'Gelişmiş analitik',
        'apiAccess': 'API erişimi',
        'customIntegrations': 'Özel entegrasyonlar',
        'dedicatedManager': 'Özel hesap yöneticisi',
        '247Support': '7/24 destek',
        
        // Actions
        'upgradePlan': 'Planı Yükselt',
        'manageBilling': 'Faturalandırmayı Yönet',
        'cancelSubscription': 'Aboneliği İptal Et',
        'renewSubscription': 'Aboneliği Yenile',
    }
};
```

### 6. Error Messages & Notifications
```javascript
const errorTranslations = {
    en: {
        // Authentication errors
        'loginFailed': 'Login failed',
        'registrationFailed': 'Registration failed',
        'invalidCredentials': 'Invalid email or password',
        'userAlreadyExists': 'An account with this email already exists',
        'passwordTooShort': 'Password must be at least 8 characters',
        'emailRequired': 'Email address is required',
        'passwordRequired': 'Password is required',
        
        // API errors  
        'asinCheckFailed': 'ASIN check failed',
        'apiConnectionError': 'Could not connect to Amazon SP-API',
        'invalidApiCredentials': 'Invalid SP-API credentials',
        'rateLimitExceeded': 'Rate limit exceeded, please wait',
        'usageLimitReached': 'Monthly usage limit reached',
        
        // Settings errors
        'settingsSaveFailed': 'Failed to save settings',
        'connectionTestFailed': 'Connection test failed',
        'invalidRefreshToken': 'Invalid refresh token',
        'missingCredentials': 'SP-API credentials are incomplete',
        
        // Success messages
        'loginSuccessful': 'Login successful',
        'registrationSuccessful': 'Account created successfully',
        'settingsSaved': 'Settings saved successfully',
        'connectionTestPassed': 'Connection test successful',
        'asinCheckCompleted': 'ASIN check completed',
        
        // General messages
        'loading': 'Loading...',
        'processing': 'Processing...',
        'pleaseWait': 'Please wait...',
        'tryAgain': 'Please try again',
        'somethingWentWrong': 'Something went wrong',
    },
    tr: {
        // Authentication errors
        'loginFailed': 'Giriş başarısız',
        'registrationFailed': 'Kayıt başarısız',
        'invalidCredentials': 'Geçersiz e-posta veya şifre',
        'userAlreadyExists': 'Bu e-posta adresiyle bir hesap zaten var',
        'passwordTooShort': 'Şifre en az 8 karakter olmalı',
        'emailRequired': 'E-posta adresi gerekli',
        'passwordRequired': 'Şifre gerekli',
        
        // API errors
        'asinCheckFailed': 'ASIN kontrolü başarısız',
        'apiConnectionError': 'Amazon SP-API\'ye bağlanılamadı',
        'invalidApiCredentials': 'Geçersiz SP-API kimlik bilgileri',
        'rateLimitExceeded': 'Hız limiti aşıldı, lütfen bekleyin',
        'usageLimitReached': 'Aylık kullanım limitine ulaşıldı',
        
        // Settings errors
        'settingsSaveFailed': 'Ayarlar kaydedilemedi',
        'connectionTestFailed': 'Bağlantı testi başarısız',
        'invalidRefreshToken': 'Geçersiz yenileme anahtarı',
        'missingCredentials': 'SP-API kimlik bilgileri eksik',
        
        // Success messages
        'loginSuccessful': 'Giriş başarılı',
        'registrationSuccessful': 'Hesap başarıyla oluşturuldu',
        'settingsSaved': 'Ayarlar başarıyla kaydedildi',
        'connectionTestPassed': 'Bağlantı testi başarılı',
        'asinCheckCompleted': 'ASIN kontrolü tamamlandı',
        
        // General messages
        'loading': 'Yükleniyor...',
        'processing': 'İşleniyor...',
        'pleaseWait': 'Lütfen bekleyin...',
        'tryAgain': 'Lütfen tekrar deneyin',
        'somethingWentWrong': 'Bir şeyler ters gitti',
    }
};
```

## 🔧 Advanced Translation Features

### 1. Context-Aware Translations
```javascript
// Different translations based on context
getContextualText(key, context) {
    const texts = this.getLanguageTexts();
    const contextKey = `${key}_${context}`;
    
    // Try context-specific translation first
    if (texts[contextKey]) {
        return texts[contextKey];
    }
    
    // Fallback to general translation
    return texts[key] || key;
}

// Example usage
const buttonText = this.getContextualText('save', 'settings'); // "Save Settings"
const linkText = this.getContextualText('save', 'form'); // "Save Changes"
```

### 2. Pluralization Support
```javascript
// Pluralization helper for count-based translations
getPluralText(key, count) {
    const texts = this.getLanguageTexts();
    
    if (this.currentLanguage === 'tr') {
        // Turkish doesn't have complex pluralization
        return texts[key] || key;
    } else {
        // English pluralization
        if (count === 1) {
            return texts[`${key}_singular`] || texts[key];
        } else {
            return texts[`${key}_plural`] || texts[key];
        }
    }
}

// Example usage  
const checkText = this.getPluralText('asinChecks', userCount);
// "1 ASIN check" vs "5 ASIN checks"
```

### 3. Date/Time Localization
```javascript
// Date formatting based on language
formatDate(date, format = 'short') {
    const options = {
        short: { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        },
        long: { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }
    };
    
    const locale = this.currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, options[format]);
}

// Example usage
const joinDate = this.formatDate(user.createdAt, 'long');
// EN: "Monday, January 15, 2025"
// TR: "15 Ocak 2025 Pazartesi"
```

### 4. Number Formatting
```javascript
// Number formatting with localization
formatNumber(number, type = 'decimal') {
    const locale = this.currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
    
    switch (type) {
        case 'currency':
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'USD'
            }).format(number);
            
        case 'percent':
            return new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: 1
            }).format(number);
            
        default:
            return new Intl.NumberFormat(locale).format(number);
    }
}

// Example usage
const price = this.formatNumber(29.99, 'currency'); // "$29.99" / "29,99 $"
const usage = this.formatNumber(1250); // "1,250" / "1.250"
```

## 🚀 Performance Optimization

### 1. Translation Caching
```javascript
class TranslationCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    get(language) {
        const cached = this.cache.get(language);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.translations;
        }
        return null;
    }
    
    set(language, translations) {
        this.cache.set(language, {
            translations,
            timestamp: Date.now()
        });
    }
}
```

### 2. Lazy Loading Translations
```javascript
// Load translations only when needed
async loadTranslations(language) {
    if (this.translationCache.get(language)) {
        return this.translationCache.get(language);
    }
    
    // In production, could load from separate JSON files
    const translations = await this.getLanguageTexts(language);
    this.translationCache.set(language, translations);
    
    return translations;
}
```

### 3. Batch DOM Updates
```javascript
// Efficient DOM updates using DocumentFragment
updateLanguageTexts() {
    const texts = this.getLanguageTexts();
    const elements = document.querySelectorAll('[data-translate]');
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (texts[key]) {
                element.textContent = texts[key];
            }
        });
    });
}
```

## 🔍 Translation Testing & Quality

### 1. Translation Completeness Check
```javascript
// Development helper to find missing translations
checkTranslationCompleteness() {
    const enKeys = new Set(Object.keys(this.getLanguageTexts().en));
    const trKeys = new Set(Object.keys(this.getLanguageTexts().tr));
    
    const missingInTurkish = [...enKeys].filter(key => !trKeys.has(key));
    const missingInEnglish = [...trKeys].filter(key => !enKeys.has(key));
    
    if (missingInTurkish.length > 0) {
        console.warn('Missing Turkish translations:', missingInTurkish);
    }
    
    if (missingInEnglish.length > 0) {
        console.warn('Missing English translations:', missingInEnglish);
    }
    
    return {
        complete: missingInTurkish.length === 0 && missingInEnglish.length === 0,
        missingTR: missingInTurkish,
        missingEN: missingInEnglish
    };
}
```

### 2. Translation Key Usage Tracking
```javascript
// Track which translation keys are actually used
trackTranslationUsage() {
    const usedKeys = new Set();
    
    // Track data-translate attributes
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        usedKeys.add(key);
    });
    
    // Track programmatic usage
    const allTexts = this.getLanguageTexts();
    const unusedKeys = Object.keys(allTexts.en).filter(key => !usedKeys.has(key));
    
    console.log('Translation usage stats:', {
        total: Object.keys(allTexts.en).length,
        used: usedKeys.size,
        unused: unusedKeys.length,
        unusedKeys
    });
}
```

---

**Translation System Version**: 2.0  
**Last Updated**: 2025-01-15  
**Supported Languages**: English (EN), Turkish (TR)  
**Total Translation Keys**: 150+  
**Coverage**: 100% UI localization with context-aware translations