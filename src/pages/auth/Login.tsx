import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { Register } from './Register';
import './Login.css';

interface LoginProps {
  onSwitchToRegister?: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageToggle = () => {
    setLanguage(currentLanguage === 'en' ? 'tr' : 'en');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      showToast(t('pleaseFillAllFields'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      
      if (result && result.success) {
        showToast(t('loginSuccessful'), 'success');
      } else if (result && result.requiresVerification) {
        // Store email for verification and redirect
        await chrome.storage.local.set({ pendingVerificationEmail: result.email });
        showToast(t('pleaseCheckEmailForVerification'), 'success');
        // Redirect to verification page
        window.location.href = `verification.html?email=${encodeURIComponent(result.email)}`;
      } else if (result && result.userNotFound) {
        showToast(result.error, 'error');
        // Optionally show register form
      } else if (result && result.error) {
        showToast(result.error, 'error');
      }
    } catch (error) {
      // Silently handle login error - don't log to console
      showToast(t('loginFailed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      setShowRegister(true);
    }
  };

  if (showRegister) {
    return <Register onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="auth-section">
      <div className="auth-language-toggle">
        <button 
          className={`auth-lang-btn ${currentLanguage === 'tr' ? 'active' : ''}`}
          onClick={handleLanguageToggle}
        >
          <span className="lang-en">🇺🇸 EN</span>
          <span className="lang-tr">🇹🇷 TR</span>
        </button>
      </div>
      
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">⚡</div>
          <h2 className="auth-title">{t('welcomeTitle')}</h2>
          <p className="auth-subtitle">{t('welcomeSubtitle')}</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3 className="auth-card-title">{t('loginTitle')}</h3>
            <p className="auth-card-desc">{t('loginDesc')}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="loginEmail" className="form-label">{t('email')}</label>
              <input
                type="email"
                id="loginEmail"
                className="form-input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="loginPassword" className="form-label">{t('password')}</label>
              <input
                type="password"
                id="loginPassword"
                className="form-input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('signingIn') : t('signIn')}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>
            {t('dontHaveAccount')}{' '}
            <a href="javascript:void(0)" onClick={handleShowRegister} className="auth-link">
              {t('signUp')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
