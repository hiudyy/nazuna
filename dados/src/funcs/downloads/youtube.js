/**
 * Download e Pesquisa YouTube usando API Cognima
 * Updated to use cog2.cognima.com.br API
 */

const axios = require('axios');
const { spawn } = require('child_process');
const { Readable } = require('stream');

const dailyNotifications = {
  count: 0,
  date: null,
  maxNotifications: 3
};

function canSendNotification() {
  const today = new Date().toDateString();
  
  if (dailyNotifications.date !== today) {
    dailyNotifications.count = 0;
    dailyNotifications.date = today;
  }
  
  return dailyNotifications.count < dailyNotifications.maxNotifications;
}

function incrementNotificationCount() {
  dailyNotifications.count++;
}

function isApiKeyError(error) {
  if (!error) return false;
  
  const errorMessage = (error.message || '').toLowerCase();
  const statusCode = error.response?.status;
  const responseData = error.response?.data;
  
  const authErrorCodes = [401, 403, 429];
  const keyErrorMessages = [
    'api key', 'unauthorized', 'invalid token', 'authentication failed',
    'access denied', 'quota exceeded', 'rate limit', 'forbidden',
    'token expired', 'invalid credentials'
  ];
  
  if (authErrorCodes.includes(statusCode)) return true;

  if (keyErrorMessages.some(msg => errorMessage.includes(msg))) return true;
  
  if (responseData && typeof responseData === 'object') {
    const responseString = JSON.stringify(responseData).toLowerCase();
    if (keyErrorMessages.some(msg => responseString.includes(msg))) return true;
  }
  
  return false;
}

// Notificação de API Key
async function notifyOwnerAboutApiKey(nazu, ownerNumber, error, command) {
  try {
    if (!canSendNotification()) {
      if (dailyNotifications.count === dailyNotifications.maxNotifications) {
        const limitMessage = `🔕 *LIMITE DE AVISOS ATINGIDO*

Já foram enviados ${dailyNotifications.maxNotifications} avisos sobre problemas com API key hoje.

Para evitar spam, não enviarei mais notificações até amanhã.

🔧 *Verifique a API key do YouTube (Cognima) quando possível.*`;

        const ownerId = ownerNumber?.replace(/[^\d]/g, '') + '@s.whatsapp.net';
        await nazu.sendText(ownerId, limitMessage);
        incrementNotificationCount();
      }
      return;
    }

    const message = `🚨 *ALERTA - PROBLEMA COM API KEY YOUTUBE* 🚨

📋 *O que é API Key?*
Uma API Key é como uma "senha especial" que permite ao bot acessar os serviços do YouTube através da plataforma Cognima. É necessária para baixar vídeos e áudios.

⚠️ *Problema detectado:*
• *Comando afetado:* ${command}
• *Erro específico:* ${error || 'Chave inválida ou expirada'}
• *Data/Hora:* ${new Date().toLocaleString('pt-BR')}
• *Aviso:* ${dailyNotifications.count + 1}/${dailyNotifications.maxNotifications} de hoje

� *Informações da API Cognima:*
• Oferece 150 requisições GRATUITAS por dia
• Após esgotar, é necessário adquirir um plano pago
• Para adquirir: wa.me/553399285117
• Painel: https://cog2.cognima.com.br

🔧 *Possíveis causas e soluções:*
1️⃣ *API Key expirada* → Renovar no painel Cognima
2️⃣ *Limite de 150 requisições esgotado* → Aguardar próximo dia ou adquirir via WhatsApp
3️⃣ *Chave incorreta* → Verificar se está correta no config.json
4️⃣ *Problema temporário do servidor* → Aguardar alguns minutos

� *Como verificar:*
• Acesse: https://cog2.cognima.com.br/dashboard
• Verifique o status da sua API Key
• Confira quantas requisições restam

⚙️ *Para corrigir:*
• Use o comando: !apikey suachave
• Exemplo: !apikey ABC123XYZ789
• Reinicie o bot após configurar

💬 Você receberá no máximo 3 avisos por dia para evitar spam.`;

    const ownerId = ownerNumber?.replace(/[^\d]/g, '') + '@s.whatsapp.net';
    await nazu.sendText(ownerId, message);
    
    incrementNotificationCount();
    
  } catch (notifyError) {
    console.error('❌ Erro ao notificar dono sobre API key:', notifyError.message);
  }
}

// Função para buscar vídeos no YouTube
async function search(query, apiKey) {
  try {
    if (!apiKey) throw new Error('API key não fornecida');

    const response = await axios.post('https://cog2.cognima.com.br/api/v1/youtube/search', {
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Resposta inválida da API');
    }

    return {
      ok: true,
      criador: 'Hiudy',
      data: response.data.data.data
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

    const response = await axios.post('https://cog2.cognima.com.br/api/v1/youtube/mp3', {
      url: url,
      quality: 'mp3'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return {
      ok: true,
      buffer: Buffer.from(response.data.data.buffer),
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

    const response = await axios.post('https://cog2.cognima.com.br/api/v1/youtube/mp4', {
      url: url,
      quality: '360p'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return {
      ok: true,
      buffer: Buffer.from(response.data.data.buffer),
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

module.exports = {
  search: (text, apiKey) => search(text, apiKey),
  mp3: (url, q, apiKey) => mp3(url, q, apiKey),
  mp4: (url, q, apiKey) => mp4(url, q, apiKey),
  ytmp3: (url, q, apiKey) => mp3(url, q, apiKey),
  ytmp4: (url, q, apiKey) => mp4(url, q, apiKey),
  notifyOwnerAboutApiKey
};