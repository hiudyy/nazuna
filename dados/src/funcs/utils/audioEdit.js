// --- EDIÇÃO DE ÁUDIO ---
// Cortar áudio, alterar velocidade
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../../../../temp/audio');

const CONFIG = {
    MAX_DURATION: 300, // 5 minutos máximo
    MIN_DURATION: 1, // 1 segundo mínimo
    MIN_SPEED: 0.5,
    MAX_SPEED: 3.0,
    SUPPORTED_FORMATS: ['mp3', 'ogg', 'wav', 'm4a', 'opus', 'aac']
};

// Garantir que o diretório temp existe
const ensureTempDir = () => {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
};

// Gerar nome de arquivo único
const generateTempPath = (extension = 'mp3') => {
    ensureTempDir();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    return path.join(TEMP_DIR, `audio_${id}.${extension}`);
};

// Limpar arquivo temporário
const cleanupTemp = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error('[AUDIO] Erro ao limpar temp:', err.message);
    }
};

// Converter tempo em segundos para formato HH:MM:SS
const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Parser de tempo (aceita SS, MM:SS ou HH:MM:SS)
const parseTime = (timeStr) => {
    if (typeof timeStr === 'number') return timeStr;
    
    const parts = timeStr.toString().split(':').map(Number);
    
    if (parts.some(isNaN)) return null;
    
    if (parts.length === 1) {
        return parts[0]; // Apenas segundos
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    
    return null;
};

// Obter duração do áudio
const getAudioDuration = async (filePath) => {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
        );
        return parseFloat(stdout.trim());
    } catch (err) {
        console.error('[AUDIO] Erro ao obter duração:', err.message);
        return null;
    }
};

// --- CORTAR ÁUDIO ---

/**
 * Corta um trecho do áudio
 * @param {Buffer} audioBuffer - Buffer do áudio original
 * @param {string|number} startTime - Tempo inicial (segundos ou MM:SS ou HH:MM:SS)
 * @param {string|number} endTime - Tempo final
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const cutAudio = async (audioBuffer, startTime, endTime, prefix = '/') => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    if (start === null || end === null) {
        return {
            success: false,
            message: `❌ Formato de tempo inválido!\n\n` +
                     `💡 Formatos aceitos:\n` +
                     `• Segundos: 30\n` +
                     `• MM:SS: 1:30\n` +
                     `• HH:MM:SS: 0:01:30\n\n` +
                     `📌 Uso: ${prefix}cortar <início> <fim>\n` +
                     `📌 Exemplo: ${prefix}cortar 0:10 0:30`
        };
    }
    
    if (start < 0 || end < 0) {
        return { success: false, message: '❌ Os tempos não podem ser negativos!' };
    }
    
    if (start >= end) {
        return { success: false, message: '❌ O tempo inicial deve ser menor que o final!' };
    }
    
    const duration = end - start;
    if (duration > CONFIG.MAX_DURATION) {
        return { success: false, message: `❌ O corte não pode ter mais de ${CONFIG.MAX_DURATION} segundos!` };
    }
    
    if (duration < CONFIG.MIN_DURATION) {
        return { success: false, message: `❌ O corte deve ter pelo menos ${CONFIG.MIN_DURATION} segundo!` };
    }
    
    const inputPath = generateTempPath('input');
    const outputPath = generateTempPath('mp3');
    
    try {
        // Salvar buffer de entrada
        fs.writeFileSync(inputPath, audioBuffer);
        
        // Verificar duração do áudio original
        const originalDuration = await getAudioDuration(inputPath);
        if (originalDuration && end > originalDuration) {
            cleanupTemp(inputPath);
            return {
                success: false,
                message: `❌ O tempo final (${formatTime(end)}) excede a duração do áudio (${formatTime(originalDuration)})!`
            };
        }
        
        // Executar corte
        await execAsync(
            `ffmpeg -y -i "${inputPath}" -ss ${start} -to ${end} -c:a libmp3lame -q:a 2 "${outputPath}"`
        );
        
        // Ler resultado
        const resultBuffer = fs.readFileSync(outputPath);
        
        // Limpar temporários
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        
        return {
            success: true,
            buffer: resultBuffer,
            message: `✂️ *ÁUDIO CORTADO*\n\n` +
                     `⏱️ De: ${formatTime(start)}\n` +
                     `⏱️ Até: ${formatTime(end)}\n` +
                     `📊 Duração: ${formatTime(duration)}`
        };
    } catch (err) {
        console.error('[AUDIO] Erro ao cortar:', err.message);
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        return {
            success: false,
            message: '❌ Erro ao cortar áudio. Verifique se o arquivo é válido!'
        };
    }
};

// --- ALTERAR VELOCIDADE ---

/**
 * Altera a velocidade do áudio
 * @param {Buffer} audioBuffer - Buffer do áudio original
 * @param {number} speed - Velocidade (0.5 a 3.0)
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const changeSpeed = async (audioBuffer, speed) => {
    const speedValue = parseFloat(speed);
    
    if (isNaN(speedValue)) {
        return {
            success: false,
            message: `❌ Velocidade inválida!\n\n` +
                     `💡 Use um valor entre ${CONFIG.MIN_SPEED} e ${CONFIG.MAX_SPEED}\n\n` +
                     `📌 Exemplos:\n` +
                     `• 0.5 = 50% (mais lento)\n` +
                     `• 1.0 = 100% (normal)\n` +
                     `• 1.5 = 150% (mais rápido)\n` +
                     `• 2.0 = 200% (2x mais rápido)`
        };
    }
    
    if (speedValue < CONFIG.MIN_SPEED || speedValue > CONFIG.MAX_SPEED) {
        return {
            success: false,
            message: `❌ Velocidade deve estar entre ${CONFIG.MIN_SPEED} e ${CONFIG.MAX_SPEED}!`
        };
    }
    
    const inputPath = generateTempPath('input');
    const outputPath = generateTempPath('mp3');
    
    try {
        // Salvar buffer de entrada
        fs.writeFileSync(inputPath, audioBuffer);
        
        // Verificar duração original
        const originalDuration = await getAudioDuration(inputPath);
        if (originalDuration && originalDuration / speedValue > CONFIG.MAX_DURATION) {
            cleanupTemp(inputPath);
            return {
                success: false,
                message: `❌ O áudio resultante seria muito longo! Máximo: ${CONFIG.MAX_DURATION} segundos.`
            };
        }
        
        // Construir filtro atempo (ffmpeg suporta 0.5-2.0 por filtro, então encadeamos se necessário)
        let atempoFilters = [];
        let remainingSpeed = speedValue;
        
        while (remainingSpeed < 0.5) {
            atempoFilters.push('atempo=0.5');
            remainingSpeed /= 0.5;
        }
        while (remainingSpeed > 2.0) {
            atempoFilters.push('atempo=2.0');
            remainingSpeed /= 2.0;
        }
        atempoFilters.push(`atempo=${remainingSpeed}`);
        
        const filter = atempoFilters.join(',');
        
        // Executar alteração de velocidade
        await execAsync(
            `ffmpeg -y -i "${inputPath}" -filter:a "${filter}" -c:a libmp3lame -q:a 2 "${outputPath}"`
        );
        
        // Ler resultado
        const resultBuffer = fs.readFileSync(outputPath);
        
        // Calcular nova duração
        const newDuration = originalDuration ? originalDuration / speedValue : null;
        
        // Limpar temporários
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        
        const emoji = speedValue > 1 ? '⏩' : speedValue < 1 ? '⏪' : '▶️';
        
        return {
            success: true,
            buffer: resultBuffer,
            message: `${emoji} *VELOCIDADE ALTERADA*\n\n` +
                     `📊 Velocidade: ${(speedValue * 100).toFixed(0)}%\n` +
                     `${newDuration ? `⏱️ Nova duração: ${formatTime(newDuration)}` : ''}`
        };
    } catch (err) {
        console.error('[AUDIO] Erro ao alterar velocidade:', err.message);
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        return {
            success: false,
            message: '❌ Erro ao alterar velocidade. Verifique se o arquivo é válido!'
        };
    }
};

// --- REVERTER ÁUDIO ---

/**
 * Reverte o áudio (toca ao contrário)
 * @param {Buffer} audioBuffer - Buffer do áudio original
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const reverseAudio = async (audioBuffer) => {
    const inputPath = generateTempPath('input');
    const outputPath = generateTempPath('mp3');
    
    try {
        fs.writeFileSync(inputPath, audioBuffer);
        
        const duration = await getAudioDuration(inputPath);
        if (duration && duration > CONFIG.MAX_DURATION) {
            cleanupTemp(inputPath);
            return {
                success: false,
                message: `❌ Áudio muito longo! Máximo: ${CONFIG.MAX_DURATION} segundos.`
            };
        }
        
        await execAsync(
            `ffmpeg -y -i "${inputPath}" -af "areverse" -c:a libmp3lame -q:a 2 "${outputPath}"`
        );
        
        const resultBuffer = fs.readFileSync(outputPath);
        
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        
        return {
            success: true,
            buffer: resultBuffer,
            message: `🔄 *ÁUDIO REVERTIDO*\n\n` +
                     `O áudio agora toca ao contrário!`
        };
    } catch (err) {
        console.error('[AUDIO] Erro ao reverter:', err.message);
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        return {
            success: false,
            message: '❌ Erro ao reverter áudio!'
        };
    }
};

// --- AUMENTAR GRAVES (BASS BOOST) ---

/**
 * Aumenta os graves do áudio
 * @param {Buffer} audioBuffer - Buffer do áudio original
 * @param {number} gain - Ganho em dB (1-20)
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const bassBoost = async (audioBuffer, gain = 10) => {
    const gainValue = Math.min(20, Math.max(1, parseInt(gain) || 10));
    
    const inputPath = generateTempPath('input');
    const outputPath = generateTempPath('mp3');
    
    try {
        fs.writeFileSync(inputPath, audioBuffer);
        
        await execAsync(
            `ffmpeg -y -i "${inputPath}" -af "bass=g=${gainValue}:f=110:w=0.6" -c:a libmp3lame -q:a 2 "${outputPath}"`
        );
        
        const resultBuffer = fs.readFileSync(outputPath);
        
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        
        return {
            success: true,
            buffer: resultBuffer,
            message: `🔊 *BASS BOOST*\n\n` +
                     `📊 Ganho: +${gainValue} dB`
        };
    } catch (err) {
        console.error('[AUDIO] Erro no bass boost:', err.message);
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        return {
            success: false,
            message: '❌ Erro ao aplicar bass boost!'
        };
    }
};

// --- NORMALIZAR VOLUME ---

/**
 * Normaliza o volume do áudio
 * @param {Buffer} audioBuffer - Buffer do áudio original
 * @returns {Promise<{success: boolean, buffer?: Buffer, message?: string}>}
 */
const normalizeAudio = async (audioBuffer) => {
    const inputPath = generateTempPath('input');
    const outputPath = generateTempPath('mp3');
    
    try {
        fs.writeFileSync(inputPath, audioBuffer);
        
        await execAsync(
            `ffmpeg -y -i "${inputPath}" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a libmp3lame -q:a 2 "${outputPath}"`
        );
        
        const resultBuffer = fs.readFileSync(outputPath);
        
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        
        return {
            success: true,
            buffer: resultBuffer,
            message: `🔊 *VOLUME NORMALIZADO*\n\n` +
                     `O volume foi ajustado para um nível padrão.`
        };
    } catch (err) {
        console.error('[AUDIO] Erro ao normalizar:', err.message);
        cleanupTemp(inputPath);
        cleanupTemp(outputPath);
        return {
            success: false,
            message: '❌ Erro ao normalizar volume!'
        };
    }
};

export {
    cutAudio,
    changeSpeed,
    reverseAudio,
    bassBoost,
    normalizeAudio,
    getAudioDuration,
    parseTime,
    formatTime,
    CONFIG as AUDIO_CONFIG
};

export default {
    cutAudio,
    changeSpeed,
    reverseAudio,
    bassBoost,
    normalizeAudio,
    getAudioDuration
};
