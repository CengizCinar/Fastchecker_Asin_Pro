import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useToast } from '../../contexts/ToastContext';
import './Subscription.css';

// API Client interface
interface ApiClient {
  createCheckoutSession(planCode: string): Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  getAvailablePlans(): Promise<{ success: boolean; plans?: any[]; error?: string }>;
  downgradePlan(targetPlan: string): Promise<{ success: boolean; error?: string }>;
  cancelSubscription(): Promise<{ success: boolean; error?: string }>;
  getBillingInfo(): Promise<{ success: boolean; error?: string }>;
}

declare const apiClient: ApiClient;

export function Subscription() {
  const { t } = useLanguage();
  const { subscriptionData, billingInfo, isLoading, refreshData, hasPendingChange } = useSubscription();
  const { showToast } = useToast();
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
            price: plan.price === 0 ? 'Free' : `$${plan.price}`,
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
  const generatePlanDescription = (features: any) => {
    if (!features) return '';

    const featureList = [];

    // Add features based on JSON
    if (features.csv_export) featureList.push('CSV Export');
    if (features.monthly_data_export) featureList.push('Monthly Data Export');
    if (features.bulk_processing) featureList.push('Bulk Processing');
    if (features.manual_check) featureList.push('Manual Check Support');
    if (features.manual_check_support) featureList.push('Technical Support');

    return featureList.length > 0 ? featureList.join(', ') : 'Basic features';
  };

  const getFeatureDisplayList = (features: any, monthlyLimit: number) => {
    if (!features) return [];

    const displayFeatures = [];

    // Add monthly limit as first feature
    if (monthlyLimit === -1) {
      displayFeatures.push(`✓ ${t('unlimited')} ${t('checks')}`);
    } else {
      displayFeatures.push(`✓ ${(monthlyLimit || 0).toLocaleString()} ${t('checks')} mo`);
    }

    if (features.csv_export) displayFeatures.push('✓ CSV Export');
    if (features.monthly_data_export) displayFeatures.push('✓ Monthly Data Export');
    if (features.bulk_processing) displayFeatures.push('✓ Bulk Processing');
    if (features.manual_check) displayFeatures.push('✓ Manual Check');
    if (features.manual_check_support) displayFeatures.push('✓ Technical Support');

    return displayFeatures;
  };

  const handlePlanChange = async (planCode: string) => {
    try {
      setIsProcessingPlanChange(true);

      // Determine if this is an upgrade, downgrade, or cancel
      const isUpgrade = (currentPlanCode === 'FREE' && (planCode === 'PRO' || planCode === 'ELITE')) ||
                       (currentPlanCode === 'PRO' && planCode === 'ELITE');

      const isDowngrade = (currentPlanCode === 'PRO' && planCode === 'FREE') ||
                         (currentPlanCode === 'ELITE' && (planCode === 'FREE' || planCode === 'PRO'));

      if (isUpgrade) {
        // Upgrade: Use Stripe checkout
        const result = await apiClient.createCheckoutSession(planCode);
        if (result.success && result.checkoutUrl) {
          chrome.tabs.create({ url: result.checkoutUrl });
          showToast('Redirecting to payment page...', 'info');
        } else {
          showToast(result.error || 'Failed to create checkout session', 'error');
        }
      } else if (isDowngrade) {
        // Downgrade or Cancel: Use direct API call
        if (planCode === 'FREE') {
          // Cancel subscription (downgrade to FREE)
          const result = await apiClient.cancelSubscription();
          if (result.success) {
            showToast('Subscription cancelled successfully! You will be downgraded to Free plan at the end of your billing cycle.', 'success');
            // Refresh subscription data to show updated status
            await refreshData();
          } else {
            showToast(result.error || 'Failed to cancel subscription', 'error');
          }
        } else {
          // Downgrade to paid plan
          const result = await apiClient.downgradePlan(planCode);
          if (result.success) {
            const planName = availablePlans.find(plan => plan.code === planCode)?.name || planCode;
            showToast(`Plan downgrade to ${planName} scheduled successfully! Change will take effect at the end of your billing cycle.`, 'success');
            // Refresh subscription data to show updated status
            await refreshData();
          } else {
            showToast(result.error || 'Failed to schedule downgrade', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error processing plan change:', error);
      showToast('An error occurred while processing your request', 'error');
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

  return (
    <div className="subscription-container">
      {/* Current Plan */}
      <div className="current-plan-card">
        <div className="plan-status-header">
          <div className="plan-status-badge">
            <div className="status-dot"></div>
            <span>{t('currentPlan')}</span>
          </div>
          <div className="plan-code-badge">
            {currentPlanCode}
          </div>
        </div>

        <div className="plan-overview">
          <div className="plan-info">
            <h2 className="plan-title">{currentPlan}</h2>
            <p className="plan-features">
              {generatePlanDescription(currentFeatures)}
            </p>
          </div>

          <div className="plan-price">
            {subscriptionData?.plan?.price ? (
              <>
                <span className="price-amount">${subscriptionData.plan.price}</span>
                <span className="price-period">/mo</span>
              </>
            ) : (
              <span className="price-free">{t('planFree')}</span>
            )}
          </div>
        </div>

        {/* Billing Information */}
        {billingInfo && (
          <div className="billing-info">
            {billingInfo.remainingDays > 0 && (
              <div className="billing-item">
                <span className="billing-label">⏰ Billing Cycle:</span>
                <span className="billing-value">{billingInfo.remainingDays} days remaining</span>
              </div>
            )}
            {billingInfo.pendingChange && (
              <div className="billing-item pending-change">
                <span className="billing-label">📅 Scheduled Change:</span>
                <span className="billing-value">
                  {billingInfo.pendingChange.targetPlan} plan
                  {billingInfo.pendingChange.effectiveDate &&
                    ` on ${new Date(billingInfo.pendingChange.effectiveDate).toLocaleDateString()}`
                  }
                </span>
              </div>
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
                  {plan.price}{plan.price !== 'Free' && <span className="price-period">/mo</span>}
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
                    <span>Current Plan</span>
                  </div>
                ) : hasPendingChange(plan.code) ? (
                  <div className="pending-change-indicator">
                    <div className="pending-change-icon">⏳</div>
                    <span>Scheduled</span>
                  </div>
                ) : (
                  <button
                    className={`upgrade-button ${
                      // Upgrade path (to higher tier)
                      (currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                      (currentPlanCode === 'PRO' && plan.code === 'ELITE')
                        ? 'upgrade'
                      // Downgrade path (to lower tier)
                      : (currentPlanCode === 'PRO' && plan.code === 'FREE') ||
                        (currentPlanCode === 'ELITE' && (plan.code === 'FREE' || plan.code === 'PRO'))
                        ? 'downgrade'
                        : 'unavailable'
                    }`}
                    onClick={() => handlePlanChange(plan.code)}
                    disabled={isProcessingPlanChange}
                  >
                    {isProcessingPlanChange
                      ? 'Processing...'
                      : (currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                        (currentPlanCode === 'PRO' && plan.code === 'ELITE')
                      ? t('upgrade')
                      : (currentPlanCode === 'PRO' && plan.code === 'FREE') ||
                        (currentPlanCode === 'ELITE' && (plan.code === 'FREE' || plan.code === 'PRO'))
                      ? plan.code === 'FREE' ? 'Cancel Subscription' : 'Downgrade'
                      : 'Not Available'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}