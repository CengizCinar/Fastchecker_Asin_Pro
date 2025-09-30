import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './Verification.css';

interface VerificationProps {
  switchTab?: (tab: string) => void;
}

export function Verification({ switchTab }: VerificationProps) {
  const { verifyEmail, resendVerificationCode, isLoading, error, clearError } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('loading...');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendTimeLeft, setResendTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resendTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Load email from storage
    const loadEmail = async () => {
      try {
        const result = await chrome.storage.local.get(['pendingVerificationEmail']);
        if (result.pendingVerificationEmail) {
          setEmail(result.pendingVerificationEmail);
        }
      } catch (error) {
        console.error('Error loading email:', error);
      }
    };
    
    loadEmail();
  }, []);

  useEffect(() => {
    // Main timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Resend timer
    const resendTimer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(resendTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(resendTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...verificationCode];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setVerificationCode(newCode);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((digit, index) => !digit && index < 6);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const code = verificationCode.join('');
    if (code.length !== 6) return;

    await verifyEmail(code, switchTab);
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    clearError();
    setCanResend(false);
    setResendTimeLeft(60);
    
    await resendVerificationCode(email);
    
    // Restart resend timer with proper cleanup
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }
    
    resendTimerRef.current = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          if (resendTimerRef.current) {
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBackToLogin = async () => {
    try {
      await chrome.storage.local.remove(['pendingVerificationUserId', 'pendingVerificationEmail']);
      window.location.reload();
    } catch (error) {
      console.error('Error clearing storage:', error);
      // Fallback: reload anyway
      window.location.reload();
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(currentLanguage === 'en' ? 'tr' : 'en');
  };

  return (
    <div className="frame">
      <main className="card">
        <section className="max-w-2xl mx-auto verification-content">
          {/* Icon */}
          <div className="icon-wrap">
            <svg className="icon w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
              <polyline points="3 7 12 13 21 7"></polyline>
            </svg>
          </div>

          {/* Header */}
          <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight">{t('verifyYourEmail')}</h1>
          <p className="text-center text-muted-foreground mt-2 text-base md:text-lg">{t('verificationCodeSent')}</p>

          {/* Email Display */}
          <div className="email-banner">
            <span>{t('codeSentTo')}:</span> <span id="verificationEmail">{email}</span>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="mt-2" autoComplete="one-time-code" noValidate>
            {/* Code Input Boxes */}
            <div id="otp" className="otp">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  id={`otp-${index + 1}`}
                  className={`code-box ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  aria-label={`${index + 1}. digit`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading || verificationCode.join('').length !== 6}
            >
              {isLoading ? t('verifying') : t('verifyEmail')}
            </button>

            {/* Timer */}
            <p className="text-center text-muted-foreground font-medium mt-6">{t('codeExpiresIn')}:</p>
            <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
              {formatTime(timeLeft)}
            </div>

            {/* Resend Section */}
            <div className="resend-section">
              <p className="text-center text-muted-foreground">{t('didntReceiveCode')}</p>
              <p className="text-center font-bold">
                <button
                  id="resendBtn"
                  className="underline cursor-pointer text-accent"
                  onClick={handleResend}
                  disabled={!canResend}
                >
                  {t('resendCode')}
                </button>
              </p>
            </div>

            {/* Resend Timer */}
            {!canResend && (
              <div className="resend-timer">
                <span>{t('resendAvailableIn')}</span>
                <span>{resendTimeLeft}</span>s
              </div>
            )}
          </form>

          {/* Back Button */}
          <button 
            id="backToLoginBtn" 
            type="button" 
            className="flex items-center justify-center gap-2 w-full max-w-sm border rounded-2xl px-4 py-4 mx-auto font-semibold"
            onClick={handleBackToLogin}
          >
            <span aria-hidden>←</span> <span>{t('backToLogin')}</span>
          </button>

          {/* Messages */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Timer Expired Message */}
          {timerExpired && (
            <div className="timer-expired-message">
              <div className="message-content">
                <p>{t('verificationCodeExpired')}</p>
                <p>{t('pleaseResendCode')}</p>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <span>{t('verifying')}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
