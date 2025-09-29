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

export interface SubscriptionData {
  plan: SubscriptionPlan;
  usage: UsageData;
  statistics: UsageStatistics;
  subscription: SubscriptionInfo;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateUsage: (newUsage: number) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!currentUser) {
      setSubscriptionData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 Loading unified subscription data...');

      // Use the new unified subscription data endpoint
      const result = await apiClient.getSubscriptionData();

      console.log('📈 Unified subscription data response:', result);

      if (result.success && result.data) {
        setSubscriptionData(result.data);
        console.log('✅ Subscription data loaded successfully');
      } else {
        console.error('❌ Failed to load subscription data:', result.error);
        setError(result.error || 'Failed to load subscription data');
      }
    } catch (error) {
      console.error('💥 Error loading subscription data:', error);
      setError('Network error while loading subscription data');
    } finally {
      setIsLoading(false);
    }
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
    if (currentUser) {
      refreshData();
    } else {
      setSubscriptionData(null);
      setIsLoading(false);
    }
  }, [currentUser]);

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
    isLoading,
    error,
    refreshData,
    updateUsage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};