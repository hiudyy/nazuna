/**
 * Search Service - Implementação direta sem API externa
 * Usa DuckDuckGo como fonte
 */

import axios from 'axios';
import { parseHTML } from 'linkedom';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Cache simples
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

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
 * Pesquisar no DuckDuckGo
 * @param {string} query - Termo de pesquisa
 * @param {number} maxResults - Número máximo de resultados
 * @returns {Promise<Object>} Resultados da pesquisa
 */
async function search(query, maxResults = 10) {
  try {
    if (!query || query.trim().length === 0) {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    // Verificar cache
    const cached = getCached(`search:${query}:${maxResults}`);
    if (cached) return { ok: true, ...cached, cached: true };

    console.log(`[Search] Pesquisando "${query}"`);

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 60000
    });

    const { document } = parseHTML(response.data);
    const results = [];

    document.querySelectorAll('.result').forEach((element, index) => {
      if (index >= maxResults) return;

      const titleEl = element.querySelector('.result__title a');
      const snippetEl = element.querySelector('.result__snippet');
      const urlEl = element.querySelector('.result__url');

      const title = titleEl?.textContent?.trim();
      let url = urlEl?.getAttribute('href') || titleEl?.getAttribute('href');
      const description = snippetEl?.textContent?.trim();

      if (title && url) {
        // Limpar URL do DuckDuckGo redirect
        if (url.includes('uddg=')) {
          const match = url.match(/uddg=([^&]+)/);
          if (match) url = decodeURIComponent(match[1]);
        }

        let displayUrl = '';
        try { displayUrl = new URL(url).hostname; } catch {}

        results.push({
          position: results.length + 1,
          title,
          url,
          description: description || '',
          displayUrl
        });
      }
    });

    const result = {
      query,
      totalResults: results.length,
      results
    };

    setCache(`search:${query}:${maxResults}`, result);

    return { ok: true, ...result };
  } catch (error) {
    console.error('[Search] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao pesquisar' };
  }
}

/**
 * Pesquisar notícias
 * @param {string} query - Termo de pesquisa
 * @param {number} maxResults - Número máximo de resultados
 * @returns {Promise<Object>} Resultados da pesquisa
 */
async function searchNews(query, maxResults = 10) {
  try {
    if (!query || query.trim().length === 0) {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    // Adicionar "news" à query para focar em notícias
    const newsQuery = `${query} news`;
    const result = await search(newsQuery, maxResults);

    if (result.ok) {
      result.type = 'news';
    }

    return result;
  } catch (error) {
    console.error('[Search] Erro na pesquisa de notícias:', error.message);
    return { ok: false, msg: error.message || 'Erro ao pesquisar notícias' };
  }
}

export default { search, searchNews };
export { search, searchNews };
