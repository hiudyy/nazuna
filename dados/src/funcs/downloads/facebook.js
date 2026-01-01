import axios from 'axios';

const BASE_URL = 'https://cog.api.br/api/v1/facebook';

/**
 * Faz download de vídeo do Facebook em HD
 * @param {string} url - URL do vídeo do Facebook
 * @param {string} apiKey - Chave de API da Cognima
 * @returns {Promise<Object>} Dados do download
 */
async function downloadHD(url, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/download-hd`, {
      params: { url },
      headers: {
        'x-api-key': apiKey
      },
      timeout: 120000
    });

    if (!response.data || !response.data.success) {
      return {
        ok: false,
        msg: response.data?.message || 'Erro ao processar download do Facebook'
      };
    }

    const { video, allQualities } = response.data;
    
    // Procurar por vídeo válido (que não use render.php)
    let selectedVideo = null;
    const allVideos = allQualities && allQualities.length > 0 ? allQualities : [video];
    
    // Ordem de prioridade de qualidade
    const priorities = ['1080p', '720p (HD)', '720p', '480p', '360p'];
    
    // Primeiro tenta pelas prioridades
    for (const priority of priorities) {
      const found = allVideos.find(v => 
        v.resolution === priority && 
        !v.url.startsWith('/') && 
        !v.shouldRender
      );
      if (found) {
        selectedVideo = found;
        break;
      }
    }
    
    // Se não encontrou pela prioridade, pega qualquer um válido
    if (!selectedVideo) {
      selectedVideo = allVideos.find(v => !v.url.startsWith('/') && !v.shouldRender);
    }
    
    // Se não encontrou nenhum vídeo válido
    if (!selectedVideo) {
      return {
        ok: false,
        msg: 'Vídeo não disponível para download direto. O Facebook está bloqueando o acesso a este conteúdo.'
      };
    }

    // Construir a URL completa do download
    let downloadUrl = selectedVideo.url;

    console.log(`[Facebook] Baixando de: ${downloadUrl}`);
    console.log(`[Facebook] Qualidade: ${selectedVideo.resolution}`);

    // Baixar o vídeo
    const videoResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 180000, // 3 minutos para vídeos maiores
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return {
      ok: true,
      buffer: Buffer.from(videoResponse.data),
      resolution: selectedVideo.resolution,
      thumbnail: selectedVideo.thumbnail,
      allQualities: allQualities || [],
      filename: `facebook_video_${selectedVideo.resolution}.mp4`
    };
  } catch (error) {
    console.error('Erro no download do Facebook:', error);
    
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
      msg: error.response?.data?.message || error.message || 'Erro ao baixar do Facebook'
    };
  }
}

/**
 * Notifica o dono sobre problemas com a API key
 */
async function notifyOwnerAboutApiKey(nazu, ownerNumber, errorMessage, command = '') {
  try {
    const message = `🚨 *ALERTA - API Facebook*\n\n` +
      `⚠️ *Problema detectado:*\n${errorMessage}\n\n` +
      (command ? `📝 *Comando:* ${command}\n\n` : '') +
      `🔧 *Ação necessária:*\nVerifique sua chave de API da Cognima em config.json\n\n` +
      `⏰ ${new Date().toLocaleString('pt-BR')}`;

    await nazu.sendMessage(ownerNumber + '@s.whatsapp.net', { text: message });
  } catch (error) {
    console.error('Erro ao notificar dono sobre API key do Facebook:', error);
  }
}

export default {
  downloadHD,
  notifyOwnerAboutApiKey
};
