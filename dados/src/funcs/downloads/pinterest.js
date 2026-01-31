/**
 * Pinterest Download - Implementação direta sem API externa
 * Scraping direto do Pinterest
 */

import axios from 'axios';

const BASE_URL = 'https://br.pinterest.com';

// Cache simples
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
  if (cache.size >= 1000) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

// Headers
const MOBILE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36'
};

const DESKTOP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Validador de URL
const PIN_REGEX = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/;

function isValidPinURL(url) {
  return PIN_REGEX.test(url);
}

function extractPinId(url) {
  const match = url.match(/(?:\/pin\/(\d+)|\/pin\/([a-zA-Z0-9]+))/);
  return match ? match[1] || match[2] : null;
}

/**
 * Extrai URLs de imagens do HTML
 */
function extractImagesFromHTML(html) {
  const images = new Set();
  const imgRegex = /"(https:\/\/i\.pinimg\.com\/[^"]+)"/g;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    // Melhorar qualidade da imagem
    const enhancedUrl = url
      .replace(/236x/g, '736x')
      .replace(/60x60/g, '736x');
    images.add(enhancedUrl);
  }

  return Array.from(images);
}

/**
 * Pesquisa imagens no Pinterest
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
    const cached = getCached(`search:${query.toLowerCase()}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const response = await axios.get(`${BASE_URL}/search/pins/?q=${encodeURIComponent(query)}`, {
      headers: MOBILE_HEADERS,
      timeout: 60000
    });

    const images = extractImagesFromHTML(response.data);

    if (images.length === 0) {
      return {
        ok: false,
        msg: 'Nenhuma imagem encontrada'
      };
    }

    const result = {
      criador: 'Hiudy',
      type: 'image',
      mime: 'image/jpeg',
      query: query,
      count: images.length,
      urls: images.slice(0, 50) // Máximo 50 resultados
    };

    setCache(`search:${query.toLowerCase()}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro na pesquisa Pinterest:', error.message);
    return {
      ok: false,
      msg: 'Erro ao buscar imagens no Pinterest'
    };
  }
}

/**
 * Faz download de um pin do Pinterest
 * @param {string} url - URL do pin
 * @returns {Promise<Object>} Dados do download
 */
async function dl(url) {
  try {
    if (!isValidPinURL(url)) {
      return {
        ok: false,
        msg: 'URL inválida. Certifique-se de que é um link válido do Pinterest'
      };
    }

    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const pinId = extractPinId(url);
    if (!pinId) {
      return {
        ok: false,
        msg: 'Não foi possível extrair o ID do pin da URL'
      };
    }

    const params = {
      source_url: `/pin/${pinId}/`,
      data: {
        options: {
          id: pinId,
          field_set_key: 'auth_web_main_pin',
          noCache: true,
          fetch_visual_search_objects: true
        },
        context: {}
      }
    };

    const response = await axios.get(`${BASE_URL}/resource/PinResource/get/?${new URLSearchParams({
      source_url: params.source_url,
      data: JSON.stringify(params.data)
    })}`, {
      headers: DESKTOP_HEADERS,
      timeout: 60000
    });

    const pinData = response.data.resource_response?.data;
    if (!pinData) {
      return {
        ok: false,
        msg: 'Pin não encontrado'
      };
    }

    const videos = pinData.videos?.video_list;
    const images = pinData.images;
    let mediaUrls = [];

    if (videos) {
      Object.values(videos).forEach(video => {
        if (video.url) mediaUrls.push(video.url);
      });
    }

    if (images) {
      Object.values(images).forEach(image => {
        if (image.url) mediaUrls.push(image.url);
      });
    }

    if (mediaUrls.length === 0) {
      return {
        ok: false,
        msg: 'O pin não contém mídia disponível para download'
      };
    }

    const result = {
      criador: 'Hiudy',
      pin_id: pinId,
      type: videos ? 'video' : 'image',
      mime: videos ? 'video/mp4' : 'image/jpeg',
      title: pinData.title || 'Pin do Pinterest',
      description: pinData.description || '',
      urls: mediaUrls
    };

    setCache(`download:${url}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro no download Pinterest:', error.message);
    return {
      ok: false,
      msg: 'Erro ao baixar o conteúdo do Pinterest'
    };
  }
}

export {
  search,
  dl
};
