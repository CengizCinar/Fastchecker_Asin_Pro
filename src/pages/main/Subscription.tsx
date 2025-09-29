import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  const { currentUser } = useAuth();
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
  const generatePlanDescription = (planCode: string, features: any) => {
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
        <div className="plan-header">
          <h3 className="current-plan-title">{t('currentPlan')}</h3>
          <div className="plan-badge-current" id="currentPlanBadge">
            {currentPlanCode}
          </div>
        </div>
        <div className="plan-details">
          <h4 className="plan-name" id="planName">
            {currentPlan}
          </h4>
          <p className="plan-description" id="planDescription">
            {generatePlanDescription(currentPlanCode, currentFeatures)}
          </p>
        </div>
        <div className="usage-stats">
          <div className="stat-item">
            <span className="stat-label">{t('monthlyLimit')}</span>
            <span className="stat-value" id="monthlyLimit">
              {subscriptionData?.plan?.monthlyLimit === -1
                ? t('unlimited')
                : subscriptionData?.plan?.monthlyLimit || 100}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('usedThisMonth')}</span>
            <span className="stat-value" id="usedThisMonth">
              {subscriptionData?.usage?.current || 0}
            </span>
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
                <button
                  className="upgrade-button"
                  onClick={() => handleUpgrade(plan.code)}
                  disabled={currentPlanCode === plan.code}
                >
                  {currentPlanCode === plan.code ? 'Current Plan' : t('upgrade')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}