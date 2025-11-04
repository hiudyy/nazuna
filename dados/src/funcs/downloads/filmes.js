/**
 * Sistema de Busca de Filmes usando API Cognima
 * Criador: Hiudy
 * Versão: 3.0.0 - Nova API
 */

const axios = require('axios');

// Configuração
const CONFIG = {
  API_BASE_URL: 'https://cog2.cognima.com.br',
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
 * @returns {Promise<Object|null>} - Objeto com { id, nome, banner, watchLink } ou null
 */
async function Filmes(query, apiKey) {
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
        params: { query },
        headers: {
          'X-API-Key': apiKey
        }
      }
    );

    if (response.data.success && response.data.data) {
      const { id, nome, banner, watchLink } = response.data.data;
      
      return {
        id,
        nome,
        img: banner,
        name: nome,
        url: `${CONFIG.API_BASE_URL}${watchLink}`
      };
    }

    console.log('[Filmes] Nenhum resultado encontrado');
    return null;
  } catch (error) {
    console.error('[Filmes] Erro na busca:', error.response?.data || error.message);
    return null;
  }
}

module.exports = Filmes;