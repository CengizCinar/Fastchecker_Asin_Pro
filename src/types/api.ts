// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  subscription?: T; // For subscription API
  error?: string;
  message?: string;
}

// Subscription Types
export interface SubscriptionData {
  currentPlan: {
    name: string;
    code: string;
    limit: number;
  };
  usage?: {
    current: number;
    limit: number;
  };
  // Legacy fields for backward compatibility
  planName?: string;
  monthlyLimit?: number;
  usedThisMonth?: number;
}

export interface SubscriptionPlan {
  name: string;
  monthlyLimit: number;
  price: number;
  stripePriceId: string | null;
  features: string[];
  featured?: boolean;
}

// Usage Stats Types
export interface UsageStats {
  totalChecks: number;
  monthlyChecks: number;
  remainingChecks: number;
  currentUsage: number;
  monthlyLimit: number;
  lastCheckDate?: string;
}

// ASIN Result Types
export interface AsinResult {
  asin: string;
  title: string;
  price: string;
  availability: string;
  seller: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  brand?: string;
  status?: string;
  message?: string;
  image?: string;
}

// API Settings Types
export interface ApiSettings {
  sellerId: string;
  marketplaceId: string;
  accessKey: string;
  secretKey: string;
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
  marketplace?: string;
}

// Chrome Storage Types
export interface ChromeStorageData {
  pendingVerificationUserId?: string;
  pendingVerificationEmail?: string;
  [key: string]: any;
}

// Verification Types
export interface VerificationCode {
  code: string[];
  email: string;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}