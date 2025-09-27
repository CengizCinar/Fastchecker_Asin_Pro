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

// Plans are now fetched from backend via SubscriptionContext

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
            description: plan.description,
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

  const getPlanDescription = (planCode: string) => {
    const descriptions: Record<string, string> = {
      'FREE': t('freePlanDesc'),
      'BASIC': t('basicPlanDesc'),
      'PRO': t('proPlanDesc'),
      'UNLIMITED': t('unlimitedPlanDesc')
    };
    return descriptions[planCode] || t('freePlanDesc');
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

  const currentPlan = subscriptionData?.plan?.name || 'Free Plan';
  const currentPlanCode = subscriptionData?.plan?.code || 'FREE';

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
            {subscriptionData?.plan?.description || getPlanDescription(currentPlanCode)}
          </p>
        </div>
        <div className="usage-stats">
          <div className="stat-item">
            <span className="stat-label">{t('monthlyLimit')}</span>
            <span className="stat-value" id="monthlyLimit">
              {subscriptionData?.plan?.monthlyLimit === -1
                ? '∞'
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
                  {plan.monthlyLimit === -1 ? 'Unlimited checks' : `${(plan.monthlyLimit || 0).toLocaleString()} checks per month`}
                </div>
                <div className="feature-item">{plan.description}</div>
                {/* Add more features based on plan.features object */}
                {plan.features.manual_check && <div className="feature-item">✓ Manual checking</div>}
                {plan.features.csv_export && <div className="feature-item">✓ CSV export</div>}
                {plan.features.api_access && <div className="feature-item">✓ API access</div>}
                {plan.features.bulk_processing && <div className="feature-item">✓ Bulk processing</div>}
                {plan.features.priority_support && <div className="feature-item">✓ Priority support</div>}
                {plan.features.white_label && <div className="feature-item">✓ White label</div>}
              </div>
              <button
                className={`plan-upgrade-btn ${
                  currentPlanCode === plan.code ? 'current-plan-btn' :
                  currentPlanCode === 'UNLIMITED' && plan.code !== 'UNLIMITED' ? 'downgrade-btn' : ''
                }`}
                onClick={() => handleUpgrade(plan.code)}
                disabled={currentPlanCode === plan.code}
              >
                <span className="diamond-icon">💎</span>
                <span>
                  {currentPlanCode === plan.code ? t('currentPlan') :
                   currentPlanCode === 'UNLIMITED' && plan.code !== 'UNLIMITED' ? `${t('downgradeTo')} ${plan.name}` :
                   `${t('upgradeTo')} ${plan.name}`}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
