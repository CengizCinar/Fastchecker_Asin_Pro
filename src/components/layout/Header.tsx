import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SubscriptionData } from '../../types/api';
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
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUsageUpdate = (event: CustomEvent) => {
      const usageData = event.detail;
      if (usageData && subscriptionData) {
        setSubscriptionData(prev => prev ? {
          ...prev,
          usedThisMonth: usageData.current || prev.usedThisMonth,
          monthlyLimit: usageData.limit || prev.monthlyLimit
        } : null);
      }
    };

    window.addEventListener('usageUpdated', handleUsageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('usageUpdated', handleUsageUpdate as EventListener);
    };
  }, [subscriptionData]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoadingUsage(true);
      const result = await apiClient.getSubscriptionStatus();
      if (result.success) {
        setSubscriptionData(result.subscription || result.data || null);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
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
          <span className="usage-count">
            {currentUser ? (
              <>
                <span className="plan-badge">{subscriptionData?.planName || currentUser.plan}</span>
                <span className="separator">•</span>
                {isLoadingUsage ? (
                  'Loading usage...'
                ) : subscriptionData ? (
                  `${subscriptionData.usedThisMonth}/${subscriptionData.monthlyLimit === -1 ? '∞' : subscriptionData.monthlyLimit} ${t('checksUsed')}`
                ) : (
                  'Usage unavailable'
                )}
              </>
            ) : (
              'Loading usage...'
            )}
          </span>
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
