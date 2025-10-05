import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'tr';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const result = await chrome.storage.local.get(['language']);
        const savedLanguage = result.language || 'en';
        setCurrentLanguage(savedLanguage as Language);
      } catch (error) {
        console.error('Failed to load language:', error);
        setCurrentLanguage('en');
      }
    };

    loadLanguage();
  }, []);

  // Save language to storage when changed
  const setLanguage = async (lang: Language) => {
    try {
      setCurrentLanguage(lang);
      await chrome.storage.local.set({ language: lang });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const texts = getLanguageTexts();
    return (texts as any)[key] || key;
  };

  // Language texts from reference sidepanel.js
  const getLanguageTexts = () => {
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
        
        // Auth messages
        'pleaseFillAllFields': 'Please fill in all fields',
        'loginSuccessful': 'Login successful!',
        'loginFailed': 'Login failed',
        'pleaseCheckEmailForVerification': 'Please check your email for verification code',
        'passwordsDoNotMatch': 'Passwords do not match',
        'registrationSuccessful': 'Registration successful! Welcome to FastChecker!',
        'registrationFailed': 'Registration failed',

        // Auth page texts (missing in EN)
        'welcomeTitle': 'Welcome to FastChecker',
        'welcomeSubtitle': 'Sign in to check your ASIN eligibility',
        'loginTitle': 'Login',
        'loginDesc': 'Enter your email below to login to your account',
        'forgotPassword': 'Forgot password?',
        'emailPlaceholder': 'm@example.com',
        'passwordPlaceholder': '••••••••',
        'signIn': 'Sign In',
        'signingIn': 'Signing In...',
        'dontHaveAccount': "Don't have an account?",
        'signUp': 'Sign up',
        'createAccount': 'Create Account',
        'createAccountSubtitle': 'Sign up to start checking ASINs',
        'registerTitle': 'Register',
        'registerDesc': 'Create your account to get started',
        'confirmPasswordPlaceholder': '••••••••',
        'createAccountBtn': 'Create Account',
        'creatingAccount': 'Creating Account...',
        'alreadyHaveAccount': 'Already have an account?',
        'signInLink': 'Sign in',
        'verifyYourEmail': 'Verify Your Email',
        'verificationCodeSent': 'We\'ve sent a 6-digit code to your email',
        'codeSentTo': 'Code sent to',
        'verifyEmail': 'Verify Email',
        'verifying': 'Verifying...',
        'codeExpiresIn': 'Code expires in',
        'didntReceiveCode': 'Didn\'t receive the code?',
        'resendAvailableIn': 'Resend available in',
        'backToLogin': 'Back to Login',
        'verificationCodeExpired': 'Your verification code has expired.',
        'pleaseResendCode': 'Please click "Resend Code" to get a new code.',
        'resetPassword': 'Reset Password',
        'enterNewPasswordReset': 'Enter your new password',
        'passwordMinLength': 'Password must be at least 8 characters long',
        'resetting': 'Resetting...',
        'resetPasswordSuccess': 'Password reset successfully! You can now login with your new password.',
        'verifyResetCode': 'Verify Reset Code',
        'resetCodeSent': 'We\'ll send you a 6-digit code to reset your password',
        'sending': 'Sending...',
        'sendResetCode': 'Send Reset Code',
        'resetCode': 'Reset Code',
        'enterResetCode': 'Enter 6-digit code',
        'back': 'Back',
        
            // Check page
            'asinInput': 'ASIN Input',
            'checkAsins': 'Check ASINs',
            'clearAsins': 'Clear',
            'emptyResults': 'Enter ASINs to check their eligibility',
            'emptySubtext': 'Results will appear here',
            'export': 'Export',
            'results': 'Results',
            'exportCSV': 'Export CSV',
            'clear': 'Clear',
            'sortByAsin': 'Sort by ASIN',
            'sortByTitle': 'Sort by Title',
            'sortByStatus': 'Sort by Status',
            'sortAscending': 'Sort Ascending',
            'sortDescending': 'Sort Descending',
            'noResultsYet': 'No Results Yet',
            'enterAsinsToCheck': 'Enter ASINs above and click "Check ASINs" to see results',
            'checkingAsins': 'Checking ASINs...',
            'enterAtLeastOneAsin': 'Please enter at least one ASIN',
            'enterValidAsins': 'Please enter valid ASINs',
            'checkedAsinsSuccessfully': 'Checked {count} ASINs successfully',
            'failedToCheckAsins': 'Failed to check ASINs',
            'noResultsToExport': 'No results to export',
            'csvExportedSuccessfully': 'CSV exported successfully',
            'resultsCleared': 'Results cleared',
            'clearResults': 'Clear Results',
            'areYouSureClearResults': 'Are you sure you want to clear all results?',
            'eligible': 'Eligible',
            'requiresApproval': 'Requires Approval',
            'restricted': 'Restricted',
            'ineligible': 'Ineligible',
            'sellable': 'Sellable',
            'approvalRequired': 'Approval Required',
            'notEligible': 'Not Eligible',
            'unknown': 'Unknown',
            'checkError': 'Error',
            'cancel': 'Cancel',
            'confirm': 'Confirm',
        
        // Settings
        'spApiSettings': 'SP-API Settings',
        'spApiConfiguration': 'SP-API Configuration',
        'sellerId': 'Seller ID',
        'accessKey': 'Access Key',
        'secretKey': 'Secret Key',
        'region': 'Region',
        'refreshToken': 'Refresh Token',
        'clientId': 'Client ID',
        'clientSecret': 'Client Secret',
        'marketplace': 'Marketplace',
        'saveSettings': 'Save Settings',
        'testConnection': 'Test Connection',
        'editSettings': 'Edit Settings',
        'preferences': 'Preferences',
        'enableManualCheck': 'Enable Manual Check',
        'enableManualCheckDesc': 'Allow manual ASIN checking through external tools',
        'manualCheckMethod': 'Manual Check Method',
        'remoteComputer': 'Remote Computer',
        'thisComputer': 'This Computer',
        'websocketUrl': 'WebSocket URL',
        'localPath': 'Extension ID',
        'enterWebsocketUrl': 'Enter WebSocket URL',
        'enterLocalPath': 'Enter Extension ID',
        'failedToLoadSettings': 'Failed to load settings',
        'settingsSavedSuccessfully': 'Settings saved successfully',
        'failedToSaveSettings': 'Failed to save settings',
        'pleaseConfigureSettings': 'Please configure your SP-API settings to continue',
        'saved': 'Saved',
        'cancelChanges': 'Cancel Changes',
        'cancelChangesMessage': 'Are you sure you want to cancel? Unsaved changes will be lost.',
        'discard': 'Discard',
        'continueEditing': 'Continue Editing',
        'saving': 'Saving...',
        'testing': 'Testing...',
        'language': 'Language',
        'selectLanguage': 'Choose your preferred language',
        'darkMode': 'Dark Mode',
        'darkModeDesc': 'Toggle between light and dark theme',
        'loading': 'Loading...',
        
        // Account
        'profile': 'Profile',
        'usage': 'Usage',
        'logout': 'Logout',
        'exportData': 'Export Data',
        'accountOverview': 'Account Overview',
        'usageStatistics': 'Usage Statistics',
        'thisMonth': 'This Month',
        'asinsChecked': 'ASINs Checked',
        'successRate': 'Success Rate',
        'limit': 'limit',
        'memberSince': 'Member since',
        'changeEmail': 'Change Email',
        'changePassword': 'Change Password',
        'currentEmail': 'Current Email',
        'newEmail': 'New Email',
        'currentPassword': 'Current Password',
        'newPassword': 'New Password',
        'confirmNewPassword': 'Confirm New Password',
        'updateEmail': 'Update Email',
        'updatePassword': 'Update Password',
        'enterNewEmail': 'Enter new email address',
        'enterCurrentPassword': 'Enter current password',
        'enterNewPassword': 'Enter new password',
        'confirmNewPasswordPlaceholder': 'Confirm new password',
        'accountSettings': 'Account Settings',
        'exportAsinDescription': 'Export your monthly ASIN queries and results as CSV.',
        'downloadCsv': 'Download CSV',
        'failedToLoadAccountData': 'Failed to load account data',
        'logoutConfirmation': 'Are you sure you want to logout?',
        'loggedOutSuccessfully': 'Logged out successfully',
        'logoutFailed': 'Logout failed',
        'dataExportedSuccessfully': 'Data exported successfully',
        'dataExportFailed': 'Data export failed',
        'emailChangedSuccessfully': 'Email changed successfully',
        'emailChangeFailed': 'Email change failed',
        'passwordChangedSuccessfully': 'Password changed successfully',
        'passwordChangeFailed': 'Password change failed',
        'fillAllFields': 'Please fill in all fields',
        'updating': 'Updating...',
        'exporting': 'Exporting...',
        'accountUnknown': 'Unknown',
        
        // Subscription
        'currentPlan': 'Current Plan',
        'upgrade': 'Upgrade',
        'usageThisMonth': 'Usage This Month',
        'checksUsed': 'checks used',
        'availablePlans': 'Available Plans',
        'monthlyLimit': 'Monthly Limit',
        'usedThisMonth': 'Used This Month',
        'perMonth': '/month',
        'mostPopular': 'Most Popular',
        'upgradeToBasic': 'Upgrade to Basic',
        'upgradeToPro': 'Upgrade to Pro',
        'upgradeToUnlimited': 'Upgrade to Unlimited',
        'upgradeTo': 'Upgrade',
        'downgradeTo': 'Downgrade',
        'unlimited': 'Unlimited',
        'checks': 'checks',
        'planFree': 'Free',
        'checksPerMonth': 'checks/month',
        'billingCycle': 'Billing Cycle',
        'daysRemaining': 'days remaining',
        'renewsOn': 'Renews on',
        'monthlyReset': 'Monthly reset',
        'scheduledChange': 'Scheduled Change',
        'plan': 'plan',
        'on': 'on',
        'currentPlanBadge': 'Current Plan',
        'scheduled': 'Scheduled',
        'processing': 'Processing...',
        'downgrade': 'Downgrade',
        'cancelSubscription': 'Cancel Subscription',
        'notAvailable': 'Not Available',
        'csvExport': 'CSV Export',
        'monthlyDataExport': 'Monthly Data Export',
        'bulkProcessing': 'Bulk Processing',
        'manualCheck': 'Manual Check',
        'technicalSupport': 'Technical Support',
        'basicFeatures': 'Basic features',
        'confirmCancelSubscription': 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.',
        'confirmDowngrade': 'Downgrade to {planName}?\n\nYour plan will change at the end of your current billing cycle. You will lose access to some premium features, but you can upgrade again anytime.',
        'confirmUpgrade': 'Upgrade to {planName}? You will be redirected to the payment page to complete your purchase.',
        'to': 'to',
        'redirectingToPayment': 'Redirecting to payment page...',
        'failedCheckoutSession': 'Failed to create checkout session',
        'subscriptionCancelledSuccess': 'Subscription cancelled successfully! You will be downgraded to Free plan at the end of your billing cycle.',
        'failedCancelSubscription': 'Failed to cancel subscription',
        'downgradeScheduledSuccess': 'Plan downgrade to {planName} scheduled successfully! Change will take effect at the end of your billing cycle.',
        'failedScheduleDowngrade': 'Failed to schedule downgrade',
        'errorProcessingRequest': 'An error occurred while processing your request',
        'cancelChange': 'Cancel Scheduled Change',
        'changeScheduled': 'Already Scheduled',
        'cancelPendingChange': 'Cancel Scheduled Change',
        'confirmCancelPendingChange': 'Are you sure you want to cancel the scheduled plan change? Your current plan will continue without any changes.',
        'pendingChangeCancelledSuccess': 'Pending plan change cancelled successfully',
        'failedCancelPendingChange': 'Failed to cancel pending change',

        // Status messages
        'success': 'Success',
        'error': 'Error',
        
        // Plan descriptions now come from backend dynamically
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
        
        // Auth messages
        'pleaseFillAllFields': 'Lütfen tüm alanları doldurun',
        'loginSuccessful': 'Giriş başarılı!',
        'loginFailed': 'Giriş başarısız',
        'pleaseCheckEmailForVerification': 'Lütfen doğrulama kodu için e-postanızı kontrol edin',
        'passwordsDoNotMatch': 'Şifreler eşleşmiyor',
        'registrationSuccessful': 'Kayıt başarılı! FastChecker\'a hoş geldiniz!',
        'registrationFailed': 'Kayıt başarısız',
        
        // Auth page texts
        'welcomeTitle': 'FastChecker\'a Hoş Geldiniz',
        'welcomeSubtitle': 'ASIN uygunluğunuzu kontrol etmek için giriş yapın',
        'loginTitle': 'Giriş',
        'loginDesc': 'Hesabınıza giriş yapmak için e-posta adresinizi girin',
        'forgotPassword': 'Şifremi unuttum?',
        'emailPlaceholder': 'ornek@email.com',
        'passwordPlaceholder': '••••••••',
        'signIn': 'Giriş Yap',
        'signingIn': 'Giriş yapılıyor...',
        'dontHaveAccount': 'Hesabınız yok mu?',
        'signUp': 'Kayıt ol',
        'createAccount': 'Hesap Oluştur',
        'createAccountSubtitle': 'ASIN kontrolüne başlamak için kayıt olun',
        'registerTitle': 'Kayıt',
        'registerDesc': 'Başlamak için hesabınızı oluşturun',
        'confirmPasswordPlaceholder': '••••••••',
        'createAccountBtn': 'Hesap Oluştur',
        'creatingAccount': 'Hesap oluşturuluyor...',
        'alreadyHaveAccount': 'Zaten hesabınız var mı?',
        'signInLink': 'Giriş yap',
        'verifyYourEmail': 'E-postanızı Doğrulayın',
        'verificationCodeSent': 'E-postanıza 6 haneli bir kod gönderdik',
        'codeSentTo': 'Kod gönderildi',
        'verifyEmail': 'E-postayı Doğrula',
        'verifying': 'Doğrulanıyor...',
        'codeExpiresIn': 'Kod süresi doluyor',
        'didntReceiveCode': 'Kodu almadınız mı?',
        'resendAvailableIn': 'Tekrar gönderme süresi',
        'backToLogin': 'Girişe Dön',
        'verificationCodeExpired': 'Doğrulama kodunuzun süresi doldu.',
        'pleaseResendCode': 'Yeni kod almak için "Kodu Tekrar Gönder"e tıklayın.',
        'resetPassword': 'Şifre Sıfırla',
        'enterNewPasswordReset': 'Yeni şifrenizi girin',
        'passwordMinLength': 'Şifre en az 8 karakter uzunluğunda olmalıdır',
        'resetting': 'Sıfırlanıyor...',
        'resetPasswordSuccess': 'Şifre başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz.',
        'verifyResetCode': 'Sıfırlama Kodunu Doğrula',
        'resetCodeSent': 'Şifrenizi sıfırlamak için size 6 haneli bir kod göndereceğiz',
        'sending': 'Gönderiliyor...',
        'sendResetCode': 'Sıfırlama Kodu Gönder',
        'resetCode': 'Sıfırlama Kodu',
        'enterResetCode': '6 haneli kodu girin',
        'back': 'Geri',
        
            // Check page
            'asinInput': 'ASIN Girişi',
            'checkAsins': 'ASIN Kontrol Et',
            'clearAsins': 'Temizle',
            'emptyResults': 'ASIN uygunluğunu kontrol etmek için ASIN\'leri girin',
            'emptySubtext': 'Sonuçlar burada görünecek',
            'export': 'Dışa Aktar',
            'results': 'Sonuçlar',
            'exportCSV': 'CSV Dışa Aktar',
            'clear': 'Temizle',
            'sortByAsin': 'ASIN\'e Göre Sırala',
            'sortByTitle': 'Başlığa Göre Sırala',
            'sortByStatus': 'Duruma Göre Sırala',
            'sortAscending': 'Artan Sıralama',
            'sortDescending': 'Azalan Sıralama',
            'noResultsYet': 'Henüz Sonuç Yok',
            'enterAsinsToCheck': 'Yukarıdaki alana ASIN\'leri girin ve sonuçları görmek için "ASIN Kontrol Et"e tıklayın',
            'checkingAsins': 'ASIN\'ler kontrol ediliyor...',
            'enterAtLeastOneAsin': 'Lütfen en az bir ASIN girin',
            'enterValidAsins': 'Lütfen geçerli ASIN\'ler girin',
            'checkedAsinsSuccessfully': '{count} ASIN başarıyla kontrol edildi',
            'failedToCheckAsins': 'ASIN\'ler kontrol edilemedi',
            'noResultsToExport': 'Dışa aktarılacak sonuç yok',
            'csvExportedSuccessfully': 'CSV başarıyla dışa aktarıldı',
            'resultsCleared': 'Sonuçlar temizlendi',
            'clearResults': 'Sonuçları Temizle',
            'areYouSureClearResults': 'Tüm sonuçları temizlemek istediğinizden emin misiniz?',
            'eligible': 'Uygun',
            'requiresApproval': 'Onay Gerekli',
            'restricted': 'Kısıtlama Var',
            'ineligible': 'Uygun Değil',
            'sellable': 'Satılabilir',
            'approvalRequired': 'Onay Gerekli',
            'notEligible': 'Satılamaz',
            'unknown': 'Bilinmiyor',
            'checkError': 'Hata',
            'cancel': 'İptal',
            'confirm': 'Onayla',
        
        // Settings
        'spApiSettings': 'SP-API Ayarları',
        'spApiConfiguration': 'SP-API Yapılandırması',
        'sellerId': 'Satıcı ID',
        'accessKey': 'Erişim Anahtarı',
        'secretKey': 'Gizli Anahtar',
        'region': 'Bölge',
        'refreshToken': 'Yenileme Tokeni',
        'clientId': 'İstemci ID',
        'clientSecret': 'İstemci Gizli',
        'marketplace': 'Pazar Yeri',
        'saveSettings': 'Ayarları Kaydet',
        'testConnection': 'Bağlantıyı Test Et',
        'editSettings': 'Ayarları Düzenle',
        'preferences': 'Tercihler',
        'enableManualCheck': 'Manuel Kontrol Etkinleştir',
        'enableManualCheckDesc': 'Harici araçlar aracılığıyla manuel ASIN kontrolüne izin ver',
        'manualCheckMethod': 'Manuel Kontrol Yöntemi',
        'remoteComputer': 'Uzak Bilgisayar',
        'thisComputer': 'Bu Bilgisayar',
        'websocketUrl': 'WebSocket URL',
        'localPath': 'Uzantı ID',
        'enterWebsocketUrl': 'WebSocket URL girin',
        'enterLocalPath': 'Uzantı ID girin',
        'failedToLoadSettings': 'Ayarlar yüklenemedi',
        'settingsSavedSuccessfully': 'Ayarlar başarıyla kaydedildi',
        'failedToSaveSettings': 'Ayarlar kaydedilemedi',
        'pleaseConfigureSettings': 'Devam etmek için SP-API ayarlarınızı yapılandırın',
        'saved': 'Kaydedildi',
        'cancelChanges': 'Değişiklikleri İptal Et',
        'cancelChangesMessage': 'İptal etmek istediğinizden emin misiniz? Kaydedilmemiş değişiklikler kaybolacak.',
        'discard': 'Vazgeç',
        'continueEditing': 'Düzenlemeye Devam Et',
        'saving': 'Kaydediliyor...',
        'testing': 'Test ediliyor...',
        'language': 'Dil',
        'selectLanguage': 'Tercih ettiğiniz dili seçin',
        'darkMode': 'Karanlık Mod',
        'darkModeDesc': 'Açık ve karanlık tema arasında geçiş yapın',
        'loading': 'Yükleniyor...',
        
        // Account
        'profile': 'Profil',
        'usage': 'Kullanım',
        'logout': 'Çıkış',
        'exportData': 'Veri Dışa Aktar',
        'accountOverview': 'Hesap Genel Bakış',
        'usageStatistics': 'Kullanım İstatistikleri',
        'thisMonth': 'Bu Ay',
        'asinsChecked': 'Kontrol Edilen ASIN\'ler',
        'successRate': 'Başarı Oranı',
        'limit': 'limit',
        'memberSince': 'Üyelik tarihi',
        'changeEmail': 'E-posta Değiştir',
        'changePassword': 'Şifre Değiştir',
        'currentEmail': 'Mevcut E-posta',
        'newEmail': 'Yeni E-posta',
        'currentPassword': 'Mevcut Şifre',
        'newPassword': 'Yeni Şifre',
        'confirmNewPassword': 'Yeni Şifreyi Onayla',
        'updateEmail': 'E-postayı Güncelle',
        'updatePassword': 'Şifreyi Güncelle',
        'enterNewEmail': 'Yeni e-posta adresi girin',
        'enterCurrentPassword': 'Mevcut şifrenizi girin',
        'enterNewPassword': 'Yeni şifrenizi girin',
        'confirmNewPasswordPlaceholder': 'Yeni şifrenizi onaylayın',
        'accountSettings': 'Hesap Ayarları',
        'exportAsinDescription': 'Aylık ASIN sorgularınızı ve sonuçlarınızı CSV olarak dışa aktarın.',
        'downloadCsv': 'CSV İndir',
        'failedToLoadAccountData': 'Hesap verileri yüklenemedi',
        'logoutConfirmation': 'Çıkış yapmak istediğinizden emin misiniz?',
        'loggedOutSuccessfully': 'Başarıyla çıkış yapıldı',
        'logoutFailed': 'Çıkış başarısız',
        'dataExportedSuccessfully': 'Veriler başarıyla dışa aktarıldı',
        'dataExportFailed': 'Veri dışa aktarma başarısız',
        'emailChangedSuccessfully': 'E-posta başarıyla değiştirildi',
        'emailChangeFailed': 'E-posta değiştirme başarısız',
        'passwordChangedSuccessfully': 'Şifre başarıyla değiştirildi',
        'passwordChangeFailed': 'Şifre değiştirme başarısız',
        'fillAllFields': 'Lütfen tüm alanları doldurun',
        'updating': 'Güncelleniyor...',
        'exporting': 'Dışa aktarılıyor...',
        'accountUnknown': 'Bilinmiyor',
        
        // Subscription
        'currentPlan': 'Mevcut Plan',
        'upgrade': 'Yükselt',
        'usageThisMonth': 'Bu Ay Kullanım',
        'checksUsed': 'kontrol kullanıldı',
        'availablePlans': 'Mevcut Planlar',
        'monthlyLimit': 'Aylık Limit',
        'usedThisMonth': 'Bu Ay Kullanılan',
        'perMonth': '/ay',
        'mostPopular': 'En Popüler',
        'upgradeToBasic': 'Temel\'e Yükselt',
        'upgradeToPro': 'Pro\'ya Yükselt',
        'upgradeToUnlimited': 'Sınırsız\'a Yükselt',
        'upgradeTo': 'Yükseltme',
        'downgradeTo': 'Düşürme',
        'unlimited': 'Sınırsız',
        'checks': 'sorgu',
        'planFree': 'Ücretsiz',
        'checksPerMonth': 'sorgu/ay',
        'billingCycle': 'Faturalama Döngüsü',
        'daysRemaining': 'gün kaldı',
        'renewsOn': 'Yenilenme tarihi',
        'monthlyReset': 'Aylık sıfırlama',
        'scheduledChange': 'Planlanmış Değişiklik',
        'plan': 'plan',
        'on': 'tarihinde',
        'currentPlanBadge': 'Mevcut Plan',
        'scheduled': 'Planlandı',
        'processing': 'İşleniyor...',
        'downgrade': 'Plan Düşürme',
        'cancelSubscription': 'Aboneliği İptal Et',
        'notAvailable': 'Kullanılamaz',
        'csvExport': 'CSV Dışa Aktarma',
        'monthlyDataExport': 'Aylık Veri Dışa Aktarma',
        'bulkProcessing': 'Toplu İşleme',
        'manualCheck': 'Manuel Kontrol',
        'technicalSupport': 'Teknik Destek',
        'basicFeatures': 'Temel özellikler',
        'confirmCancelSubscription': 'Aboneliğinizi iptal etmek istediğinizden emin misiniz? Faturalama döneminizin sonunda premium özelliklere erişiminizi kaybedeceksiniz.',
        'confirmDowngrade': '{planName} planına düşürme yapılsın mı?\n\nPlanınız mevcut faturalama döneminizin sonunda değişecektir. Bazı premium özelliklere erişiminizi kaybedeceksiniz, ancak istediğiniz zaman tekrar yükseltme yapabilirsiniz.',
        'confirmUpgrade': '{planName} planına yükseltme yapmak ister misiniz? Ödeme sayfasına yönlendirileceksiniz.',
        'to': '',
        'redirectingToPayment': 'Ödeme sayfasına yönlendiriliyorsunuz...',
        'failedCheckoutSession': 'Ödeme oturumu oluşturulamadı',
        'subscriptionCancelledSuccess': 'Abonelik başarıyla iptal edildi! Faturalama döneminizin sonunda Ücretsiz plana düşürüleceksiniz.',
        'failedCancelSubscription': 'Abonelik iptal edilemedi',
        'downgradeScheduledSuccess': '{planName} planına düşürme başarıyla planlandı! Değişiklik faturalama döneminizin sonunda geçerli olacaktır.',
        'failedScheduleDowngrade': 'Düşürme planlanamadı',
        'errorProcessingRequest': 'İsteğiniz işlenirken bir hata oluştu',
        'cancelChange': 'Planlanmış Değişikliği İptal Et',
        'changeScheduled': 'Zaten Planlandı',
        'cancelPendingChange': 'Planlanmış Değişikliği İptal Et',
        'confirmCancelPendingChange': 'Planlanmış plan değişikliğini iptal etmek istediğinizden emin misiniz? Mevcut planınız değişiklik olmadan devam edecektir.',
        'pendingChangeCancelledSuccess': 'Bekleyen plan değişikliği başarıyla iptal edildi',
        'failedCancelPendingChange': 'Bekleyen değişiklik iptal edilemedi',

        // Status messages
        'success': 'Başarılı',
        'error': 'Hata',
        
        
        // Plan descriptions
        // Plan descriptions now come from backend dynamically
      }
    };
    
    return texts[currentLanguage] || texts.en;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
