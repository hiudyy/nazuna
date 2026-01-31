/**
 * Instagram Download - Implementação direta sem API externa
 * Usa nayan-video-downloader como fonte
 */

import axios from 'axios';
import { mediaClient } from '../../utils/httpClient.js';

const BASE_URL = 'https://nayan-video-downloader.vercel.app/ndown';

// Cache simples
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

/**
 * Faz download de post do Instagram
 * @param {string} url - URL do post do Instagram
 * @returns {Promise<Object>} Dados do download
 */
async function dl(url) {
  try {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return {
        ok: false,
        msg: 'URL inválida'
      };
    }

    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const response = await axios.get(`${BASE_URL}?url=${encodeURIComponent(url)}`, {
      timeout: 120000
    });

    if (!response.data?.data?.length) {
      return {
        ok: false,
        msg: 'Postagem não encontrada'
      };
    }

    const results = [];
    const uniqueUrls = new Set();

    // Processar cada item de mídia
    for (const item of response.data.data) {
      if (uniqueUrls.has(item.url)) continue;
      uniqueUrls.add(item.url);

      try {
        // Verificar tipo de mídia via HEAD request
        const headResponse = await axios.head(item.url, { timeout: 30000 });
        const contentType = headResponse.headers['content-type'] || '';
        
        // Baixar o conteúdo
        const mediaResponse = await mediaClient.get(item.url, { timeout: 120000 });
        
        results.push({
          type: contentType.startsWith('image/') ? 'image' : 'video',
          buff: mediaResponse.data,
          url: item.url,
          mime: contentType || 'application/octet-stream'
        });
      } catch (downloadError) {
        console.error('Erro ao baixar mídia do Instagram:', downloadError.message);
        // Continua com as outras mídias mesmo se uma falhar
      }
    }

    if (results.length === 0) {
      return {
        ok: false,
        msg: 'Nenhuma mídia foi baixada com sucesso'
      };
    }

    const result = {
      criador: 'Hiudy',
      data: results,
      count: results.length
    };

    setCache(`download:${url}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro no download Instagram:', error.message);
    return {
      ok: false,
      msg: 'Erro ao baixar post: ' + error.message
    };
  }
}

export {
  dl
};
