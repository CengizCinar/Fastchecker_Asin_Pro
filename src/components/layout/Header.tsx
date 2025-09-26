import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import './Header.css';

interface HeaderProps {
  showNavigation?: boolean;
}

export function Header({ showNavigation = true }: HeaderProps) {
  const { activeTab, switchTab } = useAppContext();
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { currentTheme, toggleTheme } = useTheme();
  const { subscriptionData, isLoading: isLoadingSubscription } = useSubscription();

  // No more local subscription loading - using SubscriptionContext

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

  // Helper method to get clean plan name - remove hardcoded mapping
  const getCleanPlanName = (planName: string) => {
    // Remove " Plan" suffix and return uppercase
    return planName.replace(' Plan', '').toUpperCase();
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
              {isLoadingSubscription ? (
                'Loading usage...'
              ) : subscriptionData ? (
                <>
                  <span className="plan-badge-usage">
                    {getCleanPlanName(subscriptionData.plan?.name || 'Free Plan')}
                  </span>
                  {(() => {
                    const currentUsage = subscriptionData.usage?.current || 0;
                    const usageLimit = subscriptionData.plan?.monthlyLimit;
                    const limitText = usageLimit === -1 ? '∞' : usageLimit;

                    console.log('📊 Usage display:', {
                      currentUsage,
                      usageLimit,
                      limitText,
                      planName: subscriptionData.plan?.name
                    });

                    return ` ${currentUsage}/${limitText} ${t('checksUsed')}`;
                  })()}
                </>
              ) : (
                'Loading...'
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
