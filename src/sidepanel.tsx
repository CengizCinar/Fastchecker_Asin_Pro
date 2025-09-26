import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ModalProvider } from './contexts/ModalContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Header } from './components/layout/Header';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Verification } from './pages/auth/Verification';
import { MainApp } from './pages/main/MainApp';
import './styles/common.css';
import './styles/layout.css';
import './components/layout/Header.css';
import './styles/auth.css';
import './styles/main.css';

function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <AppProvider>
                  <AppContent />
                </AppProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ModalProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  
  // Check if user needs verification
  const [needsVerification, setNeedsVerification] = React.useState(false);
  
  React.useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const result = await chrome.storage.local.get(['pendingVerificationEmail']);
        if (result.pendingVerificationEmail) {
          setNeedsVerification(true);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        // Fallback: assume no verification needed
        setNeedsVerification(false);
      }
    };
    
    checkVerificationStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="app-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '16px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="app-container">
        <div className="main-content auth-mode">
          <Verification />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="main-content auth-mode">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header showNavigation={true} />
      <div className="main-content">
        <MainApp />
      </div>
    </div>
  );
}

export default App;

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
