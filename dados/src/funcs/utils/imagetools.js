/**
 * Image Tools - Remoção de fundo e Upscale
 * Usa API vreden.my.id
 */

import axios from 'axios';

const API_BASE = 'https://api.vreden.my.id/api/v1/artificial/imglarger';

/**
 * Remover fundo de uma imagem
 * @param {string} url - URL da imagem
 * @returns {Promise<Object>} Resultado com URL da imagem sem fundo
 */
async function removeBg(url) {
  try {
    if (!url || typeof url !== 'string') {
      return { ok: false, msg: 'URL da imagem é obrigatória' };
    }

    console.log('[RemoveBG] Processando imagem...');

    const response = await axios.get(`${API_BASE}/removebg`, {
      params: { url },
      timeout: 120000
    });

    if (!response.data?.result?.download) {
      return { ok: false, msg: 'Não foi possível remover o fundo da imagem' };
    }

    return {
      ok: true,
      status: true,
      result: {
        download: response.data.result.download
      }
    };
  } catch (error) {
    console.error('[RemoveBG] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao remover fundo da imagem' };
  }
}

/**
 * Melhorar qualidade de uma imagem (upscale)
 * @param {string} url - URL da imagem
 * @param {number} scale - Escala de aumento (2 ou 4)
 * @returns {Promise<Object>} Resultado com URL da imagem melhorada
 */
async function upscale(url, scale = 2) {
  try {
    if (!url || typeof url !== 'string') {
      return { ok: false, msg: 'URL da imagem é obrigatória' };
    }

    console.log(`[Upscale] Processando imagem (${scale}x)...`);

    const response = await axios.get(`${API_BASE}/upscale`, {
      params: { url, scale },
      timeout: 120000
    });

    if (!response.data?.result?.download) {
      return { ok: false, msg: 'Não foi possível melhorar a imagem' };
    }

    return {
      ok: true,
      status: true,
      result: {
        download: response.data.result.download
      }
    };
  } catch (error) {
    console.error('[Upscale] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao melhorar imagem' };
  }
}

export default { removeBg, upscale };
export { removeBg, upscale };
