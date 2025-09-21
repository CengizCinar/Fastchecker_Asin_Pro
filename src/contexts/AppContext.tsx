import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppContextType } from '../types/app';

interface AppState {
  activeTab: 'check' | 'settings' | 'account' | 'subscription';
  isLoading: boolean;
}

type AppAction =
  | { type: 'SWITCH_TAB'; payload: 'check' | 'settings' | 'account' | 'subscription' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  activeTab: 'check',
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SWITCH_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const switchTab = (tab: 'check' | 'settings' | 'account' | 'subscription') => {
    dispatch({ type: 'SWITCH_TAB', payload: tab });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const value: AppContextType = {
    ...state,
    switchTab,
    setLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
