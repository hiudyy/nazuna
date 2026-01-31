/**
 * MediaFire Download - Implementação direta sem API externa
 */

import axios from 'axios';
import { parseHTML } from 'linkedom';

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

const MIME_TYPES = {
  'zip': 'application/zip', 'rar': 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
  'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
  'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'mp4': 'video/mp4', 'mkv': 'video/x-matroska',
  'exe': 'application/x-msdownload', 'apk': 'application/vnd.android.package-archive'
};

function getMimeType(ext) {
  return MIME_TYPES[ext?.toLowerCase()] || 'application/octet-stream';
}

function decodeBase64(str) {
  try { return Buffer.from(str, 'base64').toString('utf-8'); } catch { return null; }
}

/**
 * Obter informações e link de download do MediaFire
 * @param {string} url - URL do arquivo no MediaFire
 * @returns {Promise<Object>} Informações do arquivo
 */
async function getInfo(url) {
  try {
    if (!url || !url.includes('mediafire.com')) {
      return { ok: false, msg: 'URL inválida. Forneça uma URL válida do MediaFire.' };
    }

    // Verificar cache
    const cached = getCached(`mediafire:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    console.log(`[MediaFire] Obtendo informações de: ${url}`);

    let html, link = null;

    // Tentar acesso direto primeiro
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 60000
      });
      html = response.data;
    } catch (directError) {
      console.log('[MediaFire] Acesso direto falhou, tentando via Google Translate');
      
      const pathPart = url.replace(/https?:\/\/(www\.)?mediafire\.com\/?/, '');
      const translateUrl = `https://www-mediafire-com.translate.goog/${pathPart}?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en&_x_tr_pto=wapp`;
      
      const response = await axios.get(translateUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 60000
      });
      html = response.data;
    }

    const { document } = parseHTML(html);

    // Tentar obter link do botão de download
    const downloadButton = document.querySelector('#downloadButton');
    link = downloadButton?.getAttribute('href');

    if (!link || link.includes('javascript:void(0)')) {
      link = downloadButton?.getAttribute('data-href') || 
             downloadButton?.getAttribute('data-url') || 
             downloadButton?.getAttribute('data-link');

      // Tentar decodificar URL scrambled
      const scrambledUrl = downloadButton?.getAttribute('data-scrambled-url');
      if (scrambledUrl) {
        const decoded = decodeBase64(scrambledUrl);
        if (decoded && decoded.startsWith('http')) link = decoded;
      }

      // Procurar no HTML
      if (!link || link.includes('javascript:void(0)')) {
        const linkMatch = html.match(/href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/);
        if (linkMatch) link = linkMatch[1];
      }
    }

    if (!link || link.includes('javascript:void(0)') || !link.startsWith('http')) {
      return { ok: false, msg: 'Não foi possível encontrar o link de download. O arquivo pode ter sido removido ou estar privado.' };
    }

    // Extrair informações
    let fileName = document.querySelector('.promoDownloadName div')?.getAttribute('title') ||
                   document.querySelector('.dl-btn-label')?.getAttribute('title') ||
                   document.querySelector('.filename')?.textContent?.trim() ||
                   'arquivo_desconhecido';

    let fileSize = document.querySelector('#downloadButton')?.textContent || '';
    fileSize = fileSize.replace('Download', '').replace(/[()]/g, '').replace(/\n/g, '').replace(/\s+/g, ' ').trim();
    if (!fileSize.match(/\d+(\.\d+)?\s*(KB|MB|GB|TB|B)/i)) fileSize = 'Tamanho desconhecido';

    const uploadDate = document.querySelector('.details li:nth-child(2) span')?.textContent?.trim() || 'Data desconhecida';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const result = {
      fileName: fileName.replace(/\s+/g, ' ').replace(/\n/g, '').trim(),
      fileSize,
      uploadDate,
      mimetype: getMimeType(extension),
      extension,
      downloadUrl: link
    };

    setCache(`mediafire:${url}`, result);

    return { ok: true, ...result };
  } catch (error) {
    console.error('[MediaFire] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao obter informações do arquivo' };
  }
}

export default { getInfo };
export { getInfo };
