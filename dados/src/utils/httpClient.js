/**
 * HTTP Client Compartilhado com Connection Pooling
 * 
 * Este módulo fornece uma instância axios otimizada com:
 * - Keep-Alive habilitado para reutilização de conexões
 * - Limitação de sockets simultâneos
 * - Timeouts configuráveis
 * - Headers padrão para APIs
 * 
 * @author Hiudy
 * @version 1.0.0
 */

import axios from 'axios';
import http from 'http';
import https from 'https';

// Agentes HTTP com keep-alive e limitação de conexões
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,        // Máximo de sockets simultâneos por host
  maxFreeSockets: 10,    // Máximo de sockets livres mantidos
  timeout: 120000,       // Timeout de socket ocioso (2 minutos)
  scheduling: 'lifo'     // Last-in-first-out para melhor reutilização
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 120000,       // Timeout de socket ocioso (2 minutos)
  scheduling: 'lifo',
  rejectUnauthorized: true // Mantém validação SSL
});

/**
 * Cliente HTTP padrão para APIs JSON (cog.api.br, etc)
 */
const apiClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 120000,       // Timeout de 2 minutos para requisições
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'NazunaBot/2.0'
  },
  // Não lançar erro para status >= 400 (tratamos manualmente)
  validateStatus: (status) => status < 500
});

/**
 * Cliente HTTP para download de mídia (buffers, streams)
 */
const mediaClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 120000, // 2 minutos para downloads grandes
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  responseType: 'arraybuffer',
  headers: {
    'User-Agent': 'NazunaBot/2.0',
    'Accept': '*/*'
  }
});

/**
 * Cliente HTTP para scraping/HTML
 */
const scrapingClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 120000,       // Timeout de 2 minutos para requisições
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br'
  }
});

/**
 * Interceptor para logging de erros (opcional)
 */
const addErrorInterceptor = (client, name) => {
  client.interceptors.response.use(
    response => response,
    error => {
      // Log apenas erros de rede, não erros HTTP
      if (!error.response) {
        console.error(`[${name}] Network error:`, error.code || error.message);
      }
      return Promise.reject(error);
    }
  );
};

// Adiciona interceptors
addErrorInterceptor(apiClient, 'API');
addErrorInterceptor(mediaClient, 'Media');
addErrorInterceptor(scrapingClient, 'Scraping');

/**
 * Estatísticas de conexão
 */
const getConnectionStats = () => ({
  http: {
    sockets: Object.keys(httpAgent.sockets || {}).reduce((acc, key) => acc + (httpAgent.sockets[key]?.length || 0), 0),
    freeSockets: Object.keys(httpAgent.freeSockets || {}).reduce((acc, key) => acc + (httpAgent.freeSockets[key]?.length || 0), 0),
    requests: Object.keys(httpAgent.requests || {}).reduce((acc, key) => acc + (httpAgent.requests[key]?.length || 0), 0)
  },
  https: {
    sockets: Object.keys(httpsAgent.sockets || {}).reduce((acc, key) => acc + (httpsAgent.sockets[key]?.length || 0), 0),
    freeSockets: Object.keys(httpsAgent.freeSockets || {}).reduce((acc, key) => acc + (httpsAgent.freeSockets[key]?.length || 0), 0),
    requests: Object.keys(httpsAgent.requests || {}).reduce((acc, key) => acc + (httpsAgent.requests[key]?.length || 0), 0)
  }
});

/**
 * Limpa conexões ociosas (útil para economia de recursos)
 */
const destroyIdleSockets = () => {
  httpAgent.destroy();
  httpsAgent.destroy();
};

/**
 * Helper para requisições com API key
 * @param {string} url - URL da API
 * @param {object} data - Dados a enviar
 * @param {string} apiKey - Chave da API
 * @param {object} options - Opções adicionais do axios
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
  const response = await mediaClient.get(url, options);
  return response.data;
};

export {
  apiClient,
  mediaClient,
  scrapingClient,
  httpAgent,
  httpsAgent,
  getConnectionStats,
  destroyIdleSockets,
  apiRequest,
  downloadMedia
};

export default apiClient;
