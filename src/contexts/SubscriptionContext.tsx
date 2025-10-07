import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

declare const apiClient: any;

export interface SubscriptionPlan {
  code: string;
  name: string;
  monthlyLimit: number;
  price: number;
  features: any;
  description?: string;
  isActive: boolean;
}

export interface UsageData {
  current: number;
  limit: number;
  percentage: number;
  resetDate: string;
}

export interface UsageStatistics {
  thisMonth: {
    total: number;
    breakdown: {
      sellable: {
        count: number;
        percentage: number;
      };
      notEligible: {
        count: number;
        percentage: number;
      };
      approvalRequired: {
        count: number;
        percentage: number;
      };
      other: {
        count: number;
        percentage: number;
      };
    };
  };
}

export interface SubscriptionInfo {
  endDate: string;
  isActive: boolean;
}

export interface BillingInfo {
  currentPlan: string;
  subscriptionEndDate: string;
  remainingDays: number;
  pendingChange: {
    targetPlan: string;
    effectiveDate: string;
    status: string;
  } | null;
}

export interface SubscriptionData {
  plan: SubscriptionPlan;
  usage: UsageData;
  statistics: UsageStatistics;
  subscription: SubscriptionInfo;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  billingInfo: BillingInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshBillingInfo: () => Promise<void>;
  updateUsage: (newUsage: number) => void;
  hasPendingChange: (targetPlan: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const refreshBillingInfo = async () => {
    if (!currentUser) {
      setBillingInfo(null);
      return;
    }

    try {
      const result = await apiClient.getBillingInfo();
      if (result.success) {
        setBillingInfo(result);
      }
    } catch (error) {
      console.error('Error loading billing info:', error);
    }
  };

  const refreshData = async () => {
    if (!currentUser) {
      setSubscriptionData(null);
      setBillingInfo(null);
      setIsLoading(false);
      return;
    }

    // Prevent too frequent refreshes (throttle to max once per 5 seconds)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    const MIN_FETCH_INTERVAL = 5000; // 5 seconds

    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log('⏳ Skipping refresh - too soon (last fetch was', timeSinceLastFetch, 'ms ago)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLastFetchTime(now);

      console.log('📊 Loading unified subscription data...');

      // Load both subscription data and billing info in parallel
      const [subscriptionResult, billingResult] = await Promise.all([
        apiClient.getSubscriptionData(),
        apiClient.getBillingInfo()
      ]);

      console.log('📈 Unified subscription data response:', subscriptionResult);

      if (subscriptionResult.success && subscriptionResult.data) {
        setSubscriptionData(subscriptionResult.data);
        console.log('✅ Subscription data loaded successfully');
      } else {
        console.error('❌ Failed to load subscription data:', subscriptionResult.error);
        setError(subscriptionResult.error || 'Failed to load subscription data');
      }

      if (billingResult.success) {
        setBillingInfo(billingResult);
      }
    } catch (error) {
      console.error('💥 Error loading subscription data:', error);
      setError('Network error while loading subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPendingChange = (targetPlan: string): boolean => {
    return billingInfo?.pendingChange?.targetPlan === targetPlan;
  };

  const updateUsage = (newUsage: number) => {
    if (subscriptionData) {
      setSubscriptionData(prev => {
        if (!prev) return null;

        const updatedUsage = {
          ...prev.usage,
          current: newUsage,
          percentage: prev.usage.limit > 0 ? Math.round((newUsage / prev.usage.limit) * 100) : 0
        };

        return {
          ...prev,
          usage: updatedUsage
        };
      });

      // Dispatch event for other components that might be listening
      window.dispatchEvent(new CustomEvent('usageUpdated', {
        detail: { current: newUsage }
      }));
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshData();
    } else {
      setSubscriptionData(null);
      setIsLoading(false);
    }
    // Only trigger when user ID changes, not the entire user object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Listen for usage updates from other parts of the app
  useEffect(() => {
    const handleUsageUpdate = (event: CustomEvent) => {
      const { current } = event.detail;
      if (typeof current === 'number') {
        updateUsage(current);
      }
    };

    window.addEventListener('usageUpdated', handleUsageUpdate as EventListener);

    return () => {
      window.removeEventListener('usageUpdated', handleUsageUpdate as EventListener);
    };
  }, []); // Remove subscriptionData dependency to prevent infinite loop

  const value: SubscriptionContextType = {
    subscriptionData,
    billingInfo,
    isLoading,
    error,
    refreshData,
    refreshBillingInfo,
    updateUsage,
    hasPendingChange
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};