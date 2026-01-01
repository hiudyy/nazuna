/**
 * Sistema de Pesquisa de Plugins Minecraft Otimizado
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 */

import axios from 'axios';
import { parseHTML } from 'linkedom';

// Configurações
const CONFIG = {
  API: {
    BASE_URL: 'https://modrinth.com',
    TIMEOUT: 120000,
    HEADERS: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  },
  SEARCH: {
    MAX_RESULTS: 5,
    MIN_DESCRIPTION_LENGTH: 20
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
    PROJECT_CARD: '.project-card.base-card.padding-bg',
    TITLE: '.name',
    DESCRIPTION: '.description',
    LINK: 'a',
    ICON: 'img',
    AUTHOR: '.author .title-link',
    VERSION: '.version',
    DOWNLOADS: '.downloads',
    CATEGORIES: '.categories .category'
  }
};

// Cache para resultados
class PluginCache {
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

// Parser de Plugins
class PluginParser {
  constructor(document) {
    this.document = document;
  }

  getTextContent(element, selector) {
    return element.querySelector(selector)?.textContent.trim() || '';
  }

  getAttributeValue(element, selector, attribute) {
    return element.querySelector(selector)?.getAttribute(attribute) || '';
  }

  formatUrl(path) {
    if (!path || path === '#') return '';
    return path.startsWith('http') ? path : `${CONFIG.API.BASE_URL}${path}`;
  }

  parsePlugin(projectCard) {
    if (!projectCard) return null;

    const title = this.getTextContent(projectCard, CONFIG.SELECTORS.TITLE);
    if (!title) return null;

    const description = this.getTextContent(projectCard, CONFIG.SELECTORS.DESCRIPTION);
    if (!description || description.length < CONFIG.SEARCH.MIN_DESCRIPTION_LENGTH) {
      return null;
    }

    const link = this.formatUrl(this.getAttributeValue(projectCard, CONFIG.SELECTORS.LINK, 'href'));
    if (!link) return null;

    let icon = this.getAttributeValue(projectCard, CONFIG.SELECTORS.ICON, 'src');
    icon = this.formatUrl(icon);

    const author = this.getTextContent(projectCard, CONFIG.SELECTORS.AUTHOR) || 'Desconhecido';
    const version = this.getTextContent(projectCard, CONFIG.SELECTORS.VERSION);
    const downloads = this.getTextContent(projectCard, CONFIG.SELECTORS.DOWNLOADS);

    const categories = Array.from(projectCard.querySelectorAll(CONFIG.SELECTORS.CATEGORIES))
      .map(cat => cat.textContent.trim())
      .filter(Boolean);

    return {
      name: title,
      desc: description,
      url: link,
      image: icon,
      creator: author,
      version,
      downloads,
      categories
    };
  }
}

// Cliente Modrinth
class ModrinthClient {
  constructor() {
    this.axios = axios.create({
      baseURL: CONFIG.API.BASE_URL,
      timeout: CONFIG.API.TIMEOUT,
      headers: CONFIG.API.HEADERS
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

  async searchPlugins(query) {
    const response = await this.request({
      method: 'GET',
      url: `/plugins?q=${encodeURIComponent(query)}`
    });

    return parseHTML(response.data).document;
  }
}

// Cache e cliente instanciados uma única vez
const cache = new PluginCache();
const client = new ModrinthClient();

/**
 * Busca plugins do Minecraft
 * @param {string} nome - Nome do plugin
 * @returns {Promise<Object>} Informações do plugin
 */
async function buscarPlugin(nome) {
  try {
    if (!nome || typeof nome !== 'string') {
      return { ok: false, msg: 'Nome do plugin inválido' };
    }

    // Verifica cache
    const cached = cache.get(nome);
    if (cached) return cached;

    // Busca plugins
    const document = await client.searchPlugins(nome);
    const parser = new PluginParser(document);

    // Procura primeiro projeto válido
    const projectCard = document.querySelector(CONFIG.SELECTORS.PROJECT_CARD);
    const plugin = parser.parsePlugin(projectCard);

    if (!plugin) {
      return { ok: false, msg: 'Nenhum plugin foi encontrado.' };
    }

    const result = {
      ok: true,
      ...plugin
    };

    // Salva no cache
    cache.set(nome, result);

    return result;
  } catch (error) {
    console.error('Erro ao buscar plugin:', error);
    return {
      ok: false,
      msg: error.message.includes('network')
        ? 'Erro de conexão com o servidor'
        : 'Ocorreu um erro ao buscar o plugin'
    };
  }
}

export default buscarPlugin;