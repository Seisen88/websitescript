// API Configuration
const API_CONFIG = {
    // Backend API base URL - automatically detects environment
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://seisen-backend.vercel.app',
    
    // Request timeout in milliseconds
    timeout: 60000, // 60 seconds
    
    // Enable fallback to simulation if backend is unavailable
    enableFallback: true,
    
    // Retry configuration
    maxRetries: 1,
    // Retry configuration
    maxRetries: 1,
    retryDelay: 1000,

    // Key System URL
    keySystemUrl: 'https://work.ink/YOUR_LINK'
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
