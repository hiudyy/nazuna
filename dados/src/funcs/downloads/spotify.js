import axios from 'axios';

const BASE_URL = 'https://cog.api.br/api/v1/spotify';

/**
 * Faz download direto de uma música do Spotify via URL
 * @param {string} url - URL do track do Spotify
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
        msg: response.data?.message || 'Erro ao processar download do Spotify'
      };
    }

    const { data } = response.data;
    
    // Baixar o arquivo de áudio
    const audioResponse = await axios.get(data.downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(audioResponse.data),
      title: data.title,
      artists: data.artists,
      albumImage: data.albumImage,
      year: data.year,
      duration: data.duration,
      filename: `${data.artists.join(', ')} - ${data.title}.mp3`
    };
  } catch (error) {
    console.error('Erro no download do Spotify:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        ok: false,
        msg: 'API key inválida ou expirada'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Música não encontrada no Spotify'
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
      msg: error.response?.data?.message || error.message || 'Erro ao baixar do Spotify'
    };
  }
}

/**
 * Busca e faz download de uma música do Spotify
 * @param {string} query - Nome da música ou artista
 * @param {string} apiKey - Chave de API da Cognima
 * @returns {Promise<Object>} Dados da busca e download
 */
async function searchDownload(query, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/search-download`, {
      params: { q: query },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response.data || !response.data.success) {
      return {
        ok: false,
        msg: response.data?.message || 'Erro ao buscar música no Spotify'
      };
    }

    const { track, download: downloadData } = response.data;
    
    // Baixar o arquivo de áudio
    const audioResponse = await axios.get(downloadData.downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 120000
    });

    return {
      ok: true,
      buffer: Buffer.from(audioResponse.data),
      query: response.data.query,
      track: {
        name: track.name,
        artists: track.artists,
        link: track.link
      },
      title: downloadData.title,
      artists: downloadData.artists,
      albumImage: downloadData.albumImage,
      year: downloadData.year,
      duration: downloadData.duration,
      filename: `${downloadData.artists.join(', ')} - ${downloadData.title}.mp3`
    };
  } catch (error) {
    console.error('Erro na busca/download do Spotify:', error);
    
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
      msg: error.response?.data?.message || error.message || 'Erro ao buscar no Spotify'
    };
  }
}

/**
 * Notifica o dono sobre problemas com a API key
 */
async function notifyOwnerAboutApiKey(nazu, ownerNumber, errorMessage, command = '') {
  try {
    const message = `🚨 *ALERTA - API Spotify*\n\n` +
      `⚠️ *Problema detectado:*\n${errorMessage}\n\n` +
      (command ? `📝 *Comando:* ${command}\n\n` : '') +
      `🔧 *Ação necessária:*\nVerifique sua chave de API da Cognima em config.json\n\n` +
      `⏰ ${new Date().toLocaleString('pt-BR')}`;

    await nazu.sendMessage(ownerNumber + '@s.whatsapp.net', { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key do Spotify:', error);
  }
}

export default {
  download,
  searchDownload,
  notifyOwnerAboutApiKey
};
