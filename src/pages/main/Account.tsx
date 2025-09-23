import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useModal } from '../../contexts/ModalContext';
import './Account.css';

// Import apiClient
declare const apiClient: any;

interface UsageStats {
  current: number;
  limit: number;
  successRate: number;
}

interface UserProfile {
  email: string;
  createdAt: string;
  plan: string;
}

export function Account() {
  const { currentUser, logout } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { showToast } = useToast();
  const { showModal } = useModal();
  
  const [usageStats, setUsageStats] = useState<UsageStats>({
    current: 0,
    limit: 100,
    successRate: 0
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Email change form
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Helper method to get translated plan name - same as Header component
  const getTranslatedPlanName = (planName: string) => {
    console.log('🏷️ Account: Translating plan name:', planName);

    // Map backend plan names to translation keys
    const planKeyMap: Record<string, string> = {
      'Free Plan': 'freePlan',
      'Basic Plan': 'basicPlan',
      'Pro Plan': 'proPlan',
      'Unlimited Plan': 'unlimitedPlan'
    };

    const translationKey = planKeyMap[planName];
    if (translationKey) {
      const translatedName = t(translationKey);
      const result = translatedName.toUpperCase();
      console.log('🏷️ Account: Plan name result:', result);
      return result;
    }

    // Fallback to uppercase plan name
    const result = planName.toUpperCase();
    console.log('🏷️ Account: Plan name fallback result:', result);
    return result;
  };

  useEffect(() => {
    if (currentUser && !isDataLoaded) {
      loadAccountData();
    }
  }, [currentUser, isDataLoaded]);

  const loadAccountData = async () => {
    try {
      setIsLoading(true);
      
      // Load usage statistics
      const usageResult = await apiClient.getUsageStats();
      if (usageResult.success) {
        setUsageStats(usageResult.statistics || {
          current: 0,
          limit: 100,
          successRate: 0
        });
      }
      
      // Load user profile
      const profileResult = await apiClient.getUserProfile();
      if (profileResult.success) {
        setUserProfile(profileResult.user);
      }
      
    } catch (error) {
      console.error('Error loading account data:', error);
      showToast(t('failedToLoadAccountData'), 'error');
    } finally {
      setIsLoading(false);
      setIsDataLoaded(true);
    }
  };

  const handleLogout = () => {
    showModal({
      title: t('logout'),
      message: t('logoutConfirmation'),
      onConfirm: async () => {
        try {
          await logout();
          showToast(t('loggedOutSuccessfully'), 'success');
        } catch (error) {
          console.error('Error logging out:', error);
          showToast(t('logoutFailed'), 'error');
        }
      },
      isDestructive: true,
      confirmText: t('logout'),
      cancelText: t('cancel')
    });
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await apiClient.exportUserData();
      
      if (result.success) {
        // Create and download CSV file
        const blob = new Blob([result.csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fastchecker-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(t('dataExportedSuccessfully'), 'success');
      } else {
        showToast(result.error || t('dataExportFailed'), 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast(t('dataExportFailed'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      showToast(t('fillAllFields'), 'error');
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const result = await apiClient.changeEmail({
        newEmail: emailForm.newEmail,
        currentPassword: emailForm.currentPassword
      });
      
      if (result.success) {
        showToast(t('emailChangedSuccessfully'), 'success');
        setShowEmailForm(false);
        setEmailForm({ newEmail: '', currentPassword: '' });
        loadAccountData(); // Reload to get updated email
      } else {
        showToast(result.error || t('emailChangeFailed'), 'error');
      }
    } catch (error) {
      console.error('Error changing email:', error);
      showToast(t('emailChangeFailed'), 'error');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast(t('fillAllFields'), 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t('passwordsDoNotMatch'), 'error');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const result = await apiClient.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (result.success) {
        showToast(t('passwordChangedSuccessfully'), 'success');
        setShowPasswordForm(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(result.error || t('passwordChangeFailed'), 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(t('passwordChangeFailed'), 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getDisplayName = () => {
    if (!userProfile?.email) return 'User';
    const name = userProfile.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getMemberSince = () => {
    if (!userProfile?.createdAt) return t('accountUnknown');
    const date = new Date(userProfile.createdAt);
    return date.toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getUsagePercentage = () => {
    if (usageStats.limit === -1) return 0; // Unlimited
    return Math.min((usageStats.current / usageStats.limit) * 100, 100);
  };

  const getSuccessRatePercentage = () => {
    return Math.round(usageStats.successRate * 100);
  };

  return (
    <div className="account-page">
      <div className="account-container">
        {/* Account Overview Card */}
        <div className="account-card overview-card">
          <div className="overview-header">
            <h3 className="overview-title">{t('accountOverview')}</h3>
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">→</span>
              {t('logout')}
            </button>
          </div>
          <div className="account-profile">
            <div className="profile-avatar">
              <span className="avatar-icon">👤</span>
              <span className="plan-badge">{getTranslatedPlanName(userProfile?.plan || 'Free Plan')}</span>
            </div>
            <div className="profile-info">
              <h4 className="profile-name">{getDisplayName()}</h4>
              <p className="profile-email">{userProfile?.email || currentUser?.email || 'user@example.com'}</p>
              <p className="member-since">{t('memberSince')}: {getMemberSince()}</p>
            </div>
          </div>
        </div>

        {/* Usage Statistics Card */}
        <div className="account-card stats-card">
          <div className="card-header">
            <h3 className="card-title">{t('usageStatistics')}</h3>
            <span className="stats-period">{t('thisMonth')}</span>
          </div>
          <div className="usage-stats">
            <div className="stat-item">
              <div className="stat-header">
                <span className="stat-label">{t('asinsChecked')}</span>
                <span className="stat-value">{usageStats.current}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
              <div className="stat-limit">
                <span>{usageStats.limit === -1 ? '∞' : usageStats.limit}</span> <span>{t('limit')}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-header">
                <span className="stat-label">{t('successRate')}</span>
                <span className="stat-value">{getSuccessRatePercentage()}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill success-progress" 
                  style={{ width: `${getSuccessRatePercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings Card */}
        <div className="account-card settings-card">
          <div className="card-header">
            <h3 className="card-title">{t('accountSettings')}</h3>
          </div>
          <div className="settings-options">
            <button 
              className="setting-option" 
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              <span className="setting-icon">📧</span>
              <span className="setting-label">{t('changeEmail')}</span>
              <span className="setting-arrow">{showEmailForm ? '▼' : '›'}</span>
            </button>
            <button 
              className="setting-option" 
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <span className="setting-icon">🔒</span>
              <span className="setting-label">{t('changePassword')}</span>
              <span className="setting-arrow">{showPasswordForm ? '▼' : '›'}</span>
            </button>
          </div>
          
          {/* Email Change Form */}
          {showEmailForm && (
            <div className="setting-form">
              <form onSubmit={handleEmailChange}>
                <div className="form-group">
                  <label className="form-label">{t('currentEmail')}</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={userProfile?.email || ''} 
                    readOnly 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('newEmail')}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder={t('enterNewEmail')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('currentPassword')}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder={t('enterCurrentPassword')}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="action-btn primary" disabled={isUpdatingEmail}>
                    {isUpdatingEmail ? t('updating') : t('updateEmail')}
                  </button>
                  <button 
                    type="button" 
                    className="action-btn secondary" 
                    onClick={() => setShowEmailForm(false)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Password Change Form */}
          {showPasswordForm && (
            <div className="setting-form">
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label className="form-label">{t('currentPassword')}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder={t('enterCurrentPassword')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('newPassword')}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder={t('enterNewPassword')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('confirmNewPassword')}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t('confirmNewPasswordPlaceholder')}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="action-btn primary" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? t('updating') : t('updatePassword')}
                  </button>
                  <button 
                    type="button" 
                    className="action-btn secondary" 
                    onClick={() => setShowPasswordForm(false)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Data Export Card */}
        <div className="account-card export-card">
          <div className="card-header">
            <h3 className="card-title">{t('exportData')}</h3>
          </div>
          <div className="export-info">
            <p className="export-description">{t('exportAsinDescription')}</p>
            <button
              className="action-btn primary full-width"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <span className="action-icon">📄</span>
              <span>{isExporting ? t('exporting') : t('downloadCsv')}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>{t('loading')}</span>
          </div>
        )}
      </div>
    </div>
  );
}