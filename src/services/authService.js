// AuthService for FastChecker Multi-User Extension
class AuthService {
    constructor() {
        // Backend URL - Railway domain
        this.baseURL = 'https://professionalfastchecker-production.up.railway.app';
        this.token = null;
        this.user = null;
    }

    async login(email, password) {
        try {
            // Get manually selected language from Chrome storage
            const stored = await chrome.storage.local.get('language');
            const selectedLanguage = stored.language || navigator.language || 'en';
            
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': selectedLanguage === 'tr' ? 'tr-TR,tr;q=0.9' : 'en-US,en;q=0.9',
                    'X-Language': selectedLanguage
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if email verification is required
                if (data.requiresVerification) {
                    // Store userId for verification
                    await chrome.storage.local.set({
                        pendingVerificationUserId: data.userId,
                        pendingVerificationEmail: email
                    });
                    
                    return { 
                        success: false, 
                        requiresVerification: true, 
                        userId: data.userId,
                        email: email,
                        error: data.message || data.error 
                    };
                }
                
                // Check if user not found
                if (data.userNotFound) {
                    return {
                        success: false,
                        userNotFound: true,
                        action: data.action,
                        error: data.message || data.error
                    };
                }
                
                throw new Error(data.message || data.error || 'Login failed');
            }

            this.token = data.token;
            this.user = data.user;

            // Store in Chrome storage
            await chrome.storage.local.set({
                authToken: this.token,
                currentUser: this.user
            });

            return { success: true, user: this.user };

        } catch (error) {
            // Silently handle login error - don't log to console
            return { success: false, error: error.message };
        }
    }

    async register(email, password) {
        try {
            // Get manually selected language from Chrome storage
            const stored = await chrome.storage.local.get('language');
            const selectedLanguage = stored.language || navigator.language || 'en';
            
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': selectedLanguage === 'tr' ? 'tr-TR,tr;q=0.9' : 'en-US,en;q=0.9',
                    'X-Language': selectedLanguage
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // New registration flow - requires email verification
            if (data.requiresVerification) {
                // Store userId for verification
                await chrome.storage.local.set({
                    pendingVerificationUserId: data.userId,
                    pendingVerificationEmail: email
                });
                
                return { 
                    success: true, 
                    requiresVerification: true, 
                    userId: data.userId,
                    email: email,
                    message: data.message 
                };
            }

            // Old flow (shouldn't happen anymore but keeping for safety)
            this.token = data.token;
            this.user = data.user;

            await chrome.storage.local.set({
                authToken: this.token,
                currentUser: this.user
            });

            return { success: true, user: this.user };

        } catch (error) {
            // Check if this is a user validation error or system error
            const isUserValidationError = error.message?.includes('userAlreadyExists') ||
                                        error.message?.includes('already exists') ||
                                        error.message?.includes('duplicate') ||
                                        error.message?.includes('passwordTooShort') ||
                                        error.message?.includes('passwordTooWeak') ||
                                        error.message?.includes('invalidEmail') ||
                                        error.message?.includes('emailRequired') ||
                                        error.message?.includes('passwordRequired') ||
                                        error.message?.includes('409') ||
                                        error.message?.includes('400') ||
                                        error.message?.includes('invalid email') ||
                                        error.message?.includes('weak password') ||
                                        error.message?.includes('too short') ||
                                        error.message?.includes('too weak') ||
                                        error.message?.includes('required');

            if (isUserValidationError) {
                // User validation error - don't log to console to avoid Chrome extension errors
                // The error message will still be shown to user via the return value
            } else {
                console.error('❌ Registration system error:', error);
            }
            return { success: false, error: error.message };
        }
    }

    async getToken() {
        if (this.token) return this.token;

        const stored = await chrome.storage.local.get('authToken');
        if (stored.authToken) {
            this.token = stored.authToken;
            return this.token;
        }

        return null;
    }

    async getCurrentUser() {
        if (this.user) return this.user;

        const stored = await chrome.storage.local.get('currentUser');
        if (stored.currentUser) {
            this.user = stored.currentUser;
            return this.user;
        }

        return null;
    }

    async refreshToken() {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No token available');

            const response = await fetch(`${this.baseURL}/api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.user = data.user;
            await chrome.storage.local.set({ currentUser: this.user });

            return this.token;

        } catch (error) {
            console.error('Token refresh error:', error);
            await this.logout();
            throw error;
        }
    }

    async logout() {
        this.token = null;
        this.user = null;

        await chrome.storage.local.remove(['authToken', 'currentUser', 'apiSettings']);

        return { success: true };
    }

    async isAuthenticated() {
        const token = await this.getToken();
        if (!token) return false;

        // Check if token is expired locally first
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            if (payload.exp < now) {
                // Token expired, clear it
                await this.logout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            await this.logout();
            return false;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = await this.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const authOptions = {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            let response = await fetch(url, authOptions);

            // If token expired, try to refresh
            if (response.status === 401) {
                await this.refreshToken();
                const newToken = await this.getToken();
                
                authOptions.headers.Authorization = `Bearer ${newToken}`;
                response = await fetch(url, authOptions);
            }

            return response;

        } catch (error) {
            console.error('Authenticated request error:', error);
            throw error;
        }
    }

    async verifyEmail(email, verificationCode) {
        try {
            // Get userId and language from storage
            const stored = await chrome.storage.local.get(['pendingVerificationUserId', 'language']);
            const userId = stored.pendingVerificationUserId;
            const selectedLanguage = stored.language || navigator.language || 'en';
            
            if (!userId) {
                throw new Error('Verification session expired. Please register again.');
            }
            
            const response = await fetch(`${this.baseURL}/api/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': selectedLanguage === 'tr' ? 'tr-TR,tr;q=0.9' : 'en-US,en;q=0.9',
                    'X-Language': selectedLanguage
                },
                body: JSON.stringify({ userId, verificationCode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Email verification failed');
            }

            // Store token and user after successful verification
            this.token = data.token;
            this.user = data.user;

            await chrome.storage.local.set({
                authToken: this.token,
                currentUser: this.user
            });

            // Clear pending verification data
            await chrome.storage.local.remove(['pendingVerificationUserId', 'pendingVerificationEmail']);

            return { success: true, user: this.user, message: data.message };

        } catch (error) {
            // Check if this is a user validation error (4xx) or system error (5xx/network)
            const isUserValidationError = error.message?.includes('Invalid') ||
                                        error.message?.includes('expired') ||
                                        error.message?.includes('incorrect') ||
                                        error.message?.includes('wrong') ||
                                        error.message?.includes('invalidCode') ||
                                        error.message?.includes('codeExpired') ||
                                        error.message?.includes('userNotFound') ||
                                        error.message?.includes('sessionExpired') ||
                                        error.message?.includes('400') ||
                                        error.message?.includes('401') ||
                                        error.message?.includes('404') ||
                                        error.message?.includes('409') ||
                                        error.message?.includes('422');

            if (isUserValidationError) {
                // User validation error - don't log to console to avoid Chrome extension errors
            } else {
                console.error('❌ Email verification system error:', error);
            }
            return { success: false, error: error.message };
        }
    }

    async resendVerificationCode(email) {
        try {
            // Get userId and language from storage
            const stored = await chrome.storage.local.get(['pendingVerificationUserId', 'language']);
            const userId = stored.pendingVerificationUserId;
            const selectedLanguage = stored.language || navigator.language || 'en';
            
            if (!userId) {
                throw new Error('Verification session expired. Please register again.');
            }
            
            const response = await fetch(`${this.baseURL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': selectedLanguage === 'tr' ? 'tr-TR,tr;q=0.9' : 'en-US,en;q=0.9',
                    'X-Language': selectedLanguage
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend verification code');
            }

            return { success: true, message: data.message };

        } catch (error) {
            // Check if this is a user validation error or system error
            const isUserValidationError = error.message?.includes('too many') ||
                                        error.message?.includes('rate limit') ||
                                        error.message?.includes('expired') ||
                                        error.message?.includes('sessionExpired') ||
                                        error.message?.includes('userNotFound') ||
                                        error.message?.includes('429') ||
                                        error.message?.includes('400') ||
                                        error.message?.includes('404') ||
                                        error.message?.includes('422');

            if (isUserValidationError) {
                // User validation error - don't log to console to avoid Chrome extension errors
            } else {
                console.error('❌ Resend verification system error:', error);
            }
            return { success: false, error: error.message };
        }
    }

}

// Export singleton instance
const authService = new AuthService();
// For Chrome Extension compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
} else if (typeof window !== 'undefined') {
    window.authService = authService;
} else if (typeof self !== 'undefined') {
    self.authService = authService;
}
