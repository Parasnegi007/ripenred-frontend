/**
 * Global API Configuration Loader
 * Fetches API URLs from backend .env configuration
 */

// Global variable to store API configuration
window.API_CONFIG = null;

// Load configuration from backend
async function loadAPIConfig() {
    try {
        const response = await fetch('/config/api-config');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const config = await response.json();
        
        // Store in global variable
        window.API_CONFIG = {
            BASE_URL: config.API_BASE_URL,
            API_URL: config.API_BASE_URL + '/api'
        };
        
        console.log('✅ API Configuration loaded:', window.API_CONFIG);
        return window.API_CONFIG;
    } catch (error) {
        console.error('❌ Failed to load API configuration:', error);
        // Fallback to current domain if config loading fails
        const fallbackURL = window.location.origin;
        window.API_CONFIG = {
            BASE_URL: fallbackURL,
            API_URL: fallbackURL + '/api'
        };
        console.warn('⚠️ Using fallback API configuration:', window.API_CONFIG);
        return window.API_CONFIG;
    }
}

// Helper function to get API URL (used by other scripts)
function getAPIURL() {
    if (!window.API_CONFIG) {
        // Return fallback immediately, config will update later
        return window.location.origin + '/api';
    }
    return window.API_CONFIG.API_URL;
}

// Helper function to get base URL
function getBaseURL() {
    if (!window.API_CONFIG) {
        // Return fallback immediately, config will update later
        return window.location.origin;
    }
    return window.API_CONFIG.BASE_URL;
}

// Auto-load configuration when script loads
loadAPIConfig();
