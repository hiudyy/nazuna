/**
 * Sistema de Busca de Séries usando API Cognima
 * Criador: Hiudy
 * Versão: 1.0.0 - Nova API com episódios e temporadas
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
 * Busca séries usando a API Cognima
 * @param {string} query - Nome da série para buscar
 * @param {string} apiKey - API Key da Cognima
 * @param {number} limit - Limite de resultados (padrão: 3)
 * @returns {Promise<Object|null>} - Objeto com dados da série ou null
 */
async function Series(query, apiKey, limit = 3) {
  if (!query || typeof query !== 'string') {
    console.error('[Series] Query inválida');
    return null;
  }

  if (!apiKey) {
    console.error('[Series] API key não fornecida');
    return null;
  }

  try {
    const response = await axiosInstance.get(
      `${CONFIG.API_BASE_URL}/api/v1/series/buscar`,
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
      const serie = response.data.data[0]; // Pega o primeiro resultado
      
      return {
        success: true,
        id: serie.series_id,
        num: serie.num,
        nome: serie.name,
        name: serie.name,
        img: serie.cover,
        cover: serie.cover,
        rating: serie.rating,
        category_id: serie.category_id,
        
        // Detalhes completos
        details: {
          cover: serie.details?.info?.cover,
          plot: serie.details?.info?.plot,
          cast: serie.details?.info?.cast,
          director: serie.details?.info?.director,
          genre: serie.details?.info?.genre,
          releaseDate: serie.details?.info?.releaseDate,
          tmdbId: serie.details?.info?.tmdb_id,
          backdropPath: serie.details?.info?.backdrop_path,
          youtubeTrailer: serie.details?.info?.youtube_trailer,
          
          // Temporadas e episódios
          seasons: serie.details?.seasons || [],
          episodes: serie.details?.episodes || {}
        },
        
        // URLs
        playerUrl: serie.playerUrl,
        url: serie.playerUrl,
        
        // Informações de temporadas
        totalSeasons: serie.details?.seasons?.length || 0,
        
        // Metadados da busca
        count: response.data.count,
        complete: response.data.complete,
        limited: response.data.limited,
        allResults: response.data.data // Todos os resultados encontrados
      };
    }

    console.log('[Series] Nenhum resultado encontrado');
    return null;
  } catch (error) {
    console.error('[Series] Erro na busca:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Obtém informações de uma temporada específica
 * @param {Object} serieData - Dados da série retornados pela função Series
 * @param {number} seasonNumber - Número da temporada
 * @returns {Object|null} - Informações da temporada ou null
 */
export function getTemporada(serieData, seasonNumber) {
  if (!serieData?.details?.seasons) {
    console.error('[Series] Dados da série inválidos');
    return null;
  }

  const season = serieData.details.seasons.find(s => s.season_number === seasonNumber);
  
  if (!season) {
    console.error(`[Series] Temporada ${seasonNumber} não encontrada`);
    return null;
  }

  const episodes = serieData.details.episodes?.[seasonNumber] || [];

  return {
    seasonNumber: season.season_number,
    name: season.name,
    episodeCount: season.episode_count,
    episodes: episodes.map(ep => ({
      id: ep.id,
      episodeNum: ep.episode_num,
      title: ep.title,
      container: ep.container_extension,
      plot: ep.info?.plot,
      releaseDate: ep.info?.releasedate,
      duration: ep.info?.duration,
      image: ep.info?.movie_image,
      streamUrl: ep.streamUrl
    }))
  };
}

/**
 * Obtém informações de um episódio específico
 * @param {Object} serieData - Dados da série retornados pela função Series
 * @param {number} seasonNumber - Número da temporada
 * @param {number} episodeNumber - Número do episódio
 * @returns {Object|null} - Informações do episódio ou null
 */
export function getEpisodio(serieData, seasonNumber, episodeNumber) {
  if (!serieData?.details?.episodes) {
    console.error('[Series] Dados da série inválidos');
    return null;
  }

  const seasonEpisodes = serieData.details.episodes[seasonNumber];
  
  if (!seasonEpisodes) {
    console.error(`[Series] Temporada ${seasonNumber} não encontrada`);
    return null;
  }

  const episode = seasonEpisodes.find(ep => ep.episode_num === episodeNumber);
  
  if (!episode) {
    console.error(`[Series] Episódio ${episodeNumber} não encontrado na temporada ${seasonNumber}`);
    return null;
  }

  return {
    id: episode.id,
    episodeNum: episode.episode_num,
    title: episode.title,
    container: episode.container_extension,
    plot: episode.info?.plot,
    releaseDate: episode.info?.releasedate,
    duration: episode.info?.duration,
    image: episode.info?.movie_image,
    streamUrl: episode.streamUrl,
    season: seasonNumber
  };
}

export default Series;
