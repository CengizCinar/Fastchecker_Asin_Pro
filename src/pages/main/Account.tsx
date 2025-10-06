import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useModal } from '../../contexts/ModalContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
// No custom CSS - Pure Tailwind

// Import apiClient
declare const apiClient: any;

interface UsageStats {
  current: number;
  limit: number;
  successRate: number;
  sellable?: number;
  notEligible?: number;
  approvalRequired?: number;
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
  const { subscriptionData, isLoading: isLoadingSubscription, refreshData } = useSubscription();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    current: 0,
    limit: 0,
    successRate: 0,
    sellable: 0,
    notEligible: 0,
    approvalRequired: 0
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
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

  // Helper method to get clean plan name without "PLAN" suffix
  const getTranslatedPlanName = (planName: string) => {
    console.log('🏷️ Account: Translating plan name:', planName);

    // Map backend plan names to clean translation keys
    const planKeyMap: Record<string, string> = {
      'Free': 'FREE',
      'Pro': 'PRO',
      'Elite': 'ELITE'
    };

    const cleanName = planKeyMap[planName];
    if (cleanName) {
      console.log('🏷️ Account: Plan name result:', cleanName);
      return cleanName;
    }

    // Fallback: remove "Plan" and uppercase
    const result = planName.replace(/\s*Plan\s*/i, '').toUpperCase();
    console.log('🏷️ Account: Plan name fallback result:', result);
    return result;
  };

  useEffect(() => {
    if (currentUser && !isDataLoaded) {
      loadAccountData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Only run when currentUser changes, not isDataLoaded

  const loadAccountData = async () => {
    try {
      setIsLoading(true);

      // Load user profile (usage stats now come from SubscriptionContext)
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
      const result = await apiClient.exportUserData(currentLanguage);
      
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
    const limit = subscriptionData?.usage?.limit || 0;
    const current = subscriptionData?.usage?.current || 0;
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getSuccessRatePercentage = () => {
    const rate = Number(usageStats.successRate || 0);
    return Math.round(rate * 100);
  };

  // Store backend percentages for efficient access (no longer needed since using subscription context)
  const [backendPercentages, setBackendPercentages] = useState({
    sellable: 0,
    notEligible: 0,
    approvalRequired: 0
  });

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      maxWidth: '425px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Optimized for 425px width sidepanel */}
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Account Profile */}
          <div style={{
            background: 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(220, 14%, 99%))',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px hsl(220, 13%, 91%, 0.3), 0 2px 4px -2px hsl(220, 13%, 91%, 0.3)',
            border: '0',
            animation: 'fadeIn 0.5s ease-in-out'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              padding: '24px 24px 16px 24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'hsl(222, 47%, 11%)',
                margin: 0
              }}>
                {t('accountOverview')}
              </h3>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                  padding: '0 12px',
                  background: 'hsl(0, 84%, 60%)',
                  color: 'hsl(0, 0%, 98%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                {t('logout')}
              </button>
            </div>
            <div style={{ padding: '0 24px 16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    height: '56px',
                    width: '56px',
                    background: 'hsl(220, 14%, 96%)',
                    border: '2px solid hsl(220, 13%, 91%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px 0 hsl(220, 13%, 91%, 0.3), 0 1px 2px -1px hsl(220, 13%, 91%, 0.3)'
                  }}>
                    <svg style={{ width: '24px', height: '24px', color: 'hsl(215, 20%, 65%)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    height: '20px',
                    padding: '0 6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'hsl(159, 100%, 42%)',
                    color: 'hsl(0, 0%, 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 0 20px hsl(159, 84%, 65%, 0.3)',
                    border: '0',
                    minWidth: 'max-content'
                  }}>
                    {getTranslatedPlanName(subscriptionData?.plan?.name || userProfile?.plan || 'Free Plan')}
                  </div>
                </div>
                <div style={{ flex: '1', minWidth: '0' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'hsl(222, 47%, 11%)',
                    marginBottom: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getDisplayName()}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'hsl(215, 20%, 65%)',
                    marginBottom: '0',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {userProfile?.email || currentUser?.email || 'user@example.com'}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'hsl(215, 20%, 65%)',
                    marginTop: '4px'
                  }}>
                    {t('memberSince')}: {getMemberSince()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div style={{
            background: 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(220, 14%, 99%))',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px hsl(220, 13%, 91%, 0.3), 0 2px 4px -2px hsl(220, 13%, 91%, 0.3)',
            border: '0',
            animation: 'fadeIn 0.5s ease-in-out'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              padding: '24px 24px 16px 24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'hsl(222, 47%, 11%)',
                margin: 0
              }}>
                <svg style={{ width: '20px', height: '20px', color: 'hsl(159, 100%, 42%)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                {t('usageStatistics')}
              </h3>
              <div style={{
                background: 'hsl(220, 14%, 96%)',
                color: 'hsl(222, 47%, 11%)',
                fontSize: '12px',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                {t('thisMonth')}
              </div>
            </div>
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* ASINs Checked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    {t('asinsChecked')}
                  </span>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    {(subscriptionData?.usage?.current || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(215, 20%, 65%)'
                  }}>
                    {subscriptionData?.usage?.limit === -1 ? '∞ limit' : `${(subscriptionData?.usage?.limit || 0).toLocaleString()} limit`}
                  </span>
                </div>
              </div>

              {/* Sellable */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    SELLABLE
                  </span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    {(subscriptionData?.statistics?.thisMonth?.breakdown?.sellable?.count || 0).toLocaleString()} ({Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.sellable?.percentage || 0)}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'hsl(220, 14%, 96%)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.sellable?.percentage || 0)}%`,
                    background: '#22c55e',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {/* Not Eligible */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    NOT ELIGIBLE
                  </span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    {(subscriptionData?.statistics?.thisMonth?.breakdown?.notEligible?.count || 0).toLocaleString()} ({Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.notEligible?.percentage || 0)}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'hsl(220, 14%, 96%)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.notEligible?.percentage || 0)}%`,
                    background: '#ef4444',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {/* Approval Required */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    APPROVAL REQUIRED
                  </span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'hsl(222, 47%, 11%)'
                  }}>
                    {(subscriptionData?.statistics?.thisMonth?.breakdown?.approvalRequired?.count || 0).toLocaleString()} ({Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.approvalRequired?.percentage || 0)}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'hsl(220, 14%, 96%)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(subscriptionData?.statistics?.thisMonth?.breakdown?.approvalRequired?.percentage || 0)}%`,
                    background: '#f97316',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div style={{
            background: 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(220, 14%, 99%))',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px hsl(220, 13%, 91%, 0.3), 0 2px 4px -2px hsl(220, 13%, 91%, 0.3)',
            border: '0',
            animation: 'fadeIn 0.5s ease-in-out'
          }}>
            <div style={{ padding: '24px 24px 0 24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'hsl(222, 47%, 11%)',
                margin: 0
              }}>
                {t('accountSettings')}
              </h3>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email Settings */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'hsl(220, 14%, 96%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'hsl(222, 47%, 11%)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(220, 14%, 93%)';
                    e.currentTarget.style.borderColor = 'hsl(159, 100%, 42%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'hsl(220, 14%, 96%)';
                    e.currentTarget.style.borderColor = 'hsl(220, 13%, 91%)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg style={{ width: '16px', height: '16px', color: 'hsl(159, 100%, 42%)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>{t('changeEmail')}</span>
                  </div>
                  <svg
                    style={{
                      width: '16px',
                      height: '16px',
                      color: 'hsl(215, 20%, 65%)',
                      transition: 'transform 0.2s ease',
                      transform: showEmailForm ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
                {showEmailForm && (
                  <div style={{ marginTop: '12px' }}>
                    <form onSubmit={handleEmailChange} style={{
                      padding: '16px',
                      background: 'hsl(220, 14%, 96%, 0.3)',
                      borderRadius: '8px',
                      border: '1px solid hsl(220, 13%, 91%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('currentEmail')}
                        </label>
                        <input
                          type="email"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(220, 14%, 96%, 0.5)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(215, 20%, 65%)',
                            fontSize: '14px'
                          }}
                          value={userProfile?.email || ''}
                          readOnly
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('newEmail')}
                        </label>
                        <input
                          type="email"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(222, 47%, 11%)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                          placeholder={t('enterNewEmail')}
                          required
                          onFocus={(e) => {
                            e.target.style.borderColor = 'hsl(159, 100%, 42%)';
                            e.target.style.outline = '2px solid hsl(159, 100%, 42%, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'hsl(220, 13%, 91%)';
                            e.target.style.outline = 'none';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('currentPassword')}
                        </label>
                        <input
                          type="password"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(222, 47%, 11%)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          value={emailForm.currentPassword}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder={t('enterCurrentPassword')}
                          required
                          onFocus={(e) => {
                            e.target.style.borderColor = 'hsl(159, 100%, 42%)';
                            e.target.style.outline = '2px solid hsl(159, 100%, 42%, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'hsl(220, 13%, 91%)';
                            e.target.style.outline = 'none';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                        <button
                          type="submit"
                          style={{
                            flex: '1',
                            height: '36px',
                            padding: '0 16px',
                            background: 'hsl(159, 100%, 42%)',
                            color: 'hsl(0, 0%, 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            opacity: isUpdatingEmail ? 0.7 : 1
                          }}
                          disabled={isUpdatingEmail}
                          onMouseEnter={(e) => {
                            if (!isUpdatingEmail) {
                              e.currentTarget.style.background = 'hsl(159, 100%, 38%)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUpdatingEmail) {
                              e.currentTarget.style.background = 'hsl(159, 100%, 42%)';
                            }
                          }}
                        >
                          {isUpdatingEmail && (
                            <svg style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          )}
                          {isUpdatingEmail ? t('updating') : t('updateEmail')}
                        </button>
                        <button
                          type="button"
                          style={{
                            flex: '1',
                            height: '36px',
                            padding: '0 16px',
                            background: 'hsl(220, 14%, 96%)',
                            color: 'hsl(222, 47%, 11%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setShowEmailForm(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'hsl(220, 14%, 93%)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'hsl(220, 14%, 96%)';
                          }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Password Settings */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'hsl(220, 14%, 96%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'hsl(222, 47%, 11%)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(220, 14%, 93%)';
                    e.currentTarget.style.borderColor = 'hsl(159, 100%, 42%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'hsl(220, 14%, 96%)';
                    e.currentTarget.style.borderColor = 'hsl(220, 13%, 91%)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg style={{ width: '16px', height: '16px', color: 'hsl(159, 100%, 42%)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>{t('changePassword')}</span>
                  </div>
                  <svg
                    style={{
                      width: '16px',
                      height: '16px',
                      color: 'hsl(215, 20%, 65%)',
                      transition: 'transform 0.2s ease',
                      transform: showPasswordForm ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
                {showPasswordForm && (
                  <div style={{ marginTop: '12px' }}>
                    <form onSubmit={handlePasswordChange} style={{
                      padding: '16px',
                      background: 'hsl(220, 14%, 96%, 0.3)',
                      borderRadius: '8px',
                      border: '1px solid hsl(220, 13%, 91%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('currentPassword')}
                        </label>
                        <input
                          type="password"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(222, 47%, 11%)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder={t('enterCurrentPassword')}
                          required
                          onFocus={(e) => {
                            e.target.style.borderColor = 'hsl(159, 100%, 42%)';
                            e.target.style.outline = '2px solid hsl(159, 100%, 42%, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'hsl(220, 13%, 91%)';
                            e.target.style.outline = 'none';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('newPassword')}
                        </label>
                        <input
                          type="password"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(222, 47%, 11%)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder={t('enterNewPassword')}
                          required
                          onFocus={(e) => {
                            e.target.style.borderColor = 'hsl(159, 100%, 42%)';
                            e.target.style.outline = '2px solid hsl(159, 100%, 42%, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'hsl(220, 13%, 91%)';
                            e.target.style.outline = 'none';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(222, 47%, 11%)'
                        }}>
                          {t('confirmNewPassword')}
                        </label>
                        <input
                          type="password"
                          style={{
                            height: '40px',
                            padding: '0 12px',
                            background: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            color: 'hsl(222, 47%, 11%)',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={t('confirmNewPasswordPlaceholder')}
                          required
                          onFocus={(e) => {
                            e.target.style.borderColor = 'hsl(159, 100%, 42%)';
                            e.target.style.outline = '2px solid hsl(159, 100%, 42%, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'hsl(220, 13%, 91%)';
                            e.target.style.outline = 'none';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                        <button
                          type="submit"
                          style={{
                            flex: '1',
                            height: '36px',
                            padding: '0 16px',
                            background: 'hsl(159, 100%, 42%)',
                            color: 'hsl(0, 0%, 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            opacity: isUpdatingPassword ? 0.7 : 1
                          }}
                          disabled={isUpdatingPassword}
                          onMouseEnter={(e) => {
                            if (!isUpdatingPassword) {
                              e.currentTarget.style.background = 'hsl(159, 100%, 38%)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUpdatingPassword) {
                              e.currentTarget.style.background = 'hsl(159, 100%, 42%)';
                            }
                          }}
                        >
                          {isUpdatingPassword && (
                            <svg style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          )}
                          {isUpdatingPassword ? t('updating') : t('updatePassword')}
                        </button>
                        <button
                          type="button"
                          style={{
                            flex: '1',
                            height: '36px',
                            padding: '0 16px',
                            background: 'hsl(220, 14%, 96%)',
                            color: 'hsl(222, 47%, 11%)',
                            border: '1px solid hsl(220, 13%, 91%)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setShowPasswordForm(false)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'hsl(220, 14%, 93%)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'hsl(220, 14%, 96%)';
                          }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Data Export */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.3), 0 8px 25px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ padding: '24px 24px 16px 24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg style={{ width: '20px', height: '20px', color: '#00d4aa' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                {t('exportData')}
              </h3>
            </div>
            <div style={{ padding: '0 24px 24px 24px' }}>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                {t('exportAsinDescription')}
              </p>
              <button
                style={{
                  height: '46px',
                  padding: '0 20px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  opacity: isExporting ? 0.7 : 1,
                  width: '100%'
                }}
                onClick={handleExportData}
                disabled={isExporting}
                onMouseEnter={(e) => {
                  if (!isExporting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExporting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                {isExporting ? (
                  <>
                    <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    {t('exporting')}
                  </>
                ) : (
                  <>
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {t('downloadCsv')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              zIndex: 1000
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                {t('loading')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}