import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SubscriptionData, SubscriptionPlan, ApiResponse } from '../../types/api';
import './Subscription.css';

// API Client interface
interface ApiClient {
  getSubscriptionStatus(): Promise<ApiResponse<SubscriptionData>>;
  createCheckoutSession(planId: string): Promise<ApiResponse<{ checkoutUrl: string }>>;
}

declare const apiClient: ApiClient;

// Legacy proje ile birebir uyumlu plan tanımları (kod ve fiyatlar)
const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  'FREE': {
    name: 'Free Plan',
    monthlyLimit: 100,
    price: 0.0,
    stripePriceId: null,
    features: [
      '✓ 100 ASIN checks/month',
      '✓ Manual check enabled',
      '✓ Basic support'
    ]
  },
  'BASIC': {
    name: 'Basic Plan',
    monthlyLimit: 1000,
    price: 9.99,
    stripePriceId: 'price_basic_monthly',
    features: [
      '✓ 1,000 ASIN checks/month',
      '✓ Manual check enabled',
      '✓ CSV export',
      '✓ Email support'
    ]
  },
  'PRO': {
    name: 'Pro Plan',
    monthlyLimit: 5000,
    price: 29.99,
    stripePriceId: 'price_pro_monthly',
    features: [
      '✓ 5,000 ASIN checks/month',
      '✓ Manual check enabled',
      '✓ CSV export',
      '✓ API access',
      '✓ Bulk processing',
      '✓ Priority support'
    ],
    // @ts-ignore - featured bayrağı tasarım için kullanılıyor
    featured: true
  },
  'UNLIMITED': {
    name: 'Unlimited Plan',
    monthlyLimit: -1, // -1 for unlimited
    price: 99.99,
    stripePriceId: 'price_unlimited_monthly',
    features: [
      '✓ Unlimited ASIN checks',
      '✓ Manual check enabled',
      '✓ CSV export',
      '✓ API access',
      '✓ Bulk processing',
      '✓ Priority support'
    ]
  }
};

export function Subscription() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getSubscriptionStatus();
      if (result.success) {
        const data = result.subscription || result.data;
        if (data) {
          setSubscriptionData({
            currentPlan: data.currentPlan?.code || 'FREE',
            planName: data.currentPlan?.name || 'Free Plan',
            planDescription: getPlanDescription(data.currentPlan?.code || 'FREE'),
            monthlyLimit: data.subscription?.usage?.limit || 100,
            usedThisMonth: data.subscription?.usage?.current || 0
          });
        } else {
          setSubscriptionData(null);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
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

  const currentPlan = subscriptionData?.currentPlan || 'FREE';
  
  // Ana projeden alınan planları kullan
  const plans = Object.entries(SUBSCRIPTION_PLANS)
    .filter(([code]) => code !== 'FREE') // Free plan'ı listeden çıkar
    .map(([code, plan]) => ({
      code,
      name: plan.name,
      price: plan.price === 0 ? 'Free' : `$${plan.price}`,
      features: plan.features,
      featured: (plan as any).featured || false
    }));

  return (
    <div className="subscription-container">
      {/* Current Plan */}
      <div className="current-plan-card">
        <div className="plan-header">
          <h3 className="current-plan-title">{t('currentPlan')}</h3>
          <div className="plan-badge-current" id="currentPlanBadge">
            {currentPlan}
          </div>
        </div>
        <div className="plan-details">
          <h4 className="plan-name" id="planName">
            {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.name || t('freePlan')}
          </h4>
          <p className="plan-description" id="planDescription">
            {getPlanDescription(currentPlan)}
          </p>
        </div>
        <div className="usage-stats">
          <div className="stat-item">
            <span className="stat-label">{t('monthlyLimit')}</span>
            <span className="stat-value" id="monthlyLimit">
              {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.monthlyLimit === -1 
                ? '∞' 
                : SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.monthlyLimit || 100}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('usedThisMonth')}</span>
            <span className="stat-value" id="usedThisMonth">
              {subscriptionData?.usedThisMonth || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="plans-section">
        <h3 className="plans-title">{t('availablePlans')}</h3>
        <div className="plans-grid">
          {plans.map((plan) => (
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
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">{feature}</div>
                ))}
              </div>
              <button 
                className={`plan-upgrade-btn ${
                  currentPlan === plan.code ? 'current-plan-btn' : 
                  currentPlan === 'UNLIMITED' && plan.code !== 'UNLIMITED' ? 'downgrade-btn' : ''
                }`}
                onClick={() => handleUpgrade(plan.code)}
                disabled={currentPlan === plan.code}
              >
                <span className="diamond-icon">💎</span>
                <span>
                  {currentPlan === plan.code ? t('currentPlan') :
                   currentPlan === 'UNLIMITED' && plan.code !== 'UNLIMITED' ? `${t('downgradeTo')} ${plan.name}` :
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