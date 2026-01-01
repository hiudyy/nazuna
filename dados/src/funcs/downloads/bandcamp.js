import axios from 'axios';

/**
 * Baixa música/álbum do Bandcamp
 * @param {string} url - URL da track ou álbum do Bandcamp
 * @param {string} apiKey - Chave da API Cognima
 * @returns {Promise<Object>} Objeto com sucesso, buffer e informações da música
 */
export async function download(url, apiKey) {
  try {
    const endpoint = 'https://cog.api.br/api/v1/bandcamp/download';
    
    // Fazer requisição para obter informações da música
    const response = await axios.get(endpoint, {
      params: { url },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response.data || !response.data.success) {
      return {
        ok: false,
        message: response.data?.message || 'Erro ao buscar informações do Bandcamp.'
      };
    }

    const { data } = response.data;

    // Verificar se tem URL de download
    if (!data.downloadUrl) {
      return {
        ok: false,
        message: 'Não foi possível obter o link de download do Bandcamp.'
      };
    }

    let downloadUrl = data.downloadUrl;

    // Verificar se a URL é relativa (começa com "/")
    if (downloadUrl.startsWith('/')) {
      downloadUrl = 'https://cog.api.br' + downloadUrl;
    }

    // Baixar o arquivo
    const fileResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 180000, // 3 minutos para download
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const buffer = Buffer.from(fileResponse.data);

    // Determinar extensão do arquivo
    const extension = data.ext || 'mp3';

    // Gerar nome do arquivo
    const sanitizedTitle = data.track || data.title
      ? (data.track || data.title).replace(/[^\w\s-]/g, '').substring(0, 50)
      : 'bandcamp_audio';
    const filename = `${sanitizedTitle.replace(/\s+/g, '_')}.${extension}`;

    return {
      ok: true,
      buffer,
      title: data.title || data.track || 'Música do Bandcamp',
      artist: data.artist || 'Desconhecido',
      album: data.album,
      thumbnail: data.thumbnail,
      duration: data.duration || 0,
      description: data.description,
      releaseDate: data.releaseDate,
      genre: data.genre,
      trackNumber: data.trackNumber,
      filename
    };

  } catch (error) {
    console.error('Erro ao baixar do Bandcamp:', error);

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
          message: 'Música não encontrada. Verifique se o link está correto e se a música ainda está disponível.'
        };
      }

      return {
        ok: false,
        message: `Erro na API: ${error.response.data?.message || 'Erro desconhecido'}`
      };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        ok: false,
        message: 'O download demorou muito tempo. Tente novamente.'
      };
    }

    return {
      ok: false,
      message: error.message || 'Erro ao processar a solicitação.'
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
    const message = `⚠️ *Alerta de API Key (Bandcamp Download)*\n\n${errorMsg}\n\nPor favor, verifique a configuração da API key no arquivo de configuração.`;
    await nazu.sendMessage(nmrdn, { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key:', error);
  }
}

export default { download, notifyOwnerAboutApiKey };
