// --- UTILIDADES QR CODE ---
// Gerar QR Code e Ler QR Code (sem jimp, usando API externa)
import swiftly from 'swiftly';

const CONFIG = {
    GENERATE_SIZE: 300,
    READ_API: 'https://api.qrserver.com/v1/read-qr-code/',
    GENERATE_API: 'https://api.qrserver.com/v1/create-qr-code/'
};

// --- GERAR QR CODE ---

/**
 * Gera um QR Code a partir de texto
 * @param {string} text - Texto para codificar
 * @param {number} size - Tamanho da imagem (default: 300)
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const generateQRCode = async (text, size = CONFIG.GENERATE_SIZE, prefix = '/') => {
    if (!text || text.trim().length === 0) {
        return {
            success: false,
            message: `❌ Forneça um texto para gerar o QR Code!\n\n💡 Uso: ${prefix}qrcode <texto>\n📌 Exemplo: ${prefix}qrcode https://meusite.com`
        };
    }
    
    if (text.length > 2000) {
        return {
            success: false,
            message: '❌ Texto muito longo! Máximo de 2000 caracteres.'
        };
    }
    
    try {
        const url = `${CONFIG.GENERATE_API}?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        
        const response = await swiftly.get(url, {
            responseType: 'buffer',
            timeout: 120000
        });
        
        return {
            success: true,
            buffer: Buffer.from(response.data),
            message: `✅ *QR CODE GERADO*\n\n📝 Conteúdo: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`
        };
    } catch (err) {
        console.error('[QRCODE] Erro ao gerar:', err.message);
        return {
            success: false,
            message: '❌ Erro ao gerar QR Code. Tente novamente!'
        };
    }
};

/**
 * Gera URL para QR Code (alternativa sem download)
 * @param {string} text - Texto para codificar
 * @param {number} size - Tamanho da imagem
 * @returns {string} URL da imagem
 */
const getQRCodeURL = (text, size = CONFIG.GENERATE_SIZE) => {
    return `${CONFIG.GENERATE_API}?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

// --- LER QR CODE ---

/**
 * Lê um QR Code a partir de uma imagem
 * @param {Buffer|string} imageInput - Buffer da imagem ou URL
 * @returns {Promise<{success: boolean, data?: string, message?: string}>}
 */
const readQRCode = async (imageInput) => {
    try {
        let response;
        
        if (Buffer.isBuffer(imageInput)) {
            // Enviar como form-data
            const FormData = (await import('form-data')).default;
            const form = new FormData();
            form.append('file', imageInput, {
                filename: 'qrcode.png',
                contentType: 'image/png'
            });
            
            response = await swiftly.post(CONFIG.READ_API, form, {
                headers: form.getHeaders(),
                timeout: 120000
            });
        } else if (typeof imageInput === 'string') {
            // Enviar URL
            response = await swiftly.get(`${CONFIG.READ_API}?fileurl=${encodeURIComponent(imageInput)}`, {
                timeout: 120000
            });
        } else {
            return {
                success: false,
                message: '❌ Formato de imagem inválido!'
            };
        }
        
        // Processar resposta
        const result = response.data;
        
        if (Array.isArray(result) && result[0]?.symbol?.[0]) {
            const symbol = result[0].symbol[0];
            
            if (symbol.error) {
                return {
                    success: false,
                    message: `❌ Não foi possível ler o QR Code!\n\n📌 Erro: ${symbol.error}`
                };
            }
            
            const data = symbol.data;
            
            if (data) {
                return {
                    success: true,
                    data,
                    message: `✅ *QR CODE LIDO*\n\n📝 *Conteúdo:*\n${data}`
                };
            }
        }
        
        return {
            success: false,
            message: '❌ Nenhum QR Code encontrado na imagem!'
        };
    } catch (err) {
        console.error('[QRCODE] Erro ao ler:', err.message);
        return {
            success: false,
            message: '❌ Erro ao ler QR Code. Verifique se a imagem contém um QR Code válido!'
        };
    }
};

/**
 * Lê QR Code de uma URL de imagem
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<{success: boolean, data?: string, message?: string}>}
 */
const readQRCodeFromURL = async (imageUrl) => {
    return readQRCode(imageUrl);
};

/**
 * Lê QR Code de um Buffer de imagem
 * @param {Buffer} imageBuffer - Buffer da imagem
 * @returns {Promise<{success: boolean, data?: string, message?: string}>}
 */
const readQRCodeFromBuffer = async (imageBuffer) => {
    return readQRCode(imageBuffer);
};

// --- HELPERS ---

/**
 * Verifica se um texto parece ser uma URL
 * @param {string} text
 * @returns {boolean}
 */
const isURL = (text) => {
    try {
        new URL(text);
        return true;
    } catch {
        return /^(https?:\/\/|www\.)/i.test(text);
    }
};

/**
 * Formata a resposta de leitura com detecção de tipo
 * @param {string} data - Dados lidos do QR Code
 * @returns {string} Mensagem formatada
 */
const formatReadResult = (data) => {
    let type = '📝 Texto';
    let extra = '';
    
    if (isURL(data)) {
        type = '🔗 URL';
        extra = '\n\n⚠️ Cuidado ao acessar links desconhecidos!';
    } else if (data.startsWith('mailto:')) {
        type = '📧 Email';
    } else if (data.startsWith('tel:')) {
        type = '📞 Telefone';
    } else if (data.startsWith('WIFI:')) {
        type = '📶 Wi-Fi';
    } else if (data.startsWith('BEGIN:VCARD')) {
        type = '👤 Contato (vCard)';
    } else if (/^[0-9]{8,}$/.test(data)) {
        type = '📊 Código de Barras';
    }
    
    return `✅ *QR CODE LIDO*\n\n🏷️ Tipo: ${type}\n\n📝 *Conteúdo:*\n${data}${extra}`;
};

export {
    generateQRCode,
    getQRCodeURL,
    readQRCode,
    readQRCodeFromURL,
    readQRCodeFromBuffer,
    formatReadResult,
    isURL
};

export default {
    generateQRCode,
    getQRCodeURL,
    readQRCode,
    readQRCodeFromURL,
    readQRCodeFromBuffer,
    formatReadResult
};
