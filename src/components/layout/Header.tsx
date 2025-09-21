import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
interface LegacySubscriptionData {
  currentPlan: {
    name: string;
    limit: number;
    code: string;
    price?: number;
    features?: any;
  };
  usage: {
    current: number;
    limit: number;
    resetDate?: string;
  };
  subscription?: {
    endDate: string;
    isActive: boolean;
  };
}

interface UserProfileData {
  monthlyUsageCount: number;
  email: string;
  // other user profile fields...
}
import './Header.css';

// Import apiClient
declare const apiClient: any;

interface HeaderProps {
  showNavigation?: boolean;
}

export function Header({ showNavigation = true }: HeaderProps) {
  const { activeTab, switchTab } = useAppContext();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { currentTheme, toggleTheme } = useTheme();
  const [subscriptionData, setSubscriptionData] = useState<LegacySubscriptionData | null>(null);
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
      loadUsageData();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUsageUpdate = (event: CustomEvent) => {
      const usageData = event.detail;
      if (usageData && userProfileData) {
        // Legacy gibi userProfileData.monthlyUsageCount update
        setUserProfileData(prev => prev ? {
          ...prev,
          monthlyUsageCount: usageData.current || prev.monthlyUsageCount || 0
        } : null);
      }
    };

    window.addEventListener('usageUpdated', handleUsageUpdate as EventListener);

    return () => {
      window.removeEventListener('usageUpdated', handleUsageUpdate as EventListener);
    };
  }, [userProfileData]);

  const loadSubscriptionData = async () => {
    try {
      const result = await apiClient.getSubscriptionStatus();

      console.log('🔄 Backend subscription response:', result);

      if (result.success) {
        // Backend response structure: currentPlan ve usage root level'da geliyor
        const subscriptionData = {
          currentPlan: result.currentPlan,
          usage: result.usage,
          subscription: result.subscription
        };

        console.log('📊 Formatted subscription data:', subscriptionData);
        setSubscriptionData(subscriptionData);
      } else {
        console.error('❌ Backend subscription status failed:', result.error);
      }
    } catch (error) {
      console.error('💥 Error loading subscription data:', error);
    }
  };

  const loadUsageData = async () => {
    try {
      setIsLoadingUsage(true);
      console.log('📊 Loading usage data from backend...');

      // Legacy gibi getUserProfile API call
      const result = await apiClient.getUserProfile();

      console.log('👤 Backend user profile response:', result);

      if (result.success) {
        const profileData = result.user || result.data;
        if (profileData) {
          console.log('📈 User profile data from backend:', profileData);
          setUserProfileData(profileData);
        }
      } else {
        console.error('❌ Backend user profile failed:', result.error);
      }
    } catch (error) {
      console.error('💥 Error loading usage data:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleUpgrade = () => {
    chrome.tabs.create({ url: 'https://fastchecker.com/upgrade' });
  };

  const handleLanguageToggle = () => {
    setLanguage(currentLanguage === 'en' ? 'tr' : 'en');
  };

  const handleExternalLink = () => {
    chrome.tabs.create({ url: 'https://fastchecker.com' });
  };

  const handleTabClick = (tab: 'check' | 'settings' | 'account' | 'subscription') => {
    switchTab(tab);
  };

  // Helper method to get translated plan name - uppercase format
  const getTranslatedPlanName = (planName: string) => {
    console.log('🏷️ Translating plan name:', planName);

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
      console.log('🏷️ Plan name result:', result);
      return result;
    }

    // Fallback to uppercase plan name
    const result = planName.toUpperCase();
    console.log('🏷️ Plan name fallback result:', result);
    return result;
  };

  return (
    <header className="app-header">
      {/* Top Bar */}
      <div className="header-top">
        <div className="logo-section">
          <div className="logo-icon">⚡</div>
          <h1 className="app-title">FastChecker</h1>
        </div>
        <div className="header-actions">
          <button 
            className={`language-toggle ${currentLanguage === 'tr' ? 'active' : ''}`}
            onClick={handleLanguageToggle}
          >
            <span className="lang-en">EN</span>
            <span className="lang-tr">TR</span>
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="sun-icon">☀️</span>
            <span className="moon-icon">🌙</span>
          </button>
          <button className="external-link" onClick={handleExternalLink}>↗</button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="usage-info">
          {currentUser ? (
            <span className="usage-count">
              {isLoadingUsage ? (
                'Loading usage...'
              ) : subscriptionData && userProfileData ? (
                <>
                  <span className="plan-badge-usage">
                    {getTranslatedPlanName(subscriptionData.currentPlan?.name || 'Free Plan')}
                  </span>
                  {(() => {
                    const currentUsage = userProfileData.monthlyUsageCount || 0;
                    const usageLimit = subscriptionData.currentPlan?.limit;
                    const limitText = usageLimit === -1 ? '∞' : (usageLimit || 100);

                    console.log('📊 Usage display:', {
                      currentUsage,
                      usageLimit,
                      limitText,
                      planName: subscriptionData.currentPlan?.name
                    });

                    return ` ${currentUsage}/${limitText} ${t('checksUsed')}`;
                  })()}
                </>
              ) : (
                '0/100 checks used'
              )}
            </span>
          ) : (
            <span className="usage-count">Loading usage...</span>
          )}
        </div>
        <button className="upgrade-btn" onClick={handleUpgrade}>
          <span className="diamond-icon">💎</span>
          <span>{t('upgrade')}</span>
        </button>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'check' ? 'active' : ''}`}
            onClick={() => handleTabClick('check')}
          >
            <span className="nav-icon">✓</span>
            <span className="nav-label">{t('check')}</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">{t('settings')}</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => handleTabClick('account')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">{t('account')}</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => handleTabClick('subscription')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">{t('subscription')}</span>
          </button>
          <div className="nav-indicator" style={{
            width: '25%',
            left: `${['check', 'settings', 'account', 'subscription'].indexOf(activeTab) * 25}%`
          }}></div>
        </nav>
      )}
    </header>
  );
}
