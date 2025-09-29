import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import './Subscription.css';

// API Client interface
interface ApiClient {
  createCheckoutSession(planCode: string): Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  getAvailablePlans(): Promise<{ success: boolean; plans?: any[]; error?: string }>;
}

declare const apiClient: ApiClient;

export function Subscription() {
  const { t } = useLanguage();
  const { subscriptionData, isLoading } = useSubscription();
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    loadAvailablePlans();
  }, []);

  const loadAvailablePlans = async () => {
    try {
      setIsLoadingPlans(true);
      const result = await apiClient.getAvailablePlans();
      if (result.success && result.plans) {
        // Filter out FREE plan and format for display
        const formattedPlans = result.plans
          .filter(plan => plan.code !== 'FREE')
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

  const getFeatureDisplayList = (features: any) => {
    if (!features) return [];

    const displayFeatures = [];

    if (features.csv_export) displayFeatures.push('✓ CSV Export');
    if (features.monthly_data_export) displayFeatures.push('✓ Monthly Data Export');
    if (features.bulk_processing) displayFeatures.push('✓ Bulk Processing');
    if (features.manual_check) displayFeatures.push('✓ Manual Check');
    if (features.manual_check_support) displayFeatures.push('✓ Technical Support');

    return displayFeatures;
  };

  const handleUpgrade = async (planCode: string) => {
    try {
      const result = await apiClient.createCheckoutSession(planCode);
      if (result.success && result.checkoutUrl) {
        // Open checkout URL in new tab
        chrome.tabs.create({ url: result.checkoutUrl });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (isLoading || isLoadingPlans) {
    return (
      <div className="subscription-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '16px',
          color: 'hsl(var(--muted-foreground))'
        }}>
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
                <span className="price-period">/{t('perMonth')}</span>
              </>
            ) : (
              <span className="price-free">{t('planFree')}</span>
            )}
          </div>
        </div>

        <div className="usage-overview">
          <div className="usage-bar-container">
            <div className="usage-header">
              <span className="usage-label">{t('usedThisMonth')}</span>
              <span className="usage-numbers">
                {subscriptionData?.usage?.current || 0} / {subscriptionData?.plan?.monthlyLimit === -1
                  ? t('unlimited')
                  : subscriptionData?.plan?.monthlyLimit || 100}
              </span>
            </div>
            {subscriptionData?.plan?.monthlyLimit !== -1 && (
              <div className="usage-bar">
                <div
                  className="usage-progress"
                  style={{
                    width: `${Math.min(100, ((subscriptionData?.usage?.current || 0) / (subscriptionData?.plan?.monthlyLimit || 100)) * 100)}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="plans-section">
        <h3 className="plans-title">{t('availablePlans')}</h3>
        <div className="plans-grid">
          {availablePlans.map((plan) => (
            <div key={plan.code} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && (
                <div className="plan-badge">{t('mostPopular')}</div>
              )}
              <div className="plan-card-header">
                <h4 className="plan-card-title">{plan.name}</h4>
                <div className="plan-price">
                  {plan.price}<span className="price-period">{t('perMonth')}</span>
                </div>
              </div>
              <div className="plan-features">
                <div className="feature-item">
                  {plan.monthlyLimit === -1
                    ? `${t('unlimited')} ${t('checks')}`
                    : `${(plan.monthlyLimit || 0).toLocaleString()} ${t('checks')} ${t('perMonth')}`}
                </div>
                {getFeatureDisplayList(plan.features).map((feature, index) => (
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
                ) : (
                  <button
                    className={`upgrade-button ${
                      // Only show upgrade for higher-tier plans
                      (currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                      (currentPlanCode === 'PRO' && plan.code === 'ELITE')
                        ? 'upgrade' : 'unavailable'
                    }`}
                    onClick={() => handleUpgrade(plan.code)}
                    disabled={
                      // Disable if it's not an upgrade path
                      !((currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                        (currentPlanCode === 'PRO' && plan.code === 'ELITE'))
                    }
                  >
                    {(currentPlanCode === 'FREE' && (plan.code === 'PRO' || plan.code === 'ELITE')) ||
                     (currentPlanCode === 'PRO' && plan.code === 'ELITE')
                      ? t('upgrade')
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