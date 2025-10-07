import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '../types/auth';

// Import the existing authService and apiClient
declare const authService: any;
declare const apiClient: any;

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  isAuthenticated: false,
  currentUser: null,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        currentUser: null,
        error: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if SP-API settings are configured
const checkApiSettingsAndRedirect = async (switchTab?: (tab: string) => void) => {
  try {
    const result = await apiClient.getSettings();
    if (result.success) {
      const settings = result.settings;
      // Check if all required API settings are configured
      const hasApiSettings = settings &&
        settings.refreshToken &&
        settings.clientId &&
        settings.clientSecret &&
        settings.sellerId;

      if (!hasApiSettings && switchTab) {
        // Redirect to settings page if API settings are not configured
        setTimeout(() => {
          switchTab('settings');
        }, 500); // Small delay to allow login success toast to show
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking API settings:', error);
    return true; // Don't redirect on error
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const user = await authService.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
    } catch (error) {
      // Silently handle auth check error - don't log to console
      dispatch({ type: 'SET_ERROR', payload: 'Authentication check failed' });
    }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, switchTab?: (tab: string) => void) => {
    // Don't set global loading state - let component handle its own loading
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        dispatch({ type: 'SET_USER', payload: result.user });

        // Check if SP-API settings are configured after successful login
        await checkApiSettingsAndRedirect(switchTab);

        return { success: true, user: result.user };
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return result; // Return the complete result for requiresVerification and userNotFound handling
      }
    } catch (error) {
      const errorMessage = 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string, switchTab?: (tab: string) => void) => {
    // Don't set global loading state - let component handle its own loading
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const result = await authService.register(email, password);

      if (result.success) {
        if (result.requiresVerification) {
          return { success: true, requiresVerification: true, message: result.message };
        } else {
          dispatch({ type: 'SET_USER', payload: result.user });

          // Check if SP-API settings are configured after successful registration
          await checkApiSettingsAndRedirect(switchTab);

          return { success: true, user: result.user };
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Logout failed' });
    }
  };

  const verifyEmail = async (code: string, switchTab?: (tab: string) => void) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const result = await authService.verifyEmail('', code);

      if (result.success) {
        dispatch({ type: 'SET_USER', payload: result.user });

        // Check if SP-API settings are configured after successful email verification
        await checkApiSettingsAndRedirect(switchTab);

        // Stop loading after redirect check
        dispatch({ type: 'SET_LOADING', payload: false });

        return { success: true, user: result.user };
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Email verification failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const resendVerificationCode = async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const result = await authService.resendVerificationCode(email);
      
      if (result.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to resend verification code' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationCode,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
