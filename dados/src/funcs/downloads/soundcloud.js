/**
 * SoundCloud Download - Implementação direta sem API externa
 * Usa nayan-video-downloader como fonte
 */

import axios from 'axios';
import { mediaClient } from '../../utils/httpClient.js';

const BASE_URL = 'https://nayan-video-downloader.vercel.app';

// Cache simples para evitar requisições duplicadas
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

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
  if (cache.size >= 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

/**
 * Faz download direto de uma música do SoundCloud via URL
 * @param {string} url - URL do track do SoundCloud
 * @returns {Promise<Object>} Dados do download
 */
async function download(url) {
  try {
    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return cached;

    const response = await axios.get(`${BASE_URL}/soundcloud`, {
      params: { url },
      timeout: 120000
    });

    if (response.data.status !== 200 || !response.data.data) {
      return {
        ok: false,
        msg: 'Erro ao processar download do SoundCloud'
      };
    }

    const data = response.data.data;
    
    // Baixar o arquivo de áudio
    const audioResponse = await mediaClient.get(data.download_url, {
      timeout: 120000
    });

    const result = {
      ok: true,
      buffer: Buffer.from(audioResponse.data),
      title: data.title,
      artist: data.artist,
      thumbnail: data.thumbnail,
      filename: `${data.title}.mp3`
    };

    setCache(`download:${url}`, result);
    return result;
  } catch (error) {
    console.error('Erro no download do SoundCloud:', error.message);
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Música não encontrada no SoundCloud'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao baixar a música. Tente novamente.'
      };
    }

    return {
      ok: false,
      msg: error.message || 'Erro ao baixar do SoundCloud'
    };
  }
}

/**
 * Busca músicas no SoundCloud
 * @param {string} query - Nome da música ou artista
 * @param {number} limit - Número de resultados
 * @returns {Promise<Object>} Resultados da busca
 */
async function search(query, limit = 10) {
  try {
    const cached = getCached(`search:${query}:${limit}`);
    if (cached) return cached;

    const response = await axios.get(`${BASE_URL}/soundcloud-search`, {
      params: {
        name: query,
        limit: Math.min(limit, 50)
      },
      timeout: 120000
    });

    if (response.data.status !== 200 || !response.data.results) {
      return {
        ok: false,
        msg: 'Nenhum resultado encontrado'
      };
    }

    const results = response.data.results.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.user_id,
      artwork: track.artwork_url,
      duration: Math.floor(track.duration / 1000),
      permalink_url: track.permalink_url,
      playback_count: track.playback_count,
      likes_count: track.likes_count,
      genre: track.genre || 'Unknown',
      created_at: track.created_at
    }));

    const result = {
      ok: true,
      query,
      total: results.length,
      results
    };

    setCache(`search:${query}:${limit}`, result);
    return result;
  } catch (error) {
    console.error('Erro na busca do SoundCloud:', error.message);
    return {
      ok: false,
      msg: 'Erro ao buscar no SoundCloud'
    };
  }
}

/**
 * Busca e faz download de uma música do SoundCloud
 * @param {string} query - Nome da música ou artista
 * @returns {Promise<Object>} Dados da busca e download
 */
async function searchDownload(query) {
  try {
    // Buscar primeiro resultado
    const searchResult = await search(query, 1);
    
    if (!searchResult.ok || !searchResult.results?.length) {
      return {
        ok: false,
        msg: 'Nenhuma música encontrada com esse nome'
      };
    }

    const track = searchResult.results[0];
    
    // Fazer download
    const downloadResult = await download(track.permalink_url);
    
    if (!downloadResult.ok) {
      return downloadResult;
    }

    return {
      ok: true,
      buffer: downloadResult.buffer,
      query,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
        permalink_url: track.permalink_url,
        playback_count: track.playback_count,
        likes_count: track.likes_count,
        genre: track.genre,
        created_at: track.created_at
      },
      title: downloadResult.title,
      artist: downloadResult.artist,
      thumbnail: downloadResult.thumbnail,
      filename: downloadResult.filename
    };
  } catch (error) {
    console.error('Erro na busca/download do SoundCloud:', error.message);
    return {
      ok: false,
      msg: error.message || 'Erro ao buscar no SoundCloud'
    };
  }
}

export default {
  download,
  search,
  searchDownload
};
