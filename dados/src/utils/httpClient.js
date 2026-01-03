/**
 * HTTP Client Compartilhado com Swiftly
 * 
 * Este módulo fornece instâncias swiftly otimizadas com:
 * - Cache inteligente e rate limiting integrados
 * - Circuit breaker para resiliência
 * - Retries automáticos com backoff exponencial
 * - Headers padrão para APIs
 * 
 * @author Hiudy
 * @version 2.0.0
 */

import swiftly from 'swiftly';

/**
 * Cliente HTTP padrão para APIs JSON (cog.api.br, etc)
 */
const apiClient = swiftly({
  timeout: 120000,
  retries: 3,
  retryDelay: 1000,
  humanize: false,
  debug: false,
  cache: {
    enabled: true,
    ttl: 60000,
    maxSize: 500
  },
  rateLimiting: {
    enabled: true,
    requestsPerSecond: 10
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 15,
    resetTimeout: 15000
  }
});

// Adiciona headers padrão para requisições de API
apiClient.interceptors.request.use(async (config) => {
  config.headers = {
    ...config.headers,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'NazunaBot/2.0'
  };
  return config;
});

/**
 * Cliente HTTP para download de mídia (buffers, streams)
 */
const mediaClient = swiftly({
  timeout: 180000,
  retries: 2,
  retryDelay: 2000,
  humanize: false,
  debug: false,
  cache: {
    enabled: false
  },
  rateLimiting: {
    enabled: true,
    requestsPerSecond: 5
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 10,
    resetTimeout: 30000
  }
});

// Adiciona headers padrão para download de mídia
mediaClient.interceptors.request.use(async (config) => {
  config.headers = {
    ...config.headers,
    'User-Agent': 'NazunaBot/2.0',
    'Accept': '*/*'
  };
  return config;
});

/**
 * Cliente HTTP para scraping/HTML
 */
const scrapingClient = swiftly({
  timeout: 120000,
  retries: 2,
  retryDelay: 1500,
  humanize: true,
  debug: false,
  cache: {
    enabled: true,
    ttl: 300000,
    maxSize: 200
  },
  rateLimiting: {
    enabled: true,
    requestsPerSecond: 2
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 15,
    resetTimeout: 30000
  }
});

// Adiciona headers de browser para scraping
scrapingClient.interceptors.request.use(async (config) => {
  config.headers = {
    ...config.headers,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br'
  };
  return config;
});

/**
 * Estatísticas de conexão/métricas
 */
const getConnectionStats = () => {
  const apiMetrics = apiClient.getMetrics();
  const mediaMetrics = mediaClient.getMetrics();
  const scrapingMetrics = scrapingClient.getMetrics();
  
  return {
    api: {
      requests: apiMetrics.requestCount,
      success: apiMetrics.successCount,
      errors: apiMetrics.errorCount,
      cacheHits: apiMetrics.cacheHits,
      avgResponseTime: Math.round(apiMetrics.averageResponseTime)
    },
    media: {
      requests: mediaMetrics.requestCount,
      success: mediaMetrics.successCount,
      errors: mediaMetrics.errorCount,
      avgResponseTime: Math.round(mediaMetrics.averageResponseTime)
    },
    scraping: {
      requests: scrapingMetrics.requestCount,
      success: scrapingMetrics.successCount,
      errors: scrapingMetrics.errorCount,
      cacheHits: scrapingMetrics.cacheHits,
      avgResponseTime: Math.round(scrapingMetrics.averageResponseTime)
    }
  };
};

/**
 * Limpa caches (útil para economia de recursos)
 */
const destroyIdleSockets = () => {
  apiClient.clearCache();
  scrapingClient.clearCache();
};

/**
 * Helper para requisições com API key
 * @param {string} url - URL da API
 * @param {object} data - Dados a enviar
 * @param {string} apiKey - Chave da API
 * @param {object} options - Opções adicionais
 */
const apiRequest = async (url, data, apiKey, options = {}) => {
  return apiClient.post(url, data, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-Key': apiKey
    }
  });
};

/**
 * Helper para download de mídia
 * @param {string} url - URL do arquivo
 * @param {object} options - Opções adicionais
 * @returns {Promise<Buffer>}
 */
const downloadMedia = async (url, options = {}) => {
  const response = await mediaClient.get(url, {
    ...options,
    responseType: 'buffer'
  });
  return Buffer.from(response.data);
};

export {
  apiClient,
  mediaClient,
  scrapingClient,
  getConnectionStats,
  destroyIdleSockets,
  apiRequest,
  downloadMedia
};

export default apiClient;
