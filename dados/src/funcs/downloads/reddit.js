import axios from 'axios';

/**
 * Baixa vídeo/mídia de um post do Reddit
 * @param {string} url - URL do post do Reddit
 * @param {string} apiKey - Chave da API Cognima
 * @returns {Promise<Object>} Objeto com sucesso, buffer e informações do post
 */
export async function download(url, apiKey) {
  try {
    const endpoint = 'https://cog.api.br/api/v1/reddit/download';
    
    // Fazer requisição para obter informações do post
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
        message: response.data?.message || 'Erro ao buscar informações do post do Reddit.'
      };
    }

    const { data } = response.data;

    // Verificar se tem URL de download
    if (!data.downloadUrl) {
      return {
        ok: false,
        message: 'Não foi possível obter o link de download do Reddit.'
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

    // Determinar extensão do arquivo baseado no tipo de mídia
    const isVideo = data.isVideo !== false;
    const extension = isVideo ? 'mp4' : 'jpg';
    
    // Gerar nome do arquivo
    const sanitizedTitle = data.title
      ? data.title.replace(/[^\w\s-]/g, '').substring(0, 50)
      : 'reddit_post';
    const filename = `${sanitizedTitle.replace(/\s+/g, '_')}.${extension}`;

    return {
      ok: true,
      buffer,
      title: data.title || 'Post do Reddit',
      author: data.author || 'Desconhecido',
      subreddit: data.subreddit || 'unknown',
      thumbnail: data.thumbnail,
      duration: data.duration || 0,
      isVideo,
      upvotes: data.upvotes || 0,
      comments: data.comments || 0,
      filename
    };

  } catch (error) {
    console.error('Erro ao baixar do Reddit:', error);

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
          message: 'Post não encontrado. Verifique se o link está correto e se o post ainda está disponível.'
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
    const message = `⚠️ *Alerta de API Key (Reddit Download)*\n\n${errorMsg}\n\nPor favor, verifique a configuração da API key no arquivo de configuração.`;
    await nazu.sendMessage(nmrdn, { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key:', error);
  }
}

export default { download, notifyOwnerAboutApiKey };
