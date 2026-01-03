/**
 * Download e Pesquisa TikTok usando API Cognima
 * Updated to use cog.api.br API
 * Otimizado com HTTP connection pooling
 */

import { apiClient } from '../../utils/httpClient.js';
import { notifyOwnerAboutApiKey, isApiKeyError } from '../utils/apiKeyNotifier.js';

// Função para pesquisar vídeos no TikTok
async function tiktokSearch(query, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API key não fornecida');
    }

    const response = await apiClient.post('https://cog.api.br/api/v1/tiktok/search', {
      query: query
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    if (!response.success || !response) {
      throw new Error('Resposta inválida da API');
    }

    // Acessar dados corretamente - pode estar em response.data.data ou response.data
    const apiData = response.data?.data || response.data;
    return {
      ok: true,
      criador: 'Hiudy',
      title: apiData?.title,
      urls: apiData?.urls,
      type: apiData?.type,
      mime: apiData?.mime,
      audio: apiData?.audio
    };

  } catch (error) {
    console.error('Erro na pesquisa TikTok:', error.message);
    
    if (isApiKeyError(error)) {
      throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
    }
    
    return { 
      ok: false, 
      msg: 'Erro ao pesquisar vídeo: ' + (error.response?.data?.message || error.message) 
    };
  }
}

// Função para baixar vídeo do TikTok
async function tiktokDownload(url, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API key não fornecida');
    }

    const response = await apiClient.post('https://cog.api.br/api/v1/tiktok/download', {
      url: url
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    if (!response.success || !response) {
      throw new Error('Resposta inválida da API');
    }

    // Acessar dados corretamente - pode estar em response.data.data ou response.data
    const apiData = response.data?.data || response.data;
    return {
      ok: true,
      criador: 'Hiudy',
      title: apiData?.title,
      urls: apiData?.urls,
      type: apiData?.type,
      mime: apiData?.mime,
      audio: apiData?.audio
    };

  } catch (error) {
    console.error('Erro no download TikTok:', error.message);
    
    if (isApiKeyError(error)) {
      throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
    }
    
    return { 
      ok: false, 
      msg: 'Erro ao baixar vídeo: ' + (error.response?.data?.message || error.message) 
    };
  }
}

export {
  tiktokSearch as search,
  tiktokDownload as dl
};