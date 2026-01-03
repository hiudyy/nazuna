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

    if (!response?.data?.success) {
      throw new Error('Resposta inválida da API');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      data: response.data.data
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

    // Verificar se a resposta contém dados válidos
    const bufferData = response.data?.data?.buffer || response.data?.buffer || response.data;
    
    if (!bufferData) {
      console.error('Erro no download MP3: Resposta sem dados de buffer');
      return { 
        ok: false, 
        msg: 'Erro ao baixar áudio: Resposta inválida da API (sem dados)' 
      };
    }

    // Converter para Buffer se necessário
    let finalBuffer;
    if (Buffer.isBuffer(bufferData)) {
      finalBuffer = bufferData;
    } else if (typeof bufferData === 'string') {
      // Se for base64
      finalBuffer = Buffer.from(bufferData, 'base64');
    } else if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
      // Se for objeto Buffer serializado
      finalBuffer = Buffer.from(bufferData.data);
    } else if (ArrayBuffer.isView(bufferData) || bufferData instanceof ArrayBuffer) {
      finalBuffer = Buffer.from(bufferData);
    } else {
      console.error('Erro no download MP3: Tipo de buffer desconhecido:', typeof bufferData);
      return { 
        ok: false, 
        msg: 'Erro ao baixar áudio: Formato de resposta não suportado' 
      };
    }

    if (!finalBuffer || finalBuffer.length === 0) {
      return { 
        ok: false, 
        msg: 'Erro ao baixar áudio: Buffer vazio recebido' 
      };
    }

    return {
      ok: true,
      buffer: finalBuffer,
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

    // Verificar se a resposta contém dados válidos
    const bufferData = response.data?.data?.buffer || response.data?.buffer || response.data;
    
    if (!bufferData) {
      console.error('Erro no download MP4: Resposta sem dados de buffer');
      return { 
        ok: false, 
        msg: 'Erro ao baixar vídeo: Resposta inválida da API (sem dados)' 
      };
    }

    // Converter para Buffer se necessário
    let finalBuffer;
    if (Buffer.isBuffer(bufferData)) {
      finalBuffer = bufferData;
    } else if (typeof bufferData === 'string') {
      // Se for base64
      finalBuffer = Buffer.from(bufferData, 'base64');
    } else if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
      // Se for objeto Buffer serializado
      finalBuffer = Buffer.from(bufferData.data);
    } else if (ArrayBuffer.isView(bufferData) || bufferData instanceof ArrayBuffer) {
      finalBuffer = Buffer.from(bufferData);
    } else {
      console.error('Erro no download MP4: Tipo de buffer desconhecido:', typeof bufferData);
      return { 
        ok: false, 
        msg: 'Erro ao baixar vídeo: Formato de resposta não suportado' 
      };
    }

    if (!finalBuffer || finalBuffer.length === 0) {
      return { 
        ok: false, 
        msg: 'Erro ao baixar vídeo: Buffer vazio recebido' 
      };
    }

    return {
      ok: true,
      buffer: finalBuffer,
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