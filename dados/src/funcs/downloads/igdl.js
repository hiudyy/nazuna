/**
 * Download Instagram usando API Cognima
 * Updated to use cog.api.br API
 * Otimizado com HTTP connection pooling
 */

import { apiClient, mediaClient } from '../../utils/httpClient.js';
import { notifyOwnerAboutApiKey, isApiKeyError } from '../utils/apiKeyNotifier.js';

// Função para baixar post do Instagram
async function igdl(url, apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API key não fornecida');
    }

    const response = await apiClient.post('https://cog.api.br/api/v1/instagram/download', {
      url: url
    }, {
      headers: { 'X-API-Key': apiKey },
      timeout: 120000
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    const apiData = response.data.data;
    
    // Processar os dados para baixar os buffers
    const results = [];
    
    if (apiData.media && Array.isArray(apiData.media)) {
      for (const mediaItem of apiData.media) {
        try {
          // Baixar o conteúdo da mídia
          const mediaResponse = await mediaClient.get(mediaItem.url, { 
            timeout: 120000
          });
          
          results.push({
            type: mediaItem.type || 'image', // 'video' ou 'image'
            buff: mediaResponse.data,
            url: mediaItem.url,
            mime: mediaItem.mime || 'application/octet-stream'
          });
        } catch (downloadError) {
          console.error('Erro ao baixar mídia do Instagram:', downloadError.message);
          // Continua com as outras mídias mesmo se uma falhar
        }
      }
    }

    if (results.length === 0) {
      throw new Error('Nenhuma mídia foi baixada com sucesso');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      data: results,
      count: apiData.count || results.length
    };

  } catch (error) {
    console.error('Erro no download Instagram:', error.message);
    
    if (isApiKeyError(error)) {
      throw new Error(`API key inválida ou expirada: ${error.response?.data?.message || error.message}`);
    }
    
    return { 
      ok: false, 
      msg: 'Erro ao baixar post: ' + (error.response?.data?.message || error.message) 
    };
  }
}

export {
  igdl as dl
};