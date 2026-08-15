/**
 * Centralized project configuration
 *
 * This file contains all project-specific settings that can be customized
 * for different projects. Environment variables can override these defaults.
 */

const config = {
    // API Configuration
    api: {
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/',
        baseUrl: import.meta.env.VITE_BASE_URL || 'http://localhost:8000',
        tokenKey: import.meta.env.VITE_API_TOKEN_KEY || 'auth_token',
    },

    // App Metadata
    app: {
        name: import.meta.env.VITE_NAME || 'React Application',
        version: import.meta.env.VITE_VERSION || '1.0.0',
        environment: import.meta.env.VITE_ENV || 'development',
    },

    // Feature Flags
    features: {
        debug: import.meta.env.VITE_DEBUG === 'true',
        logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    },

    // Optional: Laravel Sanctum Configuration
    sanctum: {
        statefulDomains: import.meta.env.VITE_SANCTUM_STATEFUL_DOMAINS || '',
    },

    // Optional: WebSocket Configuration
    websocket: {
        url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:6001',
        pusherAppKey: import.meta.env.VITE_PUSHER_APP_KEY || '',
        pusherAppCluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    },

    // Optional: File Upload Configuration
    upload: {
        maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB default
    },
};

export default config;