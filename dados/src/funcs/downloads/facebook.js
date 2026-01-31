/**
 * Facebook Download - Implementação direta sem API externa
 * Usa nayan-video-downloader como fonte
 */

import axios from 'axios';
import { mediaClient } from '../../utils/httpClient.js';

const BASE_URL = 'https://nayan-video-downloader.vercel.app';

// Cache simples
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

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
 * Faz download de vídeo do Facebook em HD
 * @param {string} url - URL do vídeo do Facebook
 * @returns {Promise<Object>} Dados do download
 */
async function downloadHD(url) {
  try {
    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return cached;

    const response = await axios.get(`${BASE_URL}/ndown`, {
      params: { url },
      timeout: 120000
    });

    if (!response.data.status || !response.data.data) {
      return {
        ok: false,
        msg: 'Erro ao processar download do Facebook'
      };
    }

    const videos = response.data.data.map(video => ({
      resolution: video.resolution,
      thumbnail: video.thumbnail,
      url: video.url,
      shouldRender: video.shouldRender
    }));

    // Procurar por vídeo válido (que não use render.php)
    let selectedVideo = null;
    
    // Ordem de prioridade de qualidade
    const priorities = ['1080p', '720p (HD)', '720p', '480p', '360p'];
    
    // Primeiro tenta pelas prioridades
    for (const priority of priorities) {
      const found = videos.find(v => 
        v.resolution === priority && 
        !v.url.startsWith('/') && 
        !v.shouldRender
      );
      if (found) {
        selectedVideo = found;
        break;
      }
    }
    
    // Se não encontrou pela prioridade, pega qualquer um válido
    if (!selectedVideo) {
      selectedVideo = videos.find(v => !v.url.startsWith('/') && !v.shouldRender);
    }
    
    // Se não encontrou nenhum vídeo válido
    if (!selectedVideo) {
      return {
        ok: false,
        msg: 'Vídeo não disponível para download direto. O Facebook está bloqueando o acesso a este conteúdo.'
      };
    }

    console.log(`[Facebook] Baixando de: ${selectedVideo.url}`);
    console.log(`[Facebook] Qualidade: ${selectedVideo.resolution}`);

    // Baixar o vídeo
    const videoResponse = await mediaClient.get(selectedVideo.url, {
      timeout: 180000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const result = {
      ok: true,
      buffer: Buffer.from(videoResponse.data),
      resolution: selectedVideo.resolution,
      thumbnail: selectedVideo.thumbnail,
      allQualities: videos,
      filename: `facebook_video_${selectedVideo.resolution}.mp4`
    };

    setCache(`download:${url}`, result);
    return result;
  } catch (error) {
    console.error('Erro no download do Facebook:', error.message);
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Vídeo não encontrado ou não está disponível'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao baixar o vídeo. O arquivo pode ser muito grande.'
      };
    }

    return {
      ok: false,
      msg: error.message || 'Erro ao baixar do Facebook'
    };
  }
}

export default {
  downloadHD
};
