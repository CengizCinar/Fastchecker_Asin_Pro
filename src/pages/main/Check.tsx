import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useModal } from '../../contexts/ModalContext';
import './Check.css';

// Import apiClient and authService
declare const apiClient: any;
declare const authService: any;

interface CheckResult {
  asin: string;
  title?: string;
  brand?: string;
  status: string;
  detailedStatus?: string;
  sellable?: boolean;
  error?: string;
  details?: {
    title?: string;
    brand?: string;
    itemName?: string;
    brandName?: string;
    imageUrl?: string;
  };
  imageUrl?: string;
}

export function Check() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { showModal } = useModal();
  
  const [asinInput, setAsinInput] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'insertion' | 'asin' | 'status' | 'title'>('insertion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasValidSettings, setHasValidSettings] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, success: 0, warning: 0, error: 0 });

  useEffect(() => {
    checkSettings();
  }, []);

  const checkSettings = async () => {
    try {
      const result = await apiClient.getSettings();
      if (result.success && result.settings) {
        const settings = result.settings;
        const isValid = settings.refreshToken && 
                       settings.clientId && 
                       settings.clientSecret && 
                       settings.sellerId && 
                       settings.marketplace;
        setHasValidSettings(!!isValid);
      } else {
        setHasValidSettings(false);
      }
    } catch (error) {
      console.error('Error checking settings:', error);
      setHasValidSettings(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAsinInput(e.target.value);
  };

  const handleCheckAsins = async () => {
    if (!asinInput.trim()) {
      showToast(t('enterAtLeastOneAsin'), 'error');
      return;
    }

    const asins = asinInput
      .split(/[\s,]+/)
      .map(asin => asin.trim())
      .filter(asin => asin.length > 0);

    if (asins.length === 0) {
      showToast(t('enterValidAsins'), 'error');
      return;
    }

    setIsLoading(true);
    setResults([]); // Clear previous results
    setIsAnimating(true);
    
    try {
      // Process each ASIN individually like the old project
      await processAsinsRealtime(asins);
    } catch (error) {
      console.error('Error checking ASINs:', error);
      setIsAnimating(false);
      setIsLoading(false);
      showToast(t('failedToCheckAsins'), 'error');
    }
  };

  const processAsinsRealtime = async (asins: string[]) => {
    console.log(`🚀 Processing ${asins.length} ASINs in real-time`);

    // Initialize progress
    setProgress({ processed: 0, total: asins.length, success: 0, warning: 0, error: 0 });

    let processedCount = 0;
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    // Process each ASIN individually and show results immediately
    for (let i = 0; i < asins.length; i++) {
      const asin = asins[i];
      console.log(`🔍 Processing ASIN ${i + 1}/${asins.length}: ${asin}`);

      try {
        // Check single ASIN
        const result = await apiClient.checkASINs([asin]);

        if (result.success && result.results && result.results.length > 0) {
          const asinResult = result.results[0];
          console.log(`✅ Got result for ${asin}:`, asinResult);

          // Add result to UI immediately (at the top like old project)
          setResults(prev => [asinResult, ...prev]);

          // Auto scroll to top to show new result
          setTimeout(() => {
            const resultsContainer = document.getElementById('results');
            if (resultsContainer) {
              resultsContainer.scrollTop = 0;
            }
          }, 100);
          processedCount++;

          // Update counters
          if (asinResult.sellable) {
            successCount++;
          } else if (asinResult.detailedStatus?.includes('APPROVAL')) {
            warningCount++;
          } else {
            errorCount++;
          }

          // Update progress
          setProgress({ processed: processedCount, total: asins.length, success: successCount, warning: warningCount, error: errorCount });

          // Update usage data if provided (like old project)
          if (result.usage) {
            window.dispatchEvent(new CustomEvent('usageUpdated', { 
              detail: result.usage 
            }));
          }

        } else {
          console.warn(`⚠️ No result received for ASIN: ${asin}`);
          errorCount++;
          processedCount++;
          setProgress({ processed: processedCount, total: asins.length, success: successCount, warning: warningCount, error: errorCount });
        }

      } catch (error) {
        console.error(`❌ Error processing ${asin}:`, error);
        errorCount++;
        processedCount++;
        setProgress({ processed: processedCount, total: asins.length, success: successCount, warning: warningCount, error: errorCount });
      }

      // Small delay to avoid overwhelming the API (like old project)
      if (i < asins.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Complete processing
    setIsAnimating(false);
    setIsLoading(false);
    showToast(t('checkedAsinsSuccessfully').replace('{count}', processedCount.toString()), 'success');
    
    // Update usage data
    window.dispatchEvent(new CustomEvent('usageUpdated', { 
      detail: { 
        current: processedCount, 
        limit: 1000 // Default limit, should be fetched from subscription
      } 
    }));
  };

  const handleClearResults = () => {
    showModal({
      title: t('clearResults'),
      message: t('areYouSureClearResults'),
      onConfirm: () => {
        setResults([]);
        setAsinInput('');
        setIsAnimating(false);
        showToast(t('resultsCleared'), 'success');
      },
      isDestructive: true,
      confirmText: t('clear'),
      cancelText: t('cancel')
    });
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      showToast(t('noResultsToExport'), 'error');
      return;
    }

    const headers = ['ASIN', 'Title', 'Brand', 'Status', 'Check Date'];
    const currentDate = new Date().toLocaleDateString('en-US');
    
    const csvContent = [
      headers.join(','),
      ...results.map(result => {
        const productTitle = result.details?.title || result.details?.itemName || result.title || 'N/A';
        const productBrand = result.details?.brand || result.details?.brandName || result.brand || 'N/A';
        return [
          result.asin,
          `"${productTitle.replace(/"/g, '""')}"`,
          `"${productBrand.replace(/"/g, '""')}"`,
          getStatusText(result),
          currentDate
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fastchecker-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(t('csvExportedSuccessfully'), 'success');
  };

  const getStatusClass = (result: CheckResult) => {
    // Backend'den gelen result objesini kontrol et
    if (result.status === 'error') {
      return 'error';
    }
    
    // Use detailedStatus if available, otherwise fallback to sellable
    if (result.detailedStatus) {
      switch (result.detailedStatus) {
        case 'Eligible':
          return 'success';
        case 'APPROVAL REQUIRED':
          return 'warning';
        case 'Restricted':
        case 'Ineligible':
          return 'error'; // Kırmızı
        default:
          return 'warning';
      }
    }
    
    // Fallback to old logic
    if (result.sellable === true) {
      return 'success';
    } else if (result.sellable === false) {
      return 'error';
    }
    
    // Final fallback
    return 'warning';
  };

  const getStatusText = (result: CheckResult) => {
    // Backend'den gelen result objesini kontrol et
    if (result.status === 'error') {
      return t('checkError');
    }
    
    // Use detailedStatus if available, otherwise fallback to sellable
    if (result.detailedStatus) {
      switch (result.detailedStatus) {
        case 'Eligible':
          return 'SELLABLE';
        case 'APPROVAL REQUIRED':
          return 'APPROVAL REQUIRED';
        case 'Restricted':
          return 'RESTRICTED';
        case 'Ineligible':
          return 'NOT ELIGIBLE';
        default:
          return 'UNKNOWN';
      }
    }
    
    // Fallback to old logic
    if (result.sellable === true) {
      return 'SELLABLE';
    } else if (result.sellable === false) {
      return 'NOT ELIGIBLE';
    }
    
    // Final fallback
    return 'UNKNOWN';
  };

  const sortedResults = sortBy === 'insertion' ? results : [...results].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'asin':
        aValue = a.asin;
        bValue = b.asin;
        break;
      case 'title':
        aValue = (a.title || a.details?.title || a.details?.itemName || '').toLowerCase();
        bValue = (b.title || b.details?.title || b.details?.itemName || '').toLowerCase();
        break;
      case 'status':
        aValue = getStatusText(a);
        bValue = getStatusText(b);
        break;
      default:
        aValue = a.asin;
        bValue = b.asin;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="check-container">
      {/* Input Section */}
      <div className="input-section">
        <textarea
          id="asinInput"
          className="asin-textarea"
          placeholder={hasValidSettings ? "B0C31QBVQ1, B0DRW7WRX3..." : "Please configure SP-API settings first"}
          value={asinInput}
          onChange={handleInputChange}
          disabled={isLoading || !hasValidSettings}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          id="checkAsins"
          className="action-btn primary"
          onClick={handleCheckAsins}
          disabled={isLoading || !asinInput.trim() || !hasValidSettings}
        >
          <span className="btn-icon">🔍</span>
          <span className="btn-text">{t('checkAsins')}</span>
          <span className="btn-loader" style={{ display: isLoading ? 'inline' : 'none' }}>⏳</span>
        </button>
        <button 
          id="clearAsins"
          className="action-btn outline"
          onClick={handleClearResults}
        >
          <span className="btn-icon">🗑️</span>
          <span className="btn-text">{t('clearAsins')}</span>
        </button>
      </div>

      {/* Progress Indicator */}
      {isAnimating && (
        <div className="progress-indicator">
          <div className="progress-text">
            Processing {progress.processed} / {progress.total} ASINs...
          </div>
          <div className="progress-stats">
            <span className="stat-success">✅ {progress.success}</span>
            <span className="stat-warning">⚠️ {progress.warning}</span>
            <span className="stat-error">❌ {progress.error}</span>
          </div>
        </div>
      )}
      
      {/* Results Section */}
      {results.length > 0 && (
        <div id="resultsSection" className="results-section">
          <div className="results-header">
            <h3 className="results-title">
              {t('results')} ({results.length})
            </h3>
            <div className="results-actions">
              <div className="sort-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'insertion' | 'asin' | 'status' | 'title')}
                  className="sort-select"
                >
                  <option value="insertion">Insertion Order</option>
                  <option value="asin">{t('sortByAsin')}</option>
                  <option value="title">{t('sortByTitle')}</option>
                  <option value="status">{t('sortByStatus')}</option>
                </select>
                <button 
                  className="sort-order-btn"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <button 
                className="results-action-btn"
                onClick={handleExportCSV}
              >
                📥 {t('export')}
              </button>
            </div>
          </div>
          <div id="results" className="results-container">
            {sortedResults.map((result, index) => {
              const productTitle = result.details?.title || result.details?.itemName || result.title || 'N/A';
              const productBrand = result.details?.brand || result.details?.brandName || result.brand || 'N/A';
              const productImage = result.imageUrl || 
                                 result.details?.imageUrl || 
                                 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42MjcgMzYgMzYgMzAuNjI3IDM2IDI0QzM2IDE3LjM3MyAzMC42MjcgMTIgMjQgMTJDMTcuMzczIDEyIDEyIDE3LjM3MyAxMiAyNEMxMiAzMC42MjcgMTcuMzczIDM2IDI0IDM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              
              return (
                <div 
                  key={`${result.asin}-${index}`} 
                  className={`result-card ${getStatusClass(result)}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img src={productImage} alt={productTitle} className="result-image" />
                  <div className="result-info">
                    <div className="result-details">
                      <div className="result-asin">{result.asin}</div>
                      <div className="result-title">{productTitle}</div>
                      <div className="result-brand">{productBrand}</div>
                    </div>
                    <div className="result-status">
                      <div className={`status-badge ${getStatusClass(result)}`}>
                        {getStatusText(result)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isLoading && (
        <div id="emptyState" className="empty-state">
          <p className="empty-text">{t('emptyResults')}</p>
          <p className="empty-subtext">{t('emptySubtext')}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">{t('checkingAsins')}</p>
        </div>
      )}
    </div>
  );
}