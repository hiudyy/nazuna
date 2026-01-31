/**
 * TikTok Download - Implementação direta sem API externa
 * Usa tikwm.com como fonte
 */

import axios from 'axios';

const BASE_URL = 'https://www.tikwm.com/api';

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

// Headers para tikwm
const TIKWM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Cookie': 'current_language=pt-BR',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.tikwm.com/'
};

/**
 * Formata resposta de download
 */
function formatDownloadResponse(data) {
  const response = {
    criador: 'Hiudy'
  };

  if (data.music_info?.play) {
    response.audio = data.music_info.play;
  }

  if (data.images) {
    response.type = 'image';
    response.mime = '';
    response.urls = data.images;
  } else {
    response.type = 'video';
    response.mime = 'video/mp4';
    response.urls = [data.play];
  }

  if (data.title) {
    response.title = data.title;
  }

  return response;
}

/**
 * Faz download de vídeo do TikTok
 * @param {string} url - URL do vídeo do TikTok
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

    const response = await axios.get(`${BASE_URL}/`, {
      params: { url },
      headers: TIKWM_HEADERS,
      timeout: 120000
    });

    if (!response.data?.data) {
      return {
        ok: false,
        msg: 'Não foi possível obter dados do vídeo'
      };
    }

    const result = formatDownloadResponse(response.data.data);
    setCache(`download:${url}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro no download TikTok:', error.message);
    return {
      ok: false,
      msg: 'Erro ao baixar vídeo: ' + error.message
    };
  }
}

/**
 * Pesquisa vídeos no TikTok
 * @param {string} query - Termo de pesquisa
 * @returns {Promise<Object>} Resultados da pesquisa
 */
async function search(query) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        ok: false,
        msg: 'Termo de pesquisa inválido'
      };
    }

    // Verificar cache
    const cached = getCached(`search:${query}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const response = await axios.post(`${BASE_URL}/feed/search`, {
      keywords: query,
      count: 5,
      cursor: 0,
      HD: 1
    }, {
      headers: TIKWM_HEADERS,
      timeout: 120000
    });

    if (!response.data?.data?.videos?.length) {
      return {
        ok: false,
        msg: 'Nenhum vídeo encontrado'
      };
    }

    // Pegar um vídeo aleatório dos resultados
    const videos = response.data.data.videos;
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    const result = {
      criador: 'Hiudy',
      title: randomVideo.title,
      urls: [randomVideo.play],
      type: 'video',
      mime: 'video/mp4',
      audio: randomVideo.music_info?.play
    };

    setCache(`search:${query}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro na pesquisa TikTok:', error.message);
    return {
      ok: false,
      msg: 'Erro ao pesquisar vídeo: ' + error.message
    };
  }
}

export {
  search,
  dl
};
