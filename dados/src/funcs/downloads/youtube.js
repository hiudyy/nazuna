/**
 * YouTube Download - Sistema de Fila Rotativa com Múltiplas Fontes
 * Implementação direta sem dependência de API externa (cog.api.br)
 * NÃO usa yt-dlp - apenas APIs web
 * 
 * Fontes disponíveis (em ordem de prioridade):
 * - Nayan Video Downloader
 * - Adonix (ytmp3.mobi)
 * - OceanSaver
 * - Y2mate
 * - SaveTube
 * - API Nodz (Principal para MP3)
 */

import axios from 'axios';
import { createDecipheriv } from 'crypto';
import yts from 'yt-search';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  TIMEOUT: 60000,                           // Timeout para requisições (60 segundos)
  DOWNLOAD_TIMEOUT: 180000,                 // Timeout para download de arquivos (180 segundos)
  PROVIDER_COOLDOWN_MS: 5 * 60 * 60 * 1000, // Tempo de cooldown para providers (5 horas)
  MAX_FAILURES_BEFORE_COOLDOWN: 3,          // Máximo de falhas antes de entrar em cooldown
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // User-Agent padrão
  SAVETUBE_SECRET_KEY: 'C5D58EF67A7584E4A29F6C35BBC4EB12', // Chave secreta para decodificar SaveTube
  SAVETUBE_ALGORITHM: 'aes-128-cbc'         // Algoritmo de criptografia para SaveTube
};

// ============================================
// ESTADO GLOBAL (Fila Rotativa)
// ============================================

const providerState = {
  cooldowns: new Map(),      // Mapa: provider -> timestamp de cooldown
  failureCounts: new Map(),  // Mapa: provider -> contagem de falhas consecutivas
  methodOrder: ['nodzapi', 'nayan', 'adonix', 'oceansaver', 'y2mate', 'savetube'] // Ordem de tentativa dos providers
};

// Cache simples para armazenar resultados e evitar requisições repetidas
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora de cache

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Obtém um valor do cache se ainda estiver válido
 * @param {string} key - Chave do cache
 * @returns {any|null} Valor em cache ou null se expirado/não existir
 */
function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.val;
}

/**
 * Armazena um valor no cache com limite de tamanho
 * @param {string} key - Chave do cache
 * @param {any} val - Valor a ser armazenado
 */
function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

/**
 * Converte uma string hexadecimal para Buffer
 * @param {string} hex - String hexadecimal
 * @returns {Buffer} Buffer convertido
 */
function hexcode(hex) {
  return Buffer.from(hex, 'hex');
}

/**
 * Decodifica dados criptografados do SaveTube
 * @param {string} enc - String criptografada em base64
 * @returns {Object} Dados decodificados como objeto JSON
 */
function decodeSavetube(enc) {
  try {
    const key = hexcode(CONFIG.SAVETUBE_SECRET_KEY);
    const data = Buffer.from(enc, 'base64');
    const iv = data.slice(0, 16);                // Vetor de inicialização (16 bytes)
    const content = data.slice(16);              // Conteúdo criptografado
    const decipher = createDecipheriv(CONFIG.SAVETUBE_ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    return JSON.parse(decrypted.toString());     // Parse do JSON decriptado
  } catch (error) {
    throw new Error(`Decode error: ${error.message}`);
  }
}

/**
 * Extrai o ID do vídeo do YouTube de uma URL
 * @param {string} url - URL do vídeo do YouTube
 * @returns {string|null} ID do vídeo ou null se não encontrado
 */
function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Formata segundos em string de duração (HH:MM:SS ou MM:SS)
 * @param {number} seconds - Segundos totais
 * @returns {string} Duração formatada
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// GERENCIAMENTO DE PROVIDERS (Fila Rotativa)
// ============================================

/**
 * Verifica se um provider está em cooldown
 * @param {string} provider - Nome do provider
 * @returns {boolean} True se estiver em cooldown
 */
function isProviderInCooldown(provider) {
  const until = providerState.cooldowns.get(provider);
  if (!until) return false;
  if (Date.now() >= until) {
    // Cooldown expirado - limpar estado
    providerState.cooldowns.delete(provider);
    providerState.failureCounts.delete(provider);
    return false;
  }
  return true;
}

/**
 * Coloca um provider em cooldown
 * @param {string} provider - Nome do provider
 * @param {string} reason - Motivo do cooldown
 */
function markProviderCooldown(provider, reason) {
  const until = Date.now() + CONFIG.PROVIDER_COOLDOWN_MS;
  providerState.cooldowns.set(provider, until);
  console.log(`⏳ [${provider}] Em cooldown por ${Math.round(CONFIG.PROVIDER_COOLDOWN_MS / 3600000)}h. Motivo: ${reason}`);
}

/**
 * Registra uma falha para um provider
 * @param {string} provider - Nome do provider
 * @param {string} reason - Motivo da falha
 * @returns {number} Nova contagem de falhas
 */
function recordProviderFailure(provider, reason) {
  const count = (providerState.failureCounts.get(provider) || 0) + 1;
  providerState.failureCounts.set(provider, count);
  if (count >= CONFIG.MAX_FAILURES_BEFORE_COOLDOWN) {
    // Múltiplas falhas consecutivas - entrar em cooldown
    markProviderCooldown(provider, reason);
  }
  return count;
}

/**
 * Reseta a contagem de falhas de um provider
 * @param {string} provider - Nome do provider
 */
function resetProviderFailures(provider) {
  providerState.failureCounts.delete(provider);
}

/**
 * Promove um provider para a primeira posição da fila
 * @param {string} provider - Nome do provider
 */
function promoteProviderToFirst(provider) {
  providerState.methodOrder = providerState.methodOrder.filter(name => name !== provider);
  providerState.methodOrder.unshift(provider);
  console.log(`📈 [${provider}] promovido para primeira posição`);
}

/**
 * Rebaixa um provider para a última posição da fila
 * @param {string} provider - Nome do provider
 */
function demoteProviderToLast(provider) {
  providerState.methodOrder = providerState.methodOrder.filter(name => name !== provider);
  providerState.methodOrder.push(provider);
  console.log(`📉 [${provider}] rebaixado para última posição`);
}

/**
 * Adiciona timeout a uma promise
 * @param {Promise} promise - Promise original
 * @param {number} ms - Timeout em milissegundos
 * @param {string} provider - Nome do provider (para log)
 * @returns {Promise} Promise com timeout
 */
function withTimeout(promise, ms, provider) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout em ${provider} após ${ms}ms`));
    }, ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(error => { clearTimeout(timer); reject(error); });
  });
}

/**
 * Analisa mensagens de erro para categorização
 * @param {string} errorMessage - Mensagem de erro
 * @returns {Object} Análise categorizada do erro
 */
function analyzeError(errorMessage) {
  const msg = errorMessage.toLowerCase();
  return {
    videoUnavailable: msg.includes('unavailable') || msg.includes('private') || msg.includes('removed') || msg.includes('not found'),
    networkError: msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('enotfound'),
    rateLimit: msg.includes('rate') || msg.includes('429') || msg.includes('too many'),
    geoBlock: msg.includes('geo') || msg.includes('country') || msg.includes('region')
  };
}

// ============================================
// PROVIDER: API NODZ (NOVO - PRINCIPAL PARA MP3)
// ============================================

/**
 * Download usando a API Nodz (principal para MP3)
 * @param {string} url - URL do vídeo do YouTube
 * @returns {Promise<Object>} Resultado do download
 */
async function DownloadNodz(url) {
  try {
    console.log(`🚀 [NodzAPI] Baixando mp3...`);
    
    // Requisição à API Nodz
    const { data } = await axios.get('https://apisnodz.com.br/api/downloads/youtube/audio', {
      params: { url: url },
      timeout: CONFIG.TIMEOUT
    });
    
    if (!data.success || !data.resultado || !data.resultado.url) {
      throw new Error(data.message || 'API Nodz retornou erro');
    }
    
    const resultado = data.resultado;
    
    console.log(`📥 [NodzAPI] Baixando arquivo...`);
    // Download do arquivo de áudio
    const fileResponse = await axios.get(resultado.url, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT,
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      }
    });
    
    const buffer = Buffer.from(fileResponse.data);
    
    console.log(`✅ [NodzAPI] Download concluído: ${resultado.titulo}`);
    
    return {
      success: true,
      buffer,
      title: resultado.titulo || 'YouTube Audio',
      thumbnail: null,
      quality: resultado.qualidade || '128 kbps',
      filename: resultado.filename || `${resultado.titulo}.mp3`,
      tempo: resultado.tempo || 0,
      source: 'nodzapi'
    };
    
  } catch (error) {
    console.error(`❌ [NodzAPI] Erro:`, error.message);
    return { 
      success: false, 
      error: error.message, 
      source: 'nodzapi',
      isApiError: true
    };
  }
}

// ============================================
// PROVIDER: NAYAN VIDEO DOWNLOADER
// ============================================

/**
 * Download usando Nayan Video Downloader
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} format - Formato (mp3 ou mp4)
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadWithNayan(url, format = 'mp3') {
  try {
    console.log(`🚀 [Nayan] Baixando ${format}...`);
    
    const response = await axios.get('https://nayan-video-downloader.vercel.app/ytdown', {
      params: { url },
      timeout: CONFIG.TIMEOUT,
      headers: { 'User-Agent': CONFIG.USER_AGENT }
    });

    const raw = response.data;
    const body = (raw && typeof raw.status === 'number' && raw.data) ? raw.data : raw;

    if (!body || body.status === false) {
      throw new Error('Resposta inválida da API Nayan');
    }

    const media = (body.data && (body.data.title || body.data.video || body.data.audio)) ? body.data : body;

    let downloadUrl;
    if (format === 'mp3') {
      downloadUrl = media.audio;
    } else {
      downloadUrl = media.video_hd || media.video;
    }

    if (!downloadUrl) {
      throw new Error(`URL de ${format} não disponível`);
    }

    console.log(`📥 [Nayan] Baixando arquivo...`);
    const fileResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Referer': 'https://nayan-video-downloader.vercel.app/'
      }
    });

    const buffer = Buffer.from(fileResponse.data);
    const title = media.title || 'YouTube Video';
    const ext = format === 'mp3' ? 'mp3' : 'mp4';

    console.log(`✅ [Nayan] Download concluído: ${title}`);

    return {
      success: true,
      buffer,
      title,
      thumbnail: media.thumb,
      ext,
      size: buffer.length,
      source: 'nayan'
    };
  } catch (error) {
    console.error(`❌ [Nayan] Erro:`, error.message);
    return { success: false, error: error.message, source: 'nayan' };
  }
}

// ============================================
// PROVIDER: ADONIX (ytmp3.mobi)
// ============================================

/**
 * Download usando Adonix (ytmp3.mobi) - APENAS MP3
 * @param {string} url - URL do vídeo do YouTube
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadWithAdonix(url) {
  try {
    console.log(`🚀 [Adonix] Baixando mp3...`);
    
    const headers = {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://id.ytmp3.mobi/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };

    // 1. Obter configurações iniciais da API
    const initialResponse = await axios.get(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, {
      headers,
      timeout: CONFIG.TIMEOUT
    });

    const init = initialResponse.data;

    // 2. Extrair ID do vídeo da URL
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?/]+)/)?.[1];
    if (!videoId) {
      throw new Error('Não foi possível extrair ID do vídeo');
    }

    // 3. Iniciar conversão para MP3
    const mp3Url = init.convertURL + `&v=${videoId}&f=mp3&_=${Math.random()}`;
    const mp3Response = await axios.get(mp3Url, { headers, timeout: CONFIG.TIMEOUT });
    const mp3Data = mp3Response.data;

    // 4. Aguardar processamento da conversão
    let info = {};
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const progressResponse = await axios.get(mp3Data.progressURL, { headers, timeout: CONFIG.TIMEOUT });
      info = progressResponse.data;

      if (info.progress === 3) break; // Progresso 3 = conclusão

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (info.progress !== 3) {
      throw new Error('Timeout no processamento');
    }

    // 5. Baixar arquivo MP3 convertido
    const fileResponse = await axios.get(mp3Data.downloadURL, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT
    });

    const buffer = Buffer.from(fileResponse.data);

    console.log(`✅ [Adonix] Download concluído: ${info.title}`);

    return {
      success: true,
      buffer,
      title: info.title || 'Audio',
      ext: 'mp3',
      size: buffer.length,
      source: 'adonix'
    };
  } catch (error) {
    console.error(`❌ [Adonix] Erro:`, error.message);
    return { success: false, error: error.message, source: 'adonix' };
  }
}

// ============================================
// PROVIDER: OCEANSAVER
// ============================================

/**
 * Download usando OceanSaver
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} format - Formato (mp3, m4a, opus, webm) ou qualidade (360, 720, etc.)
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadWithOceanSaver(url, format = 'mp3') {
  try {
    console.log(`🚀 [OceanSaver] Baixando ${format}...`);
    
    const SUPPORTED_AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'webm'];

    const formatOrQuality = format === 'mp4' ? '360' : format;
    const isAudio = SUPPORTED_AUDIO_FORMATS.includes(formatOrQuality.toLowerCase());

    const encodedUrl = encodeURIComponent(url);

    // 1. Criar tarefa de download
    const requestResponse = await axios.get(
      `https://p.oceansaver.in/ajax/download.php?format=${formatOrQuality}&url=${encodedUrl}`,
      { timeout: CONFIG.TIMEOUT }
    );

    const requestData = requestResponse.data;

    if (!requestData.success || !requestData.id) {
      throw new Error('Falha ao obter task ID');
    }

    // 2. Monitorar progresso da conversão
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const progressResponse = await axios.get(
        `https://p.oceansaver.in/api/progress?id=${requestData.id}`,
        { timeout: CONFIG.TIMEOUT }
      );

      const progressData = progressResponse.data;

      if (progressData && progressData.download_url) {
        // 3. Baixar arquivo quando pronto
        const fileResponse = await axios.get(progressData.download_url, {
          responseType: 'arraybuffer',
          timeout: CONFIG.DOWNLOAD_TIMEOUT
        });

        const buffer = Buffer.from(fileResponse.data);

        console.log(`✅ [OceanSaver] Download concluído: ${progressData.title}`);

        return {
          success: true,
          buffer,
          title: progressData.title || 'Media',
          quality: isAudio ? formatOrQuality : `${formatOrQuality}p`,
          ext: isAudio ? 'mp3' : 'mp4',
          size: buffer.length,
          source: 'oceansaver'
        };
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    throw new Error('Timeout aguardando conversão');
  } catch (error) {
    console.error(`❌ [OceanSaver] Erro:`, error.message);
    return { success: false, error: error.message, source: 'oceansaver' };
  }
}

// ============================================
// PROVIDER: Y2MATE
// ============================================

/**
 * Download usando Y2mate
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} format - Formato (mp3 ou mp4)
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadWithY2mate(url, format = 'mp3') {
  try {
    console.log(`🚀 [Y2mate] Baixando ${format}...`);
    
    const headers = {
      "Referer": "https://y2mate.nu/",
      "Origin": "https://y2mate.nu/",
      "user-agent": CONFIG.USER_AGENT
    };

    // Função para obter ID do vídeo com tratamento de redirects
    const getYoutubeId = async (youtubeUrl) => {
      const response = await axios.head(youtubeUrl, { headers, timeout: CONFIG.TIMEOUT, maxRedirects: 5 });
      let videoId = new URL(response.request.res.responseUrl || youtubeUrl)?.searchParams?.get("v");
      
      if (!videoId) {
        videoId = (response.request.res.responseUrl || youtubeUrl).match(/https:\/\/www.youtube.com\/shorts\/(.*?)(?:\?|$)/)?.[1];
        if (!videoId) {
          videoId = getYouTubeVideoId(youtubeUrl);
        }
      }
      
      if (!videoId) throw new Error('ID do vídeo não encontrado');
      return { videoId };
    };

    // Função para obter código de autenticação dinâmico
    const getAuthCode = async () => {
      console.log("[Y2mate] Baixando homepage");
      const homepageResponse = await axios.get("https://y2mate.nu", { headers, timeout: CONFIG.TIMEOUT });
      const html = homepageResponse.data;
      
      const valueOnHtml = html.match(/<script>(.*?)<\/script>/)?.[1];
      if (!valueOnHtml) throw new Error('Falha ao obter código value do HTML');

      const srcPath = html.match(/src="(.*?)"/)?.[1];
      if (!srcPath) throw new Error('Falha ao obter srcPath');

      const jsUrl = new URL(homepageResponse.request.res.responseUrl || "https://y2mate.nu").origin + srcPath;

      console.log("[Y2mate] Baixando arquivo JS");
      const jsResponse = await axios.get(jsUrl, { headers, timeout: CONFIG.TIMEOUT });
      const jsCode = jsResponse.data;
      
      const authCode = jsCode.match(/authorization\(\){(.*?)}function/)?.[1];
      if (!authCode) throw new Error('Falha ao obter auth function code');

      const newAuthCode = authCode.replace('id("y2mate").src', `"${jsUrl}"`);

      try {
        const authFunc = new Function('', `${newAuthCode}; return typeof authorization !== "undefined" ? authorization() : null;`);
        return authFunc();
      } catch (error) {
        throw new Error(`Falha ao executar auth: ${error.message}`);
      }
    };

    const { videoId } = await getYoutubeId(url);
    const authCode = await getAuthCode();

    console.log("[Y2mate] Fazendo init API");
    const initResponse = await axios.get(`https://d.ecoe.cc/api/v1/init?a=${authCode}&_=${Math.random()}`, {
      headers,
      timeout: CONFIG.TIMEOUT
    });

    const initData = initResponse.data;
    if (initData.error !== "0") throw new Error(`Erro no init API: ${initData.error}`);

    console.log("[Y2mate] Fazendo convert URL");
    const convertUrl = new URL(initData.convertURL);
    convertUrl.searchParams.append("v", videoId);
    convertUrl.searchParams.append("f", format);
    convertUrl.searchParams.append("_", Math.random());

    const convertResponse = await axios.get(convertUrl.toString(), { headers, timeout: CONFIG.TIMEOUT });
    const convertData = convertResponse.data;
    
    let { downloadURL, progressURL, redirectURL, error: convertError } = convertData;

    if (convertError) throw new Error('Erro após fetch convertURL');

    if (redirectURL) {
      console.log("[Y2mate] Redirecionado");
      const redirectResponse = await axios.get(redirectURL, { headers, timeout: CONFIG.TIMEOUT });
      downloadURL = redirectResponse.data.downloadURL;
      progressURL = redirectResponse.data.progressURL;
    }

    // Aguardar processamento da conversão
    let progress = 0;
    let title = '';

    while (progress !== 3) {
      const progressUrl = new URL(progressURL);
      progressUrl.searchParams.append("_", Math.random());

      const progressResponse = await axios.get(progressUrl.toString(), { headers, timeout: CONFIG.TIMEOUT });
      const progressData = progressResponse.data;
      
      progress = progressData.progress;
      title = progressData.title || title;

      if (progressData.error) throw new Error(`Erro no progresso: ${progressData.error}`);
      if (progress !== 3) await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Baixar arquivo final
    const fileResponse = await axios.get(downloadURL, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT
    });

    const buffer = Buffer.from(fileResponse.data);

    console.log(`✅ [Y2mate] Download concluído: ${title}`);

    return {
      success: true,
      buffer,
      title: title || 'Media',
      ext: format === 'mp3' ? 'mp3' : 'mp4',
      size: buffer.length,
      source: 'y2mate'
    };
  } catch (error) {
    console.error(`❌ [Y2mate] Erro:`, error.message);
    return { success: false, error: error.message, source: 'y2mate' };
  }
}

// ============================================
// PROVIDER: SAVETUBE
// ============================================

/**
 * Download usando SaveTube
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} format - Formato (mp3 ou mp4)
 * @returns {Promise<Object>} Resultado do download
 */
async function downloadWithSavetube(url, format = 'mp3') {
  try {
    console.log(`🚀 [SaveTube] Baixando ${format}...`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://yt.savetube.me/'
    };

    // 1. Obter CDN randômico para balanceamento de carga
    const cdnResponse = await axios.get("https://media.savetube.me/api/random-cdn", { timeout: CONFIG.TIMEOUT });
    const cdn = cdnResponse.data.cdn;

    // 2. Obter informações do vídeo (dados criptografados)
    const infoResponse = await axios.post(`https://${cdn}/v2/info`, { url }, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: CONFIG.TIMEOUT
    });

    const info = decodeSavetube(infoResponse.data.data);

    // 3. Solicitar download com qualidade específica
    const quality = format === 'mp3' ? 128 : 360; // 128kbps para áudio, 360p para vídeo
    const downloadType = format === 'mp3' ? 'audio' : 'video';

    const downloadResponse = await axios.post(`https://${cdn}/download`, {
      downloadType,
      quality: String(quality),
      key: info.key
    }, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: CONFIG.TIMEOUT
    });

    if (!downloadResponse.data.data || !downloadResponse.data.data.downloadUrl) {
      throw new Error('URL de download não recebida');
    }

    // 4. Baixar arquivo
    const fileResponse = await axios.get(downloadResponse.data.data.downloadUrl, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT
    });

    const buffer = Buffer.from(fileResponse.data);

    console.log(`✅ [SaveTube] Download concluído: ${info.title}`);

    return {
      success: true,
      buffer,
      title: info.title || 'Media',
      thumbnail: info.thumbnail,
      quality: `${quality}${downloadType === "audio" ? "kbps" : "p"}`,
      ext: format === 'mp3' ? 'mp3' : 'mp4',
      size: buffer.length,
      source: 'savetube'
    };
  } catch (error) {
    console.error(`❌ [SaveTube] Erro:`, error.message);
    return { success: false, error: error.message, source: 'savetube' };
  }
}

// ============================================
// SISTEMA DE FILA ROTATIVA COM FALLBACKS
// ============================================

/**
 * Sistema principal de download com fallback automático entre providers
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} format - Formato desejado (mp3 ou mp4)
 * @returns {Promise<Object>} Resultado do download ou erro detalhado
 */
async function downloadWithFallbacks(url, format = 'mp3') {
  const providers = {
    nodzapi: () => DownloadNodz(url),
    nayan: () => downloadWithNayan(url, format),
    adonix: () => downloadWithAdonix(url),           // Só suporta MP3
    oceansaver: () => downloadWithOceanSaver(url, format),
    y2mate: () => downloadWithY2mate(url, format),
    savetube: () => downloadWithSavetube(url, format)
  };

  const errors = [];
  let videoUnavailableCount = 0;
  let networkErrorCount = 0;

  // Iterar pelos providers na ordem configurada
  for (const providerName of providerState.methodOrder) {
    // Pular providers que não suportam o formato solicitado
    if (providerName === 'adonix' && format !== 'mp3') {
      continue;
    }

    if (providerName === 'nodzapi' && format !== 'mp3') {
      continue;
    }

    // Verificar se provider está em cooldown
    if (isProviderInCooldown(providerName)) {
      console.log(`⏭️ Pulando ${providerName} (em cooldown)`);
      continue;
    }

    console.log(`🔄 Tentando: ${providerName}...`);

    try {
      const result = await withTimeout(providers[providerName](), CONFIG.TIMEOUT, providerName);

      if (result?.success) {
        console.log(`✅ Sucesso com ${providerName}!`);
        
        // Resetar falhas e promover provider bem-sucedido
        resetProviderFailures(providerName);
        promoteProviderToFirst(providerName);
        
        if (errors.length > 0) {
          console.log(`📊 Sucesso após ${errors.length} tentativas falhadas`);
        }
        
        return result;
      } else {
        throw new Error(result?.error || 'Falha desconhecida');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Erro desconhecido';
      const errorAnalysis = analyzeError(errorMessage);
      
      errors.push({
        provider: providerName,
        error: errorMessage,
        analysis: errorAnalysis
      });

      // Registrar falha e rebaixar provider
      recordProviderFailure(providerName, errorMessage.slice(0, 120));
      demoteProviderToLast(providerName);

      // Contadores para análise de padrões de erro
      if (errorAnalysis.videoUnavailable) videoUnavailableCount++;
      if (errorAnalysis.networkError) networkErrorCount++;

      // Tratamento específico para rate limiting
      if (errorAnalysis.rateLimit) {
        console.log('⏳ Rate limit detectado - aguardando 5 segundos...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      console.log(`❌ [${providerName}] Falhou: ${errorMessage.slice(0, 100)}...`);

      // Heurística: se múltiplos providers dizem que vídeo está indisponível, provavelmente é verdade
      if (videoUnavailableCount >= 2) {
        console.log('⚠️ Múltiplos erros de vídeo indisponível - possivelmente o vídeo não existe');
        break;
      }

      // Heurística: problemas de rede persistentes
      if (networkErrorCount >= 2) {
        console.log('⚠️ Múltiplos erros de rede - aguardando antes da próxima tentativa');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Relatório detalhado de falhas para debugging
  console.log('\n📋 Relatório de falhas:');
  errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err.provider}: ${err.error.slice(0, 80)}...`);
  });

  return {
    success: false,
    error: 'Todos os métodos falharam',
    detailedErrors: errors,
    recommendation: getRecommendation(errors)
  };
}

/**
 * Gera recomendação baseada nos padrões de erro
 * @param {Array} errors - Array de erros coletados
 * @returns {string} Recomendação para o usuário
 */
function getRecommendation(errors) {
  const hasVideoUnavailable = errors.some(e => e.analysis?.videoUnavailable);
  const hasGeoBlock = errors.some(e => e.analysis?.geoBlock);
  const hasNetworkError = errors.some(e => e.analysis?.networkError);
  const hasRateLimit = errors.some(e => e.analysis?.rateLimit);

  if (hasVideoUnavailable) return 'O vídeo pode estar indisponível, privado ou removido';
  if (hasGeoBlock) return 'O vídeo pode estar bloqueado geograficamente';
  if (hasNetworkError) return 'Problemas de conectividade - tente novamente em alguns minutos';
  if (hasRateLimit) return 'Muitas requisições - aguarde alguns minutos antes de tentar novamente';
  return 'Erro desconhecido - verifique a URL do vídeo';
}

// ============================================
// FUNÇÕES PÚBLICAS (API)
// ============================================

/**
 * Pesquisa vídeos no YouTube
 * @param {string} query - Termo de pesquisa
 * @returns {Promise<Object>} Resultado da pesquisa
 */
async function search(query) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    // Verificar cache para evitar buscas repetidas
    const cached = getCached(`search:${query}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const results = await yts(query);
    const video = results?.videos?.[0];

    if (!video) {
      return { ok: false, msg: 'Nenhum vídeo encontrado' };
    }

    const seconds = Number.isFinite(video.seconds) ? video.seconds : 0;
    const timestamp = video.timestamp || formatDuration(seconds);

    const result = {
      criador: 'Hiudy',
      data: {
        videoId: video.videoId || video.id || '',
        url: video.url,
        title: video.title,
        description: video.description || '',
        image: video.image || video.thumbnail || '',
        thumbnail: video.thumbnail || video.image || '',
        seconds,
        timestamp,
        duration: { seconds, timestamp },
        ago: video.ago || video.uploadedAt || '',
        views: video.views || 0,
        author: {
          name: video.author?.name || 'Unknown',
          url: video.author?.url || ''
        }
      }
    };

    setCache(`search:${query}`, result);

    return { ok: true, ...result };
  } catch (error) {
    console.error('Erro na busca YouTube:', error.message);
    return { ok: false, msg: 'Erro ao buscar vídeo: ' + error.message };
  }
}

/**
 * Download de áudio (MP3) com sistema de fila rotativa
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} _quality - Qualidade (mp3) - mantido para compatibilidade
 * @returns {Promise<Object>} Resultado do download
 */
async function mp3(url, _quality = 'mp3') {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) {
      return { ok: false, msg: 'URL inválida do YouTube' };
    }

    // Verificar cache
    const cached = getCached(`mp3:${id}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const videoUrl = `https://youtube.com/watch?v=${id}`;
    
    // Usar sistema de fila rotativa com fallback
    const result = await downloadWithFallbacks(videoUrl, 'mp3');
    
    if (!result.success || !result.buffer) {
      return {
        ok: false,
        msg: result.error || 'Erro ao processar áudio',
        recommendation: result.recommendation
      };
    }

    const downloadResult = {
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality || 'mp3',
      filename: result.filename || `${result.title} (mp3).mp3`,
      source: result.source,
      tempo: result.tempo || 0
    };

    setCache(`mp3:${id}`, downloadResult);

    return { ok: true, ...downloadResult };
  } catch (error) {
    console.error('Erro no download MP3:', error.message);
    return { ok: false, msg: 'Erro ao baixar áudio: ' + error.message };
  }
}

/**
 * Download de vídeo (MP4) com sistema de fila rotativa
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} quality - Qualidade desejada (360p, 720p, 1080p)
 * @returns {Promise<Object>} Resultado do download
 */
async function mp4(url, quality = '360p') {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) {
      return { ok: false, msg: 'URL inválida do YouTube' };
    }

    // Verificar cache
    const cached = getCached(`mp4:${id}:${quality}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const videoUrl = `https://youtube.com/watch?v=${id}`;
    
    // Usar sistema de fila rotativa com fallback
    const result = await downloadWithFallbacks(videoUrl, 'mp4');
    
    if (!result.success || !result.buffer) {
      return {
        ok: false,
        msg: result.error || 'Erro ao processar vídeo',
        recommendation: result.recommendation
      };
    }

    const downloadResult = {
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality || quality,
      filename: `${result.title} (${quality}).mp4`,
      source: result.source
    };

    setCache(`mp4:${id}:${quality}`, downloadResult);

    return { ok: true, ...downloadResult };
  } catch (error) {
    console.error('Erro no download MP4:', error.message);
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + error.message };
  }
}

// ============================================
// EXPORTS
// ============================================

export { search, mp3, mp4, DownloadNodz };
export const ytmp3 = mp3;  // Alias para compatibilidade
export const ytmp4 = mp4;  // Alias para compatibilidade
