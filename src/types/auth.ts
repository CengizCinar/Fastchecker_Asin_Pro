export interface User {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
  isVerified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string; requiresVerification?: boolean; message?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  clearError: () => void;
}

export type AuthContextType = AuthState & AuthActions;
