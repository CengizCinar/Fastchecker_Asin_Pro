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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

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

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordReset(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !newPassword) {
      showToast(t('pleaseFillAllFields'), 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast(t('passwordMinLength'), 'error');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('https://professionalfastchecker-production.up.railway.app/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      showToast(t('resetPasswordSuccess'), 'success');
      setShowPasswordReset(false);
      setResetEmail('');
      setNewPassword('');

    } catch (error) {
      showToast(error.message || 'Password reset failed', 'error');
    } finally {
      setIsResetting(false);
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
              <div className="form-forgot-password">
                <a href="javascript:void(0)" onClick={handleForgotPassword} className="auth-link">
                  {t('forgotPassword')}
                </a>
              </div>
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

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <h3>{t('resetPassword')}</h3>
              <button
                className="auth-modal-close"
                onClick={() => setShowPasswordReset(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="auth-form">
              <div className="form-group">
                <label htmlFor="resetEmail" className="form-label">{t('email')}</label>
                <input
                  type="email"
                  id="resetEmail"
                  className="form-input"
                  placeholder={t('emailPlaceholder')}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isResetting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">{t('newPassword')}</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-input"
                  placeholder={t('enterNewPasswordReset')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isResetting}
                  minLength={8}
                />
                <small className="form-help-text">
                  {t('passwordMinLength')}
                </small>
              </div>

              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-btn secondary"
                  onClick={() => setShowPasswordReset(false)}
                  disabled={isResetting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="auth-btn primary"
                  disabled={isResetting}
                >
                  {isResetting ? t('resetting') : t('resetPassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
