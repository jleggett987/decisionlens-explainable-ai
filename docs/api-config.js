
// api-config.js
// Configuration for AI API settings

/**
 * AI API Configuration
 * Modify these settings to connect to external AI services
 */
export const API_CONFIG = {
  // Provider: 'openai', 'anthropic', 'local', or 'demo'
  provider: 'demo',
  
  // Model settings
  models: {
    openai: {
      default: 'gpt-4',
      fallback: 'gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.7
    },
    anthropic: {
      default: 'claude-3-opus-20240229',
      fallback: 'claude-3-haiku-20240307',
      maxTokens: 2000,
      temperature: 0.7
    },
    local: {
      endpoint: 'http://localhost:11434/api/generate',
      model: 'llama2'
    },
    demo: {
      // Uses built-in AI simulation
      enabled: true
    }
  },
  
  // API Keys (set these via environment variables or prompt)
  // In production, use environment variables or secure storage
  keys: {
    openai: '',
    anthropic: ''
  },
  
  // Request settings
  request: {
    timeout: 30000,
    retries: 2,
    retryDelay: 1000
  }
};

/**
 * Get the active model configuration
 */
export function getModelConfig() {
  const provider = API_CONFIG.provider;
  return API_CONFIG.models[provider] || API_CONFIG.models.demo;
}

/**
 * Check if API is properly configured
 */
export function isConfigured() {
  if (API_CONFIG.provider === 'demo') return true;
  
  const key = API_CONFIG.keys[API_CONFIG.provider];
  return !!key && key.length > 0;
}

/**
 * Set API key for a provider
 * @param {string} provider - Provider name
 * @param {string} key - API key
 */
export function setAPIKey(provider, key) {
  if (Object.prototype.hasOwnProperty.call(API_CONFIG.keys, provider)) {
    API_CONFIG.keys[provider] = key;
    return true;
  }
  return false;
}

/**
 * Get API status for UI display
 */
export function getAPIStatus() {
  const provider = API_CONFIG.provider;
  const model = getModelConfig();
  
  return {
    provider,
    model: model.default || model.model || 'demo',
    configured: isConfigured(),
    status: isConfigured() ? 'ready' : 'needs-key'
  };
}

/**
 * Create headers for API requests
 */
export function getAPIHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (API_CONFIG.provider === 'openai' && API_CONFIG.keys.openai) {
    headers['Authorization'] = `Bearer ${API_CONFIG.keys.openai}`;
  } else if (API_CONFIG.provider === 'anthropic' && API_CONFIG.keys.anthropic) {
    headers['x-api-key'] = API_CONFIG.keys.anthropic;
  }
  
  return headers;
}

/**
 * Build request body for AI API
 */
export function buildRequestBody(prompt, options = {}) {
  const model = getModelConfig();
  const baseOptions = {
    max_tokens: model.maxTokens || 2000,
    temperature: model.temperature || 0.7
  };
  
  if (API_CONFIG.provider === 'openai') {
    return {
      model: model.default,
      messages: [{ role: 'user', content: prompt }],
      ...baseOptions,
      ...options
    };
  }
  
  if (API_CONFIG.provider === 'anthropic') {
    return {
      model: model.default,
      messages: [{ role: 'user', content: prompt }],
      ...baseOptions,
      ...options
    };
  }
  
  if (API_CONFIG.provider === 'local') {
    return {
      model: model.model,
      prompt,
      ...baseOptions,
      ...options
    };
  }
  
  // Default/demo
  return { prompt, ...baseOptions, ...options };
}

export default {
  API_CONFIG,
  getModelConfig,
  isConfigured,
  setAPIKey,
  getAPIStatus,
  getAPIHeaders,
  buildRequestBody
};

