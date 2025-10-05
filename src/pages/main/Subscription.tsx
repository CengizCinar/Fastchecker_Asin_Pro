import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useToast } from '../../contexts/ToastContext';
import { useModal } from '../../contexts/ModalContext';
import './Subscription.css';

// API Client interface
interface ApiClient {
  createCheckoutSession(planCode: string): Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  getAvailablePlans(): Promise<{ success: boolean; plans?: any[]; error?: string }>;
  downgradePlan(targetPlan: string): Promise<{ success: boolean; error?: string }>;
  cancelSubscription(): Promise<{ success: boolean; error?: string }>;
  getBillingInfo(): Promise<{ success: boolean; error?: string }>;
  cancelPendingChange(): Promise<{ success: boolean; error?: string; message?: string }>;
}

declare const apiClient: ApiClient;

export function Subscription() {
  const { t, currentLanguage } = useLanguage();
  const { subscriptionData, billingInfo, isLoading, refreshData, hasPendingChange } = useSubscription();
  const { showToast } = useToast();
  const { showModal } = useModal();
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isProcessingPlanChange, setIsProcessingPlanChange] = useState(false);

  useEffect(() => {
    loadAvailablePlans();
  }, []);

  const loadAvailablePlans = async () => {
    try {
      setIsLoadingPlans(true);
      const result = await apiClient.getAvailablePlans();
      if (result.success && result.plans) {
        // Include all plans including FREE and format for display
        const formattedPlans = result.plans
          .map(plan => ({
            code: plan.code,
            name: plan.name,
            price: plan.price === 0 ? t('planFree') : `$${plan.price}`,
            monthlyLimit: plan.monthlyLimit,
            features: plan.features || {},
            featured: plan.code === 'PRO' // Mark PRO as featured
          }));
        setAvailablePlans(formattedPlans);
      }
    } catch (error) {
      console.error('Error loading available plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Generate dynamic description from features JSON
  const generatePlanDescription = (features: any, planCode: string, monthlyLimit: number) => {
    if (!features) return '';

    // For FREE plan, show limit instead of features
    if (planCode === 'FREE') {
      return `${monthlyLimit} ${t('checksPerMonth')}`;
    }

    const featureList = [];

    // Add only plan-specific features (not available in all plans)
    if (features.csv_export) featureList.push(t('csvExport'));
    if (features.monthly_data_export) featureList.push(t('monthlyDataExport'));
    // Skip bulk_processing - available in all plans
    if (features.manual_check) featureList.push(t('manualCheck'));
    if (features.manual_check_support) featureList.push(t('technicalSupport'));

    return featureList.length > 0 ? featureList.join(', ') : t('basicFeatures');
  };

  const getFeatureDisplayList = (features: any, monthlyLimit: number) => {
    if (!features) return [];

    const displayFeatures = [];

    // Add monthly limit as first feature
    if (monthlyLimit === -1) {
      displayFeatures.push(`✓ ${t('unlimited').toUpperCase()} ${t('checks').toUpperCase()}`);
    } else {
      displayFeatures.push(`✓ ${(monthlyLimit || 0).toLocaleString()} ${t('checksPerMonth')}`);
    }

    // Only show plan-specific features (not available in all plans)
    if (features.csv_export) displayFeatures.push(`✓ ${t('csvExport')}`);
    if (features.monthly_data_export) displayFeatures.push(`✓ ${t('monthlyDataExport')}`);
    // Skip bulk_processing - available in all plans
    if (features.manual_check) displayFeatures.push(`✓ ${t('manualCheck')}`);
    if (features.manual_check_support) displayFeatures.push(`✓ ${t('technicalSupport')}`);

    return displayFeatures;
  };

  const handlePlanChange = async (planCode: string) => {
    // Determine if this is an upgrade, downgrade, or cancel
    const isUpgrade = (currentPlanCode === 'FREE' && (planCode === 'PRO' || planCode === 'ELITE')) ||
                     (currentPlanCode === 'PRO' && planCode === 'ELITE');

    const isDowngrade = (currentPlanCode === 'PRO' && planCode === 'FREE') ||
                       (currentPlanCode === 'ELITE' && (planCode === 'FREE' || planCode === 'PRO'));

    // Show confirmation modal for BOTH downgrades AND upgrades
    const planName = availablePlans.find(plan => plan.code === planCode)?.name || planCode;

    if (isDowngrade) {
      const confirmTitle = planCode === 'FREE' ? t('cancelSubscription') : `${planName} ${t('downgradeTo')}`;
      const confirmMessage = planCode === 'FREE'
        ? t('confirmCancelSubscription')
        : t('confirmDowngrade').replace('{planName}', planName);

      showModal({
        title: confirmTitle,
        message: confirmMessage,
        onConfirm: async () => {
          await executePlanChange(planCode, isUpgrade, isDowngrade);
        }
      });
    } else if (isUpgrade) {
      // Show confirmation for upgrades too
      showModal({
        title: `${planName} ${t('upgradeTo')}`,
        message: t('confirmUpgrade').replace('{planName}', planName),
        onConfirm: async () => {
          await executePlanChange(planCode, isUpgrade, isDowngrade);
        }
      });
    }
  };

  const handleCancelPendingChange = () => {
    showModal({
      title: t('cancelPendingChange'),
      message: t('confirmCancelPendingChange'),
      onConfirm: async () => {
        try {
          setIsProcessingPlanChange(true);
          const result = await apiClient.cancelPendingChange();
          if (result.success) {
            showToast(t('pendingChangeCancelledSuccess'), 'success');
            await refreshData();
          } else {
            showToast(result.error || t('failedCancelPendingChange'), 'error');
          }
        } catch (error) {
          console.error('Error cancelling pending change:', error);
          showToast(t('errorProcessingRequest'), 'error');
        } finally {
          setIsProcessingPlanChange(false);
        }
      }
    });
  };

  const executePlanChange = async (planCode: string, isUpgrade: boolean, isDowngrade: boolean) => {
    try {
      setIsProcessingPlanChange(true);

      if (isUpgrade) {
        // Upgrade: Use Stripe checkout
        const result = await apiClient.createCheckoutSession(planCode);
        if (result.success && result.checkoutUrl) {
          chrome.tabs.create({ url: result.checkoutUrl });
          showToast(t('redirectingToPayment'), 'info');
        } else {
          showToast(result.error || t('failedCheckoutSession'), 'error');
        }
      } else if (isDowngrade) {
        // Downgrade or Cancel: Use direct API call
        if (planCode === 'FREE') {
          // Cancel subscription (downgrade to FREE)
          const result = await apiClient.cancelSubscription();
          if (result.success) {
            showToast(t('subscriptionCancelledSuccess'), 'success');
            await refreshData();
          } else {
            showToast(result.error || t('failedCancelSubscription'), 'error');
          }
        } else {
          // Downgrade to paid plan
          const result = await apiClient.downgradePlan(planCode);
          if (result.success) {
            const planName = availablePlans.find(plan => plan.code === planCode)?.name || planCode;
            showToast(t('downgradeScheduledSuccess').replace('{planName}', planName), 'success');
            await refreshData();
          } else {
            showToast(result.error || t('failedScheduleDowngrade'), 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error processing plan change:', error);
      showToast(t('errorProcessingRequest'), 'error');
    } finally {
      setIsProcessingPlanChange(false);
    }
  };

  if (isLoading || isLoadingPlans) {
    return (
      <div className="subscription-container">
        <div className="loading-container">
          {t('loading')}...
        </div>
      </div>
    );
  }

  // Current plan data from subscription context
  const currentPlan = subscriptionData?.plan?.name || 'Free';
  const currentPlanCode = subscriptionData?.plan?.code || 'FREE';
  const currentFeatures = subscriptionData?.plan?.features || {};
  const currentMonthlyLimit = subscriptionData?.plan?.limit || 100;

  return (
    <div className="subscription-container">
      {/* Current Plan */}
      <div className="current-plan-card">
        <div className="plan-status-header">
          <span className="plan-status-label">{t('currentPlan')}</span>
          <div className="plan-code-badge">
            {currentPlanCode}
          </div>
        </div>

        <p className="plan-features-summary">
          {generatePlanDescription(currentFeatures, currentPlanCode, currentMonthlyLimit)}
        </p>

        {/* Billing Information */}
        {currentPlanCode === 'FREE' && subscriptionData?.usage?.resetDate ? (
          <div className="billing-info-compact">
            <span className="billing-days">{t('monthlyReset')}</span>
            <span className="billing-renewal-date">
              {new Date(subscriptionData.usage.resetDate).toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        ) : currentPlanCode !== 'FREE' && billingInfo && billingInfo.remainingDays > 0 && subscriptionData?.subscription?.endDate ? (
          <div className="billing-info-compact">
            <span className="billing-days">{billingInfo.remainingDays} {t('daysRemaining')}</span>
            <span className="billing-renewal-date">
              {t('renewsOn')} {new Date(subscriptionData.subscription.endDate).toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        ) : null}

        {/* Pending Change Info */}
        {billingInfo?.pendingChange && (
          <div className="pending-change-info">
            <span className="pending-icon">⏳</span>
            <span className="pending-text">
              {billingInfo.pendingChange.targetPlan} {t('plan')} {t('scheduled')}
            </span>
          </div>
        )}

        {/* Actions */}
        {currentPlanCode === 'FREE' ? (
          <div className="current-plan-actions">
            <button
              className="action-link upgrade-link"
              onClick={() => handlePlanChange('PRO')}
              disabled={isProcessingPlanChange}
            >
              {isProcessingPlanChange ? t('processing') : `${t('upgradeTo')} Pro`}
            </button>
            <button
              className="action-link upgrade-link"
              onClick={() => handlePlanChange('ELITE')}
              disabled={isProcessingPlanChange}
            >
              {isProcessingPlanChange ? t('processing') : `${t('upgradeTo')} Elite`}
            </button>
          </div>
        ) : (
          <div className="current-plan-actions">
            {!billingInfo?.pendingChange ? (
              <>
                {currentPlanCode === 'ELITE' && (
                  <button
                    className="action-link downgrade-link"
                    onClick={() => handlePlanChange('PRO')}
                    disabled={isProcessingPlanChange}
                  >
                    {isProcessingPlanChange ? t('processing') : `Pro ${t('downgradeTo')}`}
                  </button>
                )}
                <button
                  className="action-link cancel-link"
                  onClick={() => handlePlanChange('FREE')}
                  disabled={isProcessingPlanChange}
                >
                  {isProcessingPlanChange ? t('processing') : t('cancelSubscription')}
                </button>
              </>
            ) : (
              <button
                className="action-link cancel-pending-link"
                onClick={handleCancelPendingChange}
                disabled={isProcessingPlanChange}
              >
                {isProcessingPlanChange ? t('processing') : t('cancelChange')}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Available Plans */}
      <div className="plans-section">
        <h3 className="plans-title">{t('availablePlans')}</h3>
        <div className="plans-grid">
          {availablePlans.map((plan) => (
            <div key={plan.code} className={`plan-card ${currentPlanCode === plan.code ? 'current-user-plan' : ''}`} data-code={plan.code}>
              {plan.featured && (
                <div className="plan-badge">{t('mostPopular')}</div>
              )}
              <div className="plan-card-header">
                <div>
                  <h4 className="plan-card-title">{plan.name}</h4>
                </div>
                <div className="plan-price">
                  {plan.price}{plan.price !== t('planFree') && <span className="price-period">/mo</span>}
                </div>
              </div>
              <div className="plan-features">
                {getFeatureDisplayList(plan.features, plan.monthlyLimit).map((feature, index) => (
                  <div key={index} className="feature-item">
                    {feature}
                  </div>
                ))}
              </div>
              <div className="plan-card-footer">
                {currentPlanCode === plan.code ? (
                  <div className="current-plan-indicator">
                    <div className="current-plan-checkmark">✓</div>
                    <span>{t('currentPlanBadge')}</span>
                  </div>
                ) : hasPendingChange(plan.code) ? (
                  <div className="pending-change-indicator">
                    <div className="pending-change-icon">⏳</div>
                    <span>{t('scheduled')}</span>
                  </div>
                ) : billingInfo?.pendingChange ? (
                  <button
                    className="upgrade-button unavailable"
                    disabled={true}
                  >
                    {t('changeScheduled')}
                  </button>
                ) : (
                  // Only show upgrade buttons (to higher tier)
                  ((currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                   (currentPlanCode === 'PRO' && plan.code === 'ELITE')) ? (
                    <button
                      className="upgrade-button upgrade"
                      onClick={() => handlePlanChange(plan.code)}
                      disabled={isProcessingPlanChange}
                    >
                      {isProcessingPlanChange ? t('processing') : t('upgrade')}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}