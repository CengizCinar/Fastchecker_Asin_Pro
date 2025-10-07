class ApiClient {
    constructor() {
        this.baseURL = 'https://professionalfastchecker-production.up.railway.app';
    }

    async checkASINs(asins, manualCheckOptions = {}) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/asin/check`,
                {
                    method: 'POST',
                    body: JSON.stringify({ 
                        asins,
                        ...manualCheckOptions 
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'ASIN check failed');
            }

            return { success: true, results: data.results, usage: data.usage };

        } catch (error) {
            console.error('ASIN check error:', error);
            return { success: false, error: error.message };
        }
    }

    async getSubscriptionStatus() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/status`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get subscription status');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get subscription status error:', error);
            return { success: false, error: error.message };
        }
    }

    async createCheckoutSession(planCode) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/checkout`,
                {
                    method: 'POST',
                    body: JSON.stringify({ planCode })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Create checkout session error:', error);
            return { success: false, error: error.message };
        }
    }

    async downgradePlan(targetPlan) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/downgrade`,
                {
                    method: 'POST',
                    body: JSON.stringify({ targetPlan })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to schedule downgrade');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Downgrade plan error:', error);
            return { success: false, error: error.message };
        }
    }

    async cancelPendingChange() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/cancel-pending-change`,
                {
                    method: 'DELETE'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to cancel pending change');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Cancel pending change error:', error);
            return { success: false, error: error.message };
        }
    }

    async cancelSubscription() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/cancel`,
                {
                    method: 'DELETE'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to cancel subscription');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Cancel subscription error:', error);
            return { success: false, error: error.message };
        }
    }

    async getBillingInfo() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/billing-info`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get billing information');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get billing info error:', error);
            return { success: false, error: error.message };
        }
    }

    async saveSettings(settings) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/settings`,
                {
                    method: 'POST',
                    body: JSON.stringify(settings)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Save settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async testConnection() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/test-connection`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Connection test failed');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Test connection error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/auth/profile`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get user profile');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUsageStatistics() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/usage-statistics`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get usage statistics');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get usage statistics error:', error);
            return { success: false, error: error.message };
        }
    }

    async getSubscriptionData() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/subscription-data`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get subscription data');
            }

            return data; // Already includes success and data fields

        } catch (error) {
            console.error('Get subscription data error:', error);
            return { success: false, error: error.message };
        }
    }

    async getAvailablePlans() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/subscription/plans`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get available plans');
            }

            return { success: true, plans: data.plans };

        } catch (error) {
            console.error('Get available plans error:', error);
            return { success: false, error: error.message };
        }
    }

    async exportUserData(language = 'en') {
        try {
            // Use ASIN export endpoint for current month's data
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/asin/export?language=${language}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export user data');
            }

            // Response is CSV text, not JSON
            const csvData = await response.text();

            return { success: true, csvData };

        } catch (error) {
            console.error('Export user data error:', error);
            return { success: false, error: error.message };
        }
    }

    async changeEmail(newEmail, password) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/change-email`,
                {
                    method: 'POST',
                    body: JSON.stringify({ newEmail, password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change email');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Change email error:', error);
            return { success: false, error: error.message };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/change-password`,
                {
                    method: 'POST',
                    body: JSON.stringify({ currentPassword, newPassword })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: error.message };
        }
    }

    async createBulkJob(asins) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/asin/bulk-check`,
                {
                    method: 'POST',
                    body: JSON.stringify({ asins })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create bulk job');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Create bulk job error:', error);
            return { success: false, error: error.message };
        }
    }

    async getSettings() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/settings`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get settings');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserUsage() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/usage`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get usage');
            }

            return { success: true, usage: data.usage };

        } catch (error) {
            console.error('Get usage error:', error);
            return { success: false, error: error.message };
        }
    }

    async getSellerOwnership() {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/user/seller-ownership`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get seller ownership');
            }

            return { success: true, sellerOwnership: data.sellerOwnership };

        } catch (error) {
            console.error('Get seller ownership error:', error);
            return { success: false, error: error.message };
        }
    }

    async getJobStatus(jobId) {
        try {
            const response = await (window.authService || self.authService).makeAuthenticatedRequest(
                `${this.baseURL}/api/asin/job/${jobId}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get job status');
            }

            return { success: true, ...data };

        } catch (error) {
            console.error('Get job status error:', error);
            return { success: false, error: error.message };
        }
    }

    async createSSEStream(jobId, onMessage, onError, onComplete) {
        const token = await (window.authService || self.authService).getToken();
        const eventSource = new EventSource(
            `${this.baseURL}/api/asin/stream/${jobId}?token=${encodeURIComponent(token)}`
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('SSE parse error:', error);
                onError(error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            onError(error);
        };

        // Handle connection close
        const checkConnection = setInterval(() => {
            if (eventSource.readyState === EventSource.CLOSED) {
                clearInterval(checkConnection);
                onComplete();
            }
        }, 1000);

        return {
            close: () => {
                eventSource.close();
                clearInterval(checkConnection);
            },
            readyState: () => eventSource.readyState
        };
    }

    // Alias methods for backward compatibility
    async getUsageStats() {
        return this.getUsageStatistics();
    }

    async checkAsins(asins) {
        return this.checkASINs(asins);
    }
}

// Create global instance
window.apiClient = new ApiClient();
