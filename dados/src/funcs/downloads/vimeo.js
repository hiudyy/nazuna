import axios from 'axios';

const BASE_URL = 'https://cog.api.br/api/v1/vimeo';

/**
 * Faz download de vídeo do Vimeo
 * @param {string} url - URL do vídeo do Vimeo
 * @param {string} apiKey - Chave de API da Cognima
 * @returns {Promise<Object>} Dados do download
 */
async function download(url, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/download`, {
      params: { url },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response.data || !response.data.success) {
      return {
        ok: false,
        msg: response.data?.message || 'Erro ao processar download do Vimeo'
      };
    }

    const { data } = response.data;
    
    // Construir URL de download
    let downloadUrl = data.downloadUrl;
    if (downloadUrl.startsWith('/')) {
      downloadUrl = `https://cog.api.br${downloadUrl}`;
    }

    console.log(`[Vimeo] Baixando: ${data.title}`);
    console.log(`[Vimeo] Qualidade: ${data.quality}`);
    console.log(`[Vimeo] Duração: ${data.duration}s`);

    // Baixar o vídeo
    const videoResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 180000, // 3 minutos
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return {
      ok: true,
      buffer: Buffer.from(videoResponse.data),
      title: data.title,
      author: data.author,
      thumbnail: data.thumbnail,
      duration: data.duration,
      description: data.description,
      views: data.views,
      likes: data.likes,
      quality: data.quality,
      width: data.width,
      height: data.height,
      filename: `${data.title.replace(/[^a-z0-9]/gi, '_')}_${data.quality}.mp4`
    };
  } catch (error) {
    console.error('Erro no download do Vimeo:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        ok: false,
        msg: 'API key inválida ou expirada'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Vídeo não encontrado ou não está disponível'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao baixar o vídeo. O arquivo pode ser muito grande.'
      };
    }

    return {
      ok: false,
      msg: error.response?.data?.message || error.message || 'Erro ao baixar do Vimeo'
    };
  }
}

/**
 * Notifica o dono sobre problemas com a API key
 */
async function notifyOwnerAboutApiKey(nazu, ownerNumber, errorMessage, command = '') {
  try {
    const message = `🚨 *ALERTA - API Vimeo*\n\n` +
      `⚠️ *Problema detectado:*\n${errorMessage}\n\n` +
      (command ? `📝 *Comando:* ${command}\n\n` : '') +
      `🔧 *Ação necessária:*\nVerifique sua chave de API da Cognima em config.json\n\n` +
      `⏰ ${new Date().toLocaleString('pt-BR')}`;

    await nazu.sendMessage(ownerNumber + '@s.whatsapp.net', { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key do Vimeo:', error);
  }
}

export default {
  download,
  notifyOwnerAboutApiKey
};
