import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppContext } from '../../contexts/AppContext';
import './Settings.css';

// Import apiClient
declare const apiClient: any;

interface ApiSettings {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  sellerId: string;
  marketplace: string;
}

interface Preferences {
  manualCheckEnabled: boolean;
  manualCheckMethod: 'remote' | 'local';
  manualCheckInput: string;
  darkMode: boolean;
  language: 'en' | 'tr';
}

export function Settings() {
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const { currentTheme, toggleTheme } = useTheme();
  const { switchTab } = useAppContext();
  
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    refreshToken: '',
    clientId: '',
    clientSecret: '',
    sellerId: '',
    marketplace: 'US'
  });
  
  const [preferences, setPreferences] = useState<Preferences>({
    manualCheckEnabled: false,
    manualCheckMethod: 'remote',
    manualCheckInput: '',
    darkMode: currentTheme === 'dark',
    language: currentLanguage
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasApiChanges, setHasApiChanges] = useState(false);
  const [isApiSaved, setIsApiSaved] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<ApiSettings>({
    refreshToken: '',
    clientId: '',
    clientSecret: '',
    sellerId: '',
    marketplace: 'US'
  });
  const [showPasswords, setShowPasswords] = useState({
    refreshToken: false,
    clientId: false,
    clientSecret: false,
    sellerId: false
  });

  useEffect(() => {
    if (!isDataLoaded) {
      loadSettings();
    }
  }, [isDataLoaded]);

  // Sync preferences with header controls
  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      darkMode: currentTheme === 'dark'
    }));
  }, [currentTheme]);

  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      language: currentLanguage
    }));
  }, [currentLanguage]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getSettings();
      
      if (result.success) {
        const loadedSettings = result.settings || {
          refreshToken: '',
          clientId: '',
          clientSecret: '',
          sellerId: '',
          marketplace: 'US'
        };

        const loadedPreferences = result.preferences || {
          manualCheckEnabled: false,
          manualCheckMethod: 'remote',
          manualCheckInput: '',
          darkMode: currentTheme === 'dark',
          language: currentLanguage
        };

        setApiSettings(loadedSettings);
        setPreferences(loadedPreferences);
        setOriginalSettings(loadedSettings);
        setHasApiChanges(false);
        setIsApiSaved(true);

        // Check if this is a new user (no settings saved)
        const isNewUser = !result.settings ||
            (!result.settings.refreshToken && !result.settings.clientId && !result.settings.clientSecret && !result.settings.sellerId) ||
            (result.settings && Object.keys(result.settings).length === 0);

        if (isNewUser) {
          // New user: Mark as not saved, will show Save Settings button
          setIsApiSaved(false);
          setHasApiChanges(false);
          showToast(t('pleaseConfigureSettings'), 'info');
        } else {
          // Existing user: Mark as saved
          setIsApiSaved(true);
          setHasApiChanges(false);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast(t('failedToLoadSettings'), 'error');
    } finally {
      setIsLoading(false);
      setIsDataLoaded(true);
    }
  };

  const checkForApiChanges = (newSettings: ApiSettings) => {
    const settingsChanged = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
    setHasApiChanges(settingsChanged);
    // If there are no changes and settings were previously saved, show saved state
    if (!settingsChanged && isApiSaved) {
      setIsApiSaved(true);
    } else if (settingsChanged) {
      setIsApiSaved(false);
    }
  };

  const handleApiSettingsChange = (field: keyof ApiSettings, value: string) => {
    const newSettings = {
      ...apiSettings,
      [field]: value
    };
    setApiSettings(newSettings);
    checkForApiChanges(newSettings);
  };

  const handlePreferencesChange = (field: keyof Preferences, value: any) => {
    const newPreferences = {
      ...preferences,
      [field]: value
    };
    setPreferences(newPreferences);

    // Sync with header controls
    if (field === 'darkMode') {
      // Only toggle if the new value is different from current theme
      if (value !== (currentTheme === 'dark')) {
        toggleTheme();
      }
    } else if (field === 'language') {
      setLanguage(value);
    }

  };

  const handleSaveApiSettings = async () => {
    try {
      setIsSaving(true);
      const result = await apiClient.saveSettings({
        refreshToken: apiSettings.refreshToken,
        clientId: apiSettings.clientId,
        clientSecret: apiSettings.clientSecret,
        sellerId: apiSettings.sellerId,
        marketplace: apiSettings.marketplace
      });
      
      if (result.success) {
        showToast(t('settingsSavedSuccessfully'), 'success');
        // Update original values and mark as saved
        setOriginalSettings(apiSettings);
        setHasApiChanges(false);
        setIsApiSaved(true);
        // Navigate to check tab after successful save
        setTimeout(() => {
          switchTab('check');
        }, 1500);
      } else {
        showToast(result.error || t('failedToSaveSettings'), 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(t('failedToSaveSettings'), 'error');
    } finally {
      setIsSaving(false);
    }
  };


  const togglePasswordVisibility = (field: 'refreshToken' | 'clientId' | 'clientSecret' | 'sellerId') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Settings Header */}
        <div className="settings-header">
          <h2 className="settings-title">{t('spApiConfiguration')}</h2>
          <button
            className={`sp-api-save-btn ${hasApiChanges ? 'enabled' : 'disabled'}`}
            onClick={handleSaveApiSettings}
            disabled={!hasApiChanges || isSaving}
          >
            {isSaving ? t('saving') : (isApiSaved && !hasApiChanges ? '✓ Saved' : 'Save Settings')}
          </button>
        </div>
        
        <div className="settings-section">

          <div className="settings-content">
            <div className="form-group">
              <label htmlFor="refreshToken" className="field-label">{t('refreshToken')}</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.refreshToken ? 'text' : 'password'}
                  id="refreshToken"
                  className="field-input"
                  value={apiSettings.refreshToken}
                  onChange={(e) => handleApiSettingsChange('refreshToken', e.target.value)}
                  placeholder="Atzr|IwEB..."
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => togglePasswordVisibility('refreshToken')}
                >
                  {showPasswords.refreshToken ? (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="clientId" className="field-label">{t('clientId')}</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.clientId ? 'text' : 'password'}
                  id="clientId"
                  className="field-input"
                  value={apiSettings.clientId}
                  onChange={(e) => handleApiSettingsChange('clientId', e.target.value)}
                  placeholder="amzn1.application-oa2-client..."
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => togglePasswordVisibility('clientId')}
                >
                  {showPasswords.clientId ? (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="clientSecret" className="field-label">{t('clientSecret')}</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.clientSecret ? 'text' : 'password'}
                  id="clientSecret"
                  className="field-input"
                  value={apiSettings.clientSecret}
                  onChange={(e) => handleApiSettingsChange('clientSecret', e.target.value)}
                  placeholder="amzn1.oa2-cs-v1..."
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => togglePasswordVisibility('clientSecret')}
                >
                  {showPasswords.clientSecret ? (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="sellerId" className="field-label">{t('sellerId')}</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.sellerId ? 'text' : 'password'}
                  id="sellerId"
                  className="field-input"
                  value={apiSettings.sellerId}
                  onChange={(e) => handleApiSettingsChange('sellerId', e.target.value)}
                  placeholder="A1B2C3D4E5F6G7"
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => togglePasswordVisibility('sellerId')}
                >
                  {showPasswords.sellerId ? (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="marketplace" className="field-label">{t('marketplace')}</label>
              <select
                id="marketplace"
                className="form-select"
                value={apiSettings.marketplace}
                onChange={(e) => handleApiSettingsChange('marketplace', e.target.value)}
              >
                <option value="US">amazon.com</option>
                <option value="CA">amazon.ca</option>
                <option value="MX">amazon.com.mx</option>
                <option value="BR">amazon.com.br</option>
                <option value="DE">amazon.de</option>
                <option value="ES">amazon.es</option>
                <option value="FR">amazon.fr</option>
                <option value="IT">amazon.it</option>
                <option value="NL">amazon.nl</option>
                <option value="GB">amazon.co.uk</option>
                <option value="SE">amazon.se</option>
                <option value="PL">amazon.pl</option>
                <option value="BE">amazon.com.be</option>
                <option value="EG">amazon.eg</option>
                <option value="TR">amazon.com.tr</option>
                <option value="SA">amazon.sa</option>
                <option value="AE">amazon.ae</option>
                <option value="IN">amazon.in</option>
                <option value="JP">amazon.co.jp</option>
                <option value="AU">amazon.com.au</option>
                <option value="SG">amazon.sg</option>
              </select>
            </div>
            
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2 className="section-title">{t('preferences')}</h2>
          </div>
          
          <div className="settings-content">
            <div className="preference-item">
              <div className="preference-label">
                <label htmlFor="manualCheckEnabled" className="preference-text">
                  {t('enableManualCheck')}
                </label>
                <p className="preference-description">
                  {t('enableManualCheckDesc')}
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  id="manualCheckEnabled"
                  checked={preferences.manualCheckEnabled}
                  onChange={(e) => handlePreferencesChange('manualCheckEnabled', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            {preferences.manualCheckEnabled && (
              <div className="manual-check-options">
                <div className="form-group">
                  <label htmlFor="manualCheckMethod" className="field-label">
                    {t('manualCheckMethod')}
                  </label>
                  <select
                    id="manualCheckMethod"
                    className="form-select"
                    value={preferences.manualCheckMethod}
                    onChange={(e) => handlePreferencesChange('manualCheckMethod', e.target.value)}
                  >
                    <option value="remote">{t('remoteComputer')}</option>
                    <option value="local">{t('thisComputer')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="manualCheckInput" className="field-label">
                    {preferences.manualCheckMethod === 'remote' ? t('websocketUrl') : t('localPath')}
                  </label>
                  <input
                    type="text"
                    id="manualCheckInput"
                    className="field-input"
                    value={preferences.manualCheckInput}
                    onChange={(e) => handlePreferencesChange('manualCheckInput', e.target.value)}
                    placeholder={preferences.manualCheckMethod === 'remote' ? t('enterWebsocketUrl') : t('enterLocalPath')}
                  />
                </div>
              </div>
            )}

            {/* Language Selection */}
            <div className="preference-item">
              <div className="preference-label">
                <label className="preference-text">
                  {t('language')}
                </label>
                <p className="preference-description">
                  {t('selectLanguage')}
                </p>
              </div>
              <div className="custom-select-wrapper">
                <select
                  id="languageSelect"
                  className="form-select"
                  value={preferences.language}
                  onChange={(e) => handlePreferencesChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="preference-item">
              <div className="preference-label">
                <label className="preference-text">
                  {t('darkMode')}
                </label>
                <p className="preference-description">
                  {t('darkModeDesc')}
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  id="darkModeToggle"
                  checked={preferences.darkMode}
                  onChange={(e) => handlePreferencesChange('darkMode', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>


        {/* Loading State */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>{t('loading')}</span>
          </div>
        )}
      </div>
    </div>
  );
}