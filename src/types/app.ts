export interface AppState {
  activeTab: 'check' | 'settings' | 'account' | 'subscription';
  isLoading: boolean;
}

export interface AppActions {
  switchTab: (tab: 'check' | 'settings' | 'account' | 'subscription') => void;
  setLoading: (loading: boolean) => void;
}

export type AppContextType = AppState & AppActions;

