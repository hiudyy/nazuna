/**
 * Download e Pesquisa YouTube usando API Cognima
 * Updated to use cog.api.br API
 * Otimizado com HTTP connection pooling
 */

import { apiClient } from '../../utils/httpClient.js';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { notifyOwnerAboutApiKey, isApiKeyError } from '../utils/apiKeyNotifier.js';

// Função para buscar vídeos no YouTube
async function search(query, apiKey) {
  try {
    if (!apiKey) throw new Error('API key não fornecida');

    const response = await apiClient.post('https://cog.api.br/api/v1/youtube/search', {
      query: query
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      data: response.data.data.data
    };

  } catch (error) {
    console.error('Erro na busca YouTube:', error.message);
    
    if (isApiKeyError(error)) {
      throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
    }
    
    return { 
      ok: false, 
      msg: 'Erro ao buscar vídeo: ' + (error.response?.data?.message || error.message) 
    };
  }
}

// Função para baixar áudio (MP3)
async function mp3(url, quality = 128, apiKey) {
  try {
    if (!apiKey) throw new Error('API key não fornecida');

    const response = await apiClient.post('https://cog.api.br/api/v1/youtube/mp3', {
      url: url,
      quality: 'mp3'
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(response.data.data.buffer),
      filename: `audio_${Date.now()}_${quality}kbps.mp3`,
      quality: `${quality}kbps`
    };

  } catch (error) {
    console.error('Erro no download MP3:', error.message);
    
    if (isApiKeyError(error)) {
      throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
    }
    
    return { 
      ok: false, 
      msg: 'Erro ao baixar áudio: ' + (error.response?.data?.message || error.message) 
    };
  }
}

// Função para baixar vídeo (MP4)
async function mp4(url, quality = 360, apiKey) {
  try {
    if (!apiKey) throw new Error('API key não fornecida');

    const response = await apiClient.post('https://cog.api.br/api/v1/youtube/mp4', {
      url: url,
      quality: '360p'
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(response.data.data.buffer),
      filename: `video_${Date.now()}_${quality}p.mp4`,
      quality: `${quality}p`
    };

  } catch (error) {
    console.error('Erro no download MP4:', error.message);
    
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
  search,
  mp3,
  mp4
};

export const ytmp3 = mp3;
export const ytmp4 = mp4;