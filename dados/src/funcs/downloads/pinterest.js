/**
 * Sistema de Download e Pesquisa Pinterest Otimizado
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 */

import axios from 'axios';
import { parseHTML } from 'linkedom';

// Configurações
const CONFIG = {
  API: {
    BASE_URL: 'https://br.pinterest.com',
    TIMEOUT: 30000,
    HEADERS: {
      MOBILE: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.152 Mobile Safari/537.36'
      },
      DESKTOP: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }
  },
  MEDIA: {
    IMAGE_SIZES: {
      THUMBNAIL: '236x',
      MEDIUM: '474x',
      LARGE: '736x',
      ORIGINAL: 'originals'
    },
    MAX_RESULTS: 50
  },
  CACHE: {
    MAX_SIZE: 1000,
    EXPIRE_TIME: 30 * 60 * 1000 // 30 minutos
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000
  }
};

// Cache para resultados
class PinterestCache {
  constructor() {
    this.cache = new Map();
  }

  getKey(type, input) {
    return `${type}:${input.toLowerCase()}`;
  }

  get(type, input) {
    const key = this.getKey(type, input);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CONFIG.CACHE.EXPIRE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(type, input, data) {
    if (this.cache.size >= CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getKey(type, input);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Cliente Pinterest
class PinterestClient {
  constructor() {
    this.axios = axios.create({
      baseURL: CONFIG.API.BASE_URL,
      timeout: CONFIG.API.TIMEOUT
    });
  }

  async request(config, attempt = 1) {
    try {
      return await this.axios.request(config);
    } catch (error) {
      if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY * attempt));
        return this.request(config, attempt + 1);
      }
      throw error;
    }
  }

  async search(query) {
    const response = await this.request({
      method: 'GET',
      url: `/search/pins/?q=${encodeURIComponent(query)}`,
      headers: CONFIG.API.HEADERS.MOBILE
    });

    const { document } = parseHTML(response.data);
    return this.extractImagesFromDOM(document);
  }

  extractImagesFromDOM(document) {
    const images = new Set();
    
    document.querySelectorAll('.hCL').forEach(el => {
      const src = el.getAttribute('src');
      if (src) {
        const enhancedSrc = this.enhanceImageQuality(src);
        images.add(enhancedSrc);
      }
    });

    return Array.from(images);
  }

  enhanceImageQuality(url) {
    return url
      .replace(/236x/g, CONFIG.MEDIA.IMAGE_SIZES.LARGE)
      .replace(/60x60/g, CONFIG.MEDIA.IMAGE_SIZES.LARGE);
  }

  async downloadPin(pinId) {
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

    const response = await this.request({
      method: 'GET',
      url: `/resource/PinResource/get/?${new URLSearchParams({
        source_url: params.source_url,
        data: JSON.stringify(params.data)
      })}`,
      headers: CONFIG.API.HEADERS.DESKTOP
    });

    return response.data.resource_response.data;
  }
}

// Validador de URL
class URLValidator {
  static PIN_REGEX = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/;

  static isValidPinURL(url) {
    return this.PIN_REGEX.test(url);
  }

  static extractPinId(url) {
    const match = url.match(/(?:\/pin\/(\d+)|\/pin\/([a-zA-Z0-9]+))/);
    return match ? match[1] || match[2] : null;
  }
}

// Cache e cliente instanciados uma única vez
const cache = new PinterestCache();
const client = new PinterestClient();

/**
 * Pesquisa imagens no Pinterest
 * @param {string} query - Termo de pesquisa
 * @returns {Promise<Object>} Resultados da pesquisa
 */
async function pinterestSearch(query) {
  try {
    if (!query || typeof query !== 'string') {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    const cached = cache.get('search', query);
    if (cached) return cached;

    const images = await client.search(query);

    if (images.length === 0) {
      return { ok: false, msg: 'Nenhuma imagem encontrada.' };
    }

    const result = {
      ok: true,
      criador: 'Hiudy',
      type: 'image',
      mime: 'image/jpeg',
      urls: images
    };

    cache.set('search', query, result);
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
async function pinterestDL(url) {
  try {
    if (!URLValidator.isValidPinURL(url)) {
      return { ok: false, msg: 'URL inválida. Certifique-se de que é um link de pin do Pinterest.' };
    }

    const cached = cache.get('download', url);
    if (cached) return cached;

    const pinId = URLValidator.extractPinId(url);
    if (!pinId) {
      return { ok: false, msg: 'Não foi possível extrair o ID do pin.' };
    }

    const pinData = await client.downloadPin(pinId);
    const videos = pinData.videos?.video_list;
    const images = pinData.images;

    let result = [];

    if (videos) {
      Object.values(videos).forEach(video => result.push(video.url));
    }

    if (images) {
      Object.values(images).forEach(image => result.push(image.url));
    }

    if (result.length === 0) {
      return { ok: false, msg: 'Nenhum conteúdo encontrado.' };
    }

    const response = {
      ok: true,
      type: videos ? 'video' : 'image',
      mime: videos ? 'video/mp4' : 'image/jpeg',
      urls: [result[0]]
    };

    cache.set('download', url, response);
    return response;
  } catch (error) {
    console.error('Erro no download Pinterest:', error);
    return { ok: false, msg: 'Ocorreu um erro ao baixar o conteúdo.' };
  }
}

export {
  pinterestSearch as search,
  pinterestDL as dl
};