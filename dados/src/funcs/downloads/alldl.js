import swiftly from 'swiftly';

/**
 * Extrai todos os formatos de mídia disponíveis de uma URL
 * @param {string} url - URL de qualquer plataforma suportada
 * @param {string} apiKey - Chave da API Cognima
 * @returns {Promise<Object>} Objeto com metadata e todos os formatos disponíveis
 */
export async function getAllMedia(url, apiKey) {
  try {
    const endpoint = 'https://cog.api.br/api/v1/alldl';
    
    // Fazer requisição para obter todos os formatos
    const response = await swiftly.get(endpoint, {
      params: { url },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000 // 2 minutos
    });

    if (!response || !response.success) {
      return {
        ok: false,
        message: response?.message || 'Erro ao buscar informações da mídia.'
      };
    }

    // Acessar dados corretamente - pode estar em response.data.data ou response.data
    const data = response.data?.data || response.data;

    return {
      ok: true,
      metadata: data?.metadata || {},
      media: data?.media || [],
      totalItems: data?.totalItems || 0,
      videoCount: data?.videoCount || 0,
      audioCount: data?.audioCount || 0,
      imageCount: data?.imageCount || 0
    };

  } catch (error) {
    console.error('Erro ao buscar formatos de mídia:', error);

    // Tratar erros específicos
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return {
          ok: false,
          message: 'Erro de autenticação da API. Verifique sua chave de API.',
          needsNotification: true
        };
      }
      
      if (status === 404) {
        return {
          ok: false,
          message: 'Conteúdo não encontrado. Verifique se o link está correto.'
        };
      }

      return {
        ok: false,
        message: `Erro na API: ${error.response?.message || 'Erro desconhecido'}`
      };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        ok: false,
        message: 'A solicitação demorou muito tempo. Tente novamente.'
      };
    }

    return {
      ok: false,
      message: error.message || 'Erro ao processar a solicitação.'
    };
  }
}

/**
 * Baixa um formato específico de mídia
 * @param {string} mediaUrl - URL direta da mídia
 * @param {string} type - Tipo de mídia (video, audio, image)
 * @returns {Promise<Object>} Buffer do arquivo baixado
 */
export async function downloadMedia(mediaUrl, type = 'video') {
  try {
    const response = await swiftly.get(mediaUrl, {
      responseType: 'buffer',
      timeout: 180000, // 3 minutos
    });

    const buffer = Buffer.from(response);

    return {
      ok: true,
      buffer,
      size: buffer.length
    };

  } catch (error) {
    console.error('Erro ao baixar mídia:', error);
    return {
      ok: false,
      message: 'Erro ao baixar o arquivo.'
    };
  }
}

/**
 * Notifica o dono do bot sobre erro de API key
 * @param {Object} nazu - Instância do bot
 * @param {string} nmrdn - Número do dono
 * @param {string} errorMsg - Mensagem de erro
 */
export async function notifyOwnerAboutApiKey(nazu, nmrdn, errorMsg) {
  try {
    const message = `⚠️ *Alerta de API Key (AllDL)*\n\n${errorMsg}\n\nPor favor, verifique a configuração da API key no arquivo de configuração.`;
    await nazu.sendMessage(nmrdn, { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key:', error);
  }
}

export default { getAllMedia, downloadMedia, notifyOwnerAboutApiKey };
