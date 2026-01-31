/**
 * Google Drive Download - Implementação direta sem API externa
 */

import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Cache simples
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function extractFileId(url) {
  if (!url) throw new Error('URL não fornecida');
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  throw new Error('Não foi possível extrair o ID do arquivo da URL');
}

/**
 * Obter informações e link de download do Google Drive
 * @param {string} url - URL do arquivo no Google Drive
 * @returns {Promise<Object>} Informações do arquivo
 */
async function getInfo(url) {
  try {
    if (!url || !url.includes('drive.google.com')) {
      return { ok: false, msg: 'URL inválida. Forneça uma URL válida do Google Drive.' };
    }

    // Verificar cache
    const cached = getCached(`gdrive:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const fileId = extractFileId(url);
    console.log(`[GDrive] Obtendo informações do arquivo ID: ${fileId}`);

    // Requisição para obter informações do arquivo
    const response = await axios.post(
      `https://drive.google.com/uc?id=${fileId}&authuser=0&export=download`,
      null,
      {
        headers: {
          'accept-encoding': 'gzip, deflate, br',
          'content-length': '0',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'origin': 'https://drive.google.com',
          'user-agent': USER_AGENT,
          'x-drive-first-party': 'DriveWebUi',
          'x-json-requested': 'true'
        },
        timeout: 60000
      }
    );

    let jsonText = response.data;
    if (typeof jsonText === 'string') {
      if (jsonText.startsWith(')]}\'')) {
        jsonText = jsonText.slice(4);
      } else if (jsonText.startsWith(')]}\'\n')) {
        jsonText = jsonText.slice(5);
      }
      jsonText = JSON.parse(jsonText);
    }

    const { fileName, sizeBytes, downloadUrl } = jsonText;

    let finalDownloadUrl = downloadUrl;
    let mimetype = 'application/octet-stream';

    if (!finalDownloadUrl) {
      // Tentar link direto
      finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      try {
        const checkResponse = await axios.head(finalDownloadUrl, {
          headers: { 'user-agent': USER_AGENT },
          maxRedirects: 5,
          timeout: 30000
        });
        mimetype = checkResponse.headers['content-type'] || mimetype;
      } catch (e) {
        return { ok: false, msg: 'Limite de download atingido ou arquivo muito grande. Tente novamente mais tarde.' };
      }
    } else {
      try {
        const checkResponse = await axios.head(finalDownloadUrl, {
          headers: { 'user-agent': USER_AGENT },
          maxRedirects: 5,
          timeout: 30000
        });
        mimetype = checkResponse.headers['content-type'] || mimetype;
      } catch (e) {
        // Ignorar erro no HEAD
      }
    }

    const result = {
      fileId,
      fileName: fileName || 'arquivo_desconhecido',
      fileSize: formatSize(sizeBytes || 0),
      fileSizeBytes: sizeBytes || 0,
      downloadUrl: finalDownloadUrl,
      mimetype
    };

    setCache(`gdrive:${url}`, result);

    return { ok: true, ...result };
  } catch (error) {
    console.error('[GDrive] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao obter informações do arquivo' };
  }
}

export default { getInfo };
export { getInfo };
