/**
 * Sistema de Download de APK Mod Otimizado
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 * Otimizado com HTTP connection pooling
 */

import { scrapingClient } from '../../utils/httpClient.js';
import { DOMParser } from 'linkedom';

// Configurações
const CONFIG = {
  API: {
    BASE_URL: 'https://apkmodct.com',
    TIMEOUT: 120000,
    HEADERS: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  },
  CACHE: {
    MAX_SIZE: 100,
    EXPIRE_TIME: 30 * 60 * 1000 // 30 minutos
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000
  },
  SELECTORS: {
    SEARCH: {
      POST: 'div.post a',
      IMAGE: 'figure.home-icon img'
    },
    POST: {
      DESCRIPTION: 'meta[name="description"]',
      TABLE: 'table.table-bordered tr',
      MAIN_LINK: 'div.main-pic a'
    },
    DOWNLOAD: {
      LINK: 'div.col-xs-12 a'
    }
  }
};

// Cache para resultados
class APKCache {
  constructor() {
    this.cache = new Map();
  }

  getKey(query) {
    return query.toLowerCase().trim();
  }

  get(query) {
    const key = this.getKey(query);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CONFIG.CACHE.EXPIRE_TIME) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(query, data) {
    if (this.cache.size >= CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.getKey(query);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Parser de APK
class APKParser {
  constructor() {
    this.parser = new DOMParser();
  }

  parseDocument(html) {
    return this.parser.parseFromString(html, 'text/html');
  }

  parseSearchResults(document) {
    const postElement = document.querySelector(CONFIG.SELECTORS.SEARCH.POST);
    if (!postElement) {
      throw new Error('Nenhum resultado encontrado');
    }

    return {
      url: postElement.href,
      title: postElement.title,
      image: document.querySelector(CONFIG.SELECTORS.SEARCH.IMAGE)?.src || 'não encontrada'
    };
  }

  parsePostDetails(document) {
    const description = document.querySelector(CONFIG.SELECTORS.POST.DESCRIPTION)?.content || 'não disponível';
    const details = this.parseDetailsTable(document);
    const mainPicUrl = document.querySelector(CONFIG.SELECTORS.POST.MAIN_LINK)?.href;

    if (!mainPicUrl) {
      throw new Error('Nenhum link principal encontrado');
    }

    return { description, details, mainPicUrl };
  }

  parseDetailsTable(document) {
    const details = {};
    document.querySelectorAll(CONFIG.SELECTORS.POST.TABLE).forEach(row => {
      const key = row.querySelector('th')?.textContent.trim().toLowerCase();
      const value = row.querySelector('td')?.textContent.trim();
      if (key && value) details[key] = value;
    });
    return details;
  }

  parseDownloadLink(document) {
    const downloadUrl = document.querySelector(CONFIG.SELECTORS.DOWNLOAD.LINK)?.href;
    if (!downloadUrl) {
      throw new Error('Nenhum link de download encontrado');
    }
    return downloadUrl;
  }
}

// Cliente APK
class APKClient {
  constructor() {
    this.parser = new APKParser();
  }

  async request(url, attempt = 1) {
    try {
      const response = (await scrapingClient.get(url, {
        timeout: CONFIG.API.TIMEOUT,
        headers: CONFIG.API.HEADERS
      })).data;
      return this.parser.parseDocument(response);
    } catch (error) {
      if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY * attempt));
        return this.request(url, attempt + 1);
      }
      throw error;
    }
  }

  async search(query) {
    const searchUrl = `${CONFIG.API.BASE_URL}/?s=${encodeURIComponent(query)}`;
    const document = await this.request(searchUrl);
    return this.parser.parseSearchResults(document);
  }

  async getPostDetails(url) {
    const document = await this.request(url);
    return this.parser.parsePostDetails(document);
  }

  async getDownloadLink(url) {
    const document = await this.request(url);
    return this.parser.parseDownloadLink(document);
  }

  formatDetails(details) {
    return {
      name: details['name'] || 'não disponível',
      updated: details['updated'] || 'não disponível',
      version: details['version'] || 'não disponível',
      category: details['category'] || 'não disponível',
      modinfo: details['mod info'] || 'não disponível',
      size: details['size'] || 'não disponível',
      rate: details['rate'] || 'não disponível',
      requires: details['requires android'] || 'não disponível',
      developer: details['developer'] || 'não disponível',
      googleplay: details['google play'] || 'não disponível',
      downloads: details['downloads'] || 'não disponível'
    };
  }
}

// Cache e cliente instanciados uma única vez
const cache = new APKCache();
const client = new APKClient();

/**
 * Busca e obtém informações de APK mod
 * @param {string} searchText - Termo de busca
 * @returns {Promise<Object>} Informações do APK
 */
async function apkMod(searchText) {
  try {
    if (!searchText || typeof searchText !== 'string') {
      return { error: 'Termo de busca inválido' };
    }

    // Verifica cache
    const cached = cache.get(searchText);
    if (cached) return cached;

    // Busca resultados
    const searchResult = await client.search(searchText);
    
    // Obtém detalhes do post
    const { description, details, mainPicUrl } = await client.getPostDetails(searchResult.url);
    
    // Obtém link de download
    const downloadUrl = await client.getDownloadLink(mainPicUrl);

    const result = {
      title: searchResult.title || 'sem título',
      description,
      image: searchResult.image,
      details: client.formatDetails(details),
      download: downloadUrl
    };

    // Salva no cache
    cache.set(searchText, result);

    return result;
  } catch (error) {
    console.error('Erro ao buscar APK:', error);
    return {
      error: error.message === 'Nenhum resultado encontrado'
        ? 'Nenhum resultado encontrado'
        : 'Ocorreu um erro ao buscar o APK'
    };
  }
}

export default apkMod;