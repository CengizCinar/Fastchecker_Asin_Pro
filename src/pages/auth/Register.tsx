import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import './Register.css'; // Use Register-specific styles

interface RegisterProps {
  onSwitchToLogin?: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const { register, isLoading, error, clearError } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageToggle = () => {
    setLanguage(currentLanguage === 'en' ? 'tr' : 'en');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password || !confirmPassword) {
      showToast(t('pleaseFillAllFields'), 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast(t('passwordsDoNotMatch'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(email, password);
      
      if (result && result.success) {
        if (result.requiresVerification) {
          // Store email for verification and redirect
          await chrome.storage.local.set({ pendingVerificationEmail: result.email });
          showToast(t('pleaseCheckEmailForVerification'), 'success');
          // Redirect to verification page
          window.location.href = `verification.html?email=${encodeURIComponent(result.email)}`;
        } else {
          showToast(t('registrationSuccessful'), 'success');
        }
      } else if (result && result.error) {
        showToast(result.error, 'error');
      }
    } catch (error) {
      // Silently handle registration error - don't log to console
      showToast(t('registrationFailed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  return (
    <div className="register-view">
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
          <h2 className="auth-title">
            {t('createAccount')}
          </h2>
          <p className="auth-subtitle">
            {t('createAccountSubtitle')}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h3 className="auth-card-title">{t('registerTitle')}</h3>
            <p className="auth-card-desc">
              {t('registerDesc')}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="registerEmail" className="form-label">{t('email')}</label>
              <input
                type="email"
                id="registerEmail"
                className="form-input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="registerPassword" className="form-label">{t('password')}</label>
              <input
                type="password"
                id="registerPassword"
                className="form-input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="registerConfirmPassword" className="form-label">{t('confirmPassword')}</label>
              <input
                type="password"
                id="registerConfirmPassword"
                className="form-input"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('creatingAccount') : t('createAccountBtn')}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>
            {t('alreadyHaveAccount')}{' '}
            <a href="javascript:void(0)" onClick={handleShowLogin} className="auth-link">
              {t('signInLink')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}