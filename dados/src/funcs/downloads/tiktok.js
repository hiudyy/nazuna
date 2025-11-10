/**
 * Download e Pesquisa TikTok usando API Cognima
 * Updated to use cog2.cognima.com.br API
 */

import axios from 'axios';
import { notifyOwnerAboutApiKey, isApiKeyError } from '../utils/apiKeyNotifier.js';

// Função para pesquisar vídeos no TikTok
async function tiktokSearch(query, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API key não fornecida');
    }

    const response = await axios.post('https://cog2.cognima.com.br/api/v1/tiktok/search', {
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 30000
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      title: response.data.data.title,
      urls: response.data.data.urls,
      type: response.data.data.type,
      mime: response.data.data.mime,
      audio: response.data.data.audio
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

    const response = await axios.post('https://cog2.cognima.com.br/api/v1/tiktok/download', {
      url: url
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 30000
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      title: response.data.data.title,
      urls: response.data.data.urls,
      type: response.data.data.type,
      mime: response.data.data.mime,
      audio: response.data.data.audio
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