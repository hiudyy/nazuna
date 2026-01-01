/**
 * Pinterest API-only helper for Cognima (cog.api.br)
 * Author: Hiudy (adapted)
 * Version: 3.0.0
 * Otimizado com HTTP connection pooling
 *
 * This module now exclusively uses Cognima endpoints for Pinterest search and download.
 * If no API key is provided to the functions, they return an error consistent with the rest
 * of the project's helper modules.
 */

import { apiClient } from '../../utils/httpClient.js';
import { isApiKeyError } from '../utils/apiKeyNotifier.js';

const API_BASE = 'https://cog.api.br/api/v1';

// Simple LRU-ish cache shared across calls
class SimpleCache {
  constructor(maxEntries = 500, ttl = 30 * 60 * 1000) {
    this.map = new Map();
    this.maxEntries = maxEntries;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.map.get(key);
    if (!item) return null;
    if (Date.now() - item.ts > this.ttl) {
      this.map.delete(key);
      return null;
    }
    return item.val;
  }

  set(key, val) {
    if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, { val, ts: Date.now() });
  }
}

const cache = new SimpleCache(500, 30 * 60 * 1000);

/**
 * Searches Pinterest using Cognima API. API Key is required.
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<Object>} - { ok: true, urls: [...], type: 'image'|'video', mime, criador, count, query }
 */
async function pinterestSearch(query, apiKey) {
  try {
    if (!query || typeof query !== 'string') {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }
    const cached = cache.get(`search:${query.toLowerCase()}`);
    if (cached) return cached;

    if (!apiKey) {
      return { ok: false, msg: 'API key não configurada' };
    }

    const response = await apiClient.post(`${API_BASE}/pinterest/search`, {
      query: query
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 30000
    });

    if (!response.data || !response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    const data = response.data.data;
    const result = {
      ok: true,
      criador: data.criador || 'Hiudy',
      type: data.type || 'image',
      mime: data.mime || 'image/jpeg',
      query: data.query || query,
      count: Number(data.count || (Array.isArray(data.urls) ? data.urls.length : 0)),
      urls: Array.isArray(data.urls) ? data.urls : []
    };

    cache.set(`search:${query.toLowerCase()}`, result);
    return result;
  } catch (error) {
    console.error('Erro na pesquisa Pinterest:', error);
    return { ok: false, msg: 'Ocorreu um erro ao buscar imagens.' };
  }
}

/**
 * Download de conteúdo do Pinterest
 * @param {string} url - URL do pin
 * @returns {Promise<Object>} Resultado do download
 */
/**
 * Downloads the pin using Cognima API. API Key is required.
 * @param {string} url
 * @param {string} apiKey
 * @returns {Promise<Object>} - { ok: true, title, type, mime, urls: [] }
 */
async function pinterestDL(url, apiKey) {
  try {
    if (!url || typeof url !== 'string') {
      return { ok: false, msg: 'URL inválida' };
    }

    const cached = cache.get(`download:${url}`);
    if (cached) return cached;

    if (!apiKey) {
      return { ok: false, msg: 'API key não configurada' };
    }

    // If apiKey provided, use API endpoint
    if (apiKey) {
      try {
        const response = await apiClient.post(`${API_BASE}/pinterest/download`, {
          url: url
        }, {
          headers: { 'X-API-Key': apiKey },
          timeout: 120000
        });

        if (!response.data || !response.data.success || !response.data.data) {
          throw new Error('Resposta inválida da API');
        }

        const data = response.data.data;
        let urls = [];
        if (Array.isArray(data.urls)) {
          urls = data.urls.map(u => typeof u === 'string' ? u : u.url || '').filter(Boolean);
        }

        if (urls.length === 0) {
          return { ok: false, msg: 'Nenhum conteúdo encontrado.' };
        }

        const responseObj = {
          ok: true,
          criador: data.criador || 'Hiudy',
          title: data.title || '',
          type: data.type || (data.urls?.[0]?.quality && data.urls[0].quality.includes('video') ? 'video' : 'image'),
          mime: data.mime || (data.type === 'video' ? 'video/mp4' : 'image/jpeg'),
          urls: urls
        };

        cache.set(`download:${url}`, responseObj);
        return responseObj;
      } catch (error) {
        console.error('Erro no download Pinterest (API):', error.message || error);
        if (isApiKeyError(error)) {
          throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
        }
        return { ok: false, msg: 'Ocorreu um erro ao baixar o conteúdo.' };
      }
    }
    // No fallback -- API-only
  } catch (error) {
    console.error('Erro no download Pinterest:', error);
    return { ok: false, msg: 'Ocorreu um erro ao baixar o conteúdo.' };
  }
}

export {
  pinterestSearch as search,
  pinterestDL as dl
};