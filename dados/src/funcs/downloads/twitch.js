import swiftly from 'swiftly';

const BASE_URL = 'https://cog.api.br/api/v1/twitch';

/**
 * Faz download de clip ou VOD do Twitch
 * @param {string} url - URL do clip ou VOD do Twitch
 * @param {string} apiKey - Chave de API da Cognima
 * @returns {Promise<Object>} Dados do download
 */
async function download(url, apiKey) {
  try {
    const response = await swiftly.get(`${BASE_URL}/download`, {
      params: { url },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response?.data || !response.data.success) {
      return {
        ok: false,
        msg: response?.data?.message || 'Erro ao processar download do Twitch'
      };
    }

    const data = response.data.data;
    
    // Construir URL de download
    let downloadUrl = data?.downloadUrl;
    if (downloadUrl.startsWith('/')) {
      downloadUrl = `https://cog.api.br${downloadUrl}`;
    }

    console.log(`[Twitch] Baixando: ${data.title}`);
    console.log(`[Twitch] Tipo: ${data.type}`);
    console.log(`[Twitch] Streamer: ${data.streamer}`);
    console.log(`[Twitch] Duração: ${data.duration}s`);

    // Baixar o vídeo
    const videoBuffer = await swiftly.get(downloadUrl, {
      responseType: 'buffer',
      timeout: 180000, // 3 minutos
    });

    return {
      ok: true,
      buffer: Buffer.from(videoBuffer.data),
      title: data.title,
      streamer: data.streamer,
      thumbnail: data.thumbnail,
      duration: data.duration,
      type: data.type,
      views: data.views,
      game: data.game,
      timestamp: data.timestamp,
      filename: `twitch_${data.type}_${data.streamer}_${data.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}.mp4`
    };
  } catch (error) {
    console.error('Erro no download do Twitch:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        ok: false,
        msg: 'API key inválida ou expirada'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Vídeo ou clip não encontrado ou não está disponível'
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
      msg: error.response?.data?.message || error.message || 'Erro ao baixar do Twitch'
    };
  }
}

/**
 * Notifica o dono sobre problemas com a API key
 */
async function notifyOwnerAboutApiKey(nazu, ownerNumber, errorMessage, command = '') {
  try {
    const message = `🚨 *ALERTA - API Twitch*\n\n` +
      `⚠️ *Problema detectado:*\n${errorMessage}\n\n` +
      (command ? `📝 *Comando:* ${command}\n\n` : '') +
      `🔧 *Ação necessária:*\nVerifique sua chave de API da Cognima em config.json\n\n` +
      `⏰ ${new Date().toLocaleString('pt-BR')}`;

    await nazu.sendMessage(ownerNumber + '@s.whatsapp.net', { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key do Twitch:', error);
  }
}

export default {
  download,
  notifyOwnerAboutApiKey
};
