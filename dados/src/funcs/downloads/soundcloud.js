import swiftly from 'swiftly';

const BASE_URL = 'https://cog.api.br/api/v1/soundcloud';

/**
 * Faz download direto de uma música do SoundCloud via URL
 * @param {string} url - URL do track do SoundCloud
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

    if (!response || !response.success) {
      return {
        ok: false,
        msg: response?.message || 'Erro ao processar download do SoundCloud'
      };
    }

    // Acessar dados corretamente - pode estar em response.data.data ou response.data
    const data = response.data?.data || response.data;
    
    // Baixar o arquivo de áudio
    const audioBuffer = await swiftly.get(data?.downloadUrl, {
      responseType: 'buffer',
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(audioBuffer),
      title: data.title,
      artist: data.artist,
      thumbnail: data.thumbnail,
      filename: `${data.title}.mp3`
    };
  } catch (error) {
    console.error('Erro no download do SoundCloud:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        ok: false,
        msg: 'API key inválida ou expirada'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Música não encontrada no SoundCloud'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao baixar a música. Tente novamente.'
      };
    }

    return {
      ok: false,
      msg: error.response?.data?.message || error.message || 'Erro ao baixar do SoundCloud'
    };
  }
}

/**
 * Busca e faz download de uma música do SoundCloud
 * @param {string} query - Nome da música ou artista
 * @param {string} apiKey - Chave de API da Cognima
 * @returns {Promise<Object>} Dados da busca e download
 */
async function searchDownload(query, apiKey) {
  try {
    const response = await swiftly.get(`${BASE_URL}/search-download`, {
      params: { q: query },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response || !response.success) {
      return {
        ok: false,
        msg: response?.message || 'Erro ao buscar música no SoundCloud'
      };
    }

    const { track, download: downloadData } = response;
    
    // Baixar o arquivo de áudio
    const audioBuffer = await swiftly.get(downloadData.downloadUrl, {
      responseType: 'buffer',
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(audioBuffer),
      query: response.query || query,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
        permalink_url: track.permalink_url,
        playback_count: track.playback_count,
        likes_count: track.likes_count,
        genre: track.genre,
        created_at: track.created_at
      },
      title: downloadData.title,
      artist: downloadData.artist,
      thumbnail: downloadData.thumbnail,
      filename: `${downloadData.title}.mp3`
    };
  } catch (error) {
    console.error('Erro na busca/download do SoundCloud:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        ok: false,
        msg: 'API key inválida ou expirada'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Nenhuma música encontrada com esse nome'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao buscar/baixar a música. Tente novamente.'
      };
    }

    return {
      ok: false,
      msg: error.response?.data?.message || error.message || 'Erro ao buscar no SoundCloud'
    };
  }
}

/**
 * Notifica o dono sobre problemas com a API key
 */
async function notifyOwnerAboutApiKey(nazu, ownerNumber, errorMessage, command = '') {
  try {
    const message = `🚨 *ALERTA - API SoundCloud*\n\n` +
      `⚠️ *Problema detectado:*\n${errorMessage}\n\n` +
      (command ? `📝 *Comando:* ${command}\n\n` : '') +
      `🔧 *Ação necessária:*\nVerifique sua chave de API da Cognima em config.json\n\n` +
      `⏰ ${new Date().toLocaleString('pt-BR')}`;

    await nazu.sendMessage(ownerNumber + '@s.whatsapp.net', { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key do SoundCloud:', error);
  }
}

export default {
  download,
  searchDownload,
  notifyOwnerAboutApiKey
};
