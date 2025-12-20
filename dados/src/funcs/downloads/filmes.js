/**
 * Sistema de Busca de Filmes usando API Cognima
 * Criador: Hiudy
 * Versão: 4.0.0 - Nova API com detalhes completos
 */

import axios from 'axios';

// Configuração
const CONFIG = {
  API_BASE_URL: 'https://cog.api.br',
  TIMEOUT: 10000
};

// Cliente Axios com configurações
const axiosInstance = axios.create({
  timeout: CONFIG.TIMEOUT
});

/**
 * Busca filmes usando a API Cognima
 * @param {string} query - Nome do filme para buscar
 * @param {string} apiKey - API Key da Cognima
 * @param {number} limit - Limite de resultados (padrão: 5)
 * @returns {Promise<Object|null>} - Objeto com dados do filme ou null
 */
async function Filmes(query, apiKey, limit = 5) {
  if (!query || typeof query !== 'string') {
    console.error('[Filmes] Query inválida');
    return null;
  }

  if (!apiKey) {
    console.error('[Filmes] API key não fornecida');
    return null;
  }

  try {
    const response = await axiosInstance.get(
      `${CONFIG.API_BASE_URL}/api/v1/filmes/buscar`,
      {
        params: { 
          query,
          complete: true,
          limit 
        },
        headers: {
          'X-API-Key': apiKey
        }
      }
    );

    if (response.data.success && response.data.data && response.data.data.length > 0) {
      const filme = response.data.data[0]; // Pega o primeiro resultado
      
      return {
        success: true,
        id: filme.stream_id,
        num: filme.num,
        nome: filme.name,
        name: filme.name,
        img: filme.stream_icon,
        banner: filme.stream_icon,
        rating: filme.rating,
        category_id: filme.category_id,
        container: filme.container_extension,
        
        // Detalhes completos
        details: {
          cover: filme.details?.info?.cover,
          plot: filme.details?.info?.plot,
          cast: filme.details?.info?.cast,
          director: filme.details?.info?.director,
          genre: filme.details?.info?.genre,
          releaseDate: filme.details?.info?.releasedate,
          duration: filme.details?.info?.duration,
          durationSecs: filme.details?.info?.duration_secs,
          tmdbId: filme.details?.info?.tmdb_id,
          backdropPath: filme.details?.info?.backdrop_path,
          youtubeTrailer: filme.details?.info?.youtube_trailer
        },
        
        // URLs
        streamUrl: filme.streamUrl,
        playerUrl: filme.playerUrl,
        url: filme.playerUrl,
        
        // Metadados da busca
        count: response.data.count,
        complete: response.data.complete,
        limited: response.data.limited,
        allResults: response.data.data // Todos os resultados encontrados
      };
    }

    console.log('[Filmes] Nenhum resultado encontrado');
    return null;
  } catch (error) {
    console.error('[Filmes] Erro na busca:', error.response?.data || error.message);
    return null;
  }
}

export default Filmes;