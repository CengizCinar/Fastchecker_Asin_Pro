import { Language } from '../contexts/LanguageContext';

// Language utility functions
export const getLanguageTexts = (currentLanguage: Language) => {
  const texts = {
    en: {
      // Navigation tabs
      'login': 'Login',
      'register': 'Register',
      'verification': 'Verification',
      'check': 'Check',
      'settings': 'Settings',
      'account': 'Account',
      'subscription': 'Subscription',
      
      // Auth forms
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'loginButton': 'Login',
      'registerButton': 'Register',
      'verificationCode': 'Verification Code',
      'verifyButton': 'Verify',
      'resendCode': 'Resend Code',
      
      // Check page
      'asinInput': 'ASIN Input',
      'checkButton': 'Check ASINs',
      'results': 'Results',
      'exportCSV': 'Export CSV',
      
      // Settings
      'spApiSettings': 'SP-API Settings',
      'sellerId': 'Seller ID',
      'accessKey': 'Access Key',
      'secretKey': 'Secret Key',
      'region': 'Region',
      'saveSettings': 'Save Settings',
      'testConnection': 'Test Connection',
      
      // Account
      'profile': 'Profile',
      'usage': 'Usage',
      'logout': 'Logout',
      'exportData': 'Export Data',
      
      // Subscription
      'currentPlan': 'Current Plan',
      'upgrade': 'Upgrade',
      'usageThisMonth': 'Usage This Month',
      
      // Status messages
      'success': 'Success',
      'error': 'Error',
      'loading': 'Loading...',
      'checksUsed': 'checks used',
      
      // Plan descriptions
      'freePlanDesc': 'Basic features with limited checks',
      'basicPlanDesc': '1,000 monthly checks with email support',
      'proPlanDesc': '5,000 monthly checks with priority support',
      'unlimitedPlanDesc': 'Unlimited checks with all features'
    },
    tr: {
      // Navigation tabs
      'login': 'Giriş',
      'register': 'Kayıt',
      'verification': 'Doğrulama',
      'check': 'Kontrol',
      'settings': 'Ayarlar',
      'account': 'Hesap',
      'subscription': 'Abonelik',
      
      // Auth forms
      'email': 'E-posta',
      'password': 'Şifre',
      'confirmPassword': 'Şifre Tekrar',
      'loginButton': 'Giriş Yap',
      'registerButton': 'Kayıt Ol',
      'verificationCode': 'Doğrulama Kodu',
      'verifyButton': 'Doğrula',
      'resendCode': 'Kodu Tekrar Gönder',
      
      // Check page
      'asinInput': 'ASIN Girişi',
      'checkButton': 'ASIN Kontrol Et',
      'results': 'Sonuçlar',
      'exportCSV': 'CSV Dışa Aktar',
      
      // Settings
      'spApiSettings': 'SP-API Ayarları',
      'sellerId': 'Satıcı ID',
      'accessKey': 'Erişim Anahtarı',
      'secretKey': 'Gizli Anahtar',
      'region': 'Bölge',
      'saveSettings': 'Ayarları Kaydet',
      'testConnection': 'Bağlantıyı Test Et',
      
      // Account
      'profile': 'Profil',
      'usage': 'Kullanım',
      'logout': 'Çıkış',
      'exportData': 'Veri Dışa Aktar',
      
      // Subscription
      'currentPlan': 'Mevcut Plan',
      'upgrade': 'Yükselt',
      'usageThisMonth': 'Bu Ay Kullanım',
      
      // Status messages
      'success': 'Başarılı',
      'error': 'Hata',
      'loading': 'Yükleniyor...',
      'checksUsed': 'kontrol kullanıldı',
      
      // Plan descriptions
      'freePlanDesc': 'Sınırlı kontrollerle temel özellikler',
      'basicPlanDesc': 'E-posta desteği ile 1.000 aylık kontrol',
      'proPlanDesc': 'Öncelikli destek ile 5.000 aylık kontrol',
      'unlimitedPlanDesc': 'Tüm özelliklerle sınırsız kontrol'
    }
  };
  
  return texts[currentLanguage] || texts.en;
};

export const getText = (key: string, currentLanguage: Language): string => {
  const texts = getLanguageTexts(currentLanguage);
  return texts[key] || key;
};

// Language toggle function
export const toggleLanguage = (currentLanguage: Language): Language => {
  return currentLanguage === 'en' ? 'tr' : 'en';
};

// Format date based on language
export const formatDate = (date: Date, language: Language): string => {
  return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long'
  });
};

// Format number based on language
export const formatNumber = (num: number, language: Language): string => {
  return num.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US');
};
