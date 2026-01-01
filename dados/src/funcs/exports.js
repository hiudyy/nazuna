import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// createRequire is only used for JSON or true CJS modules
const require = createRequire(import.meta.url);

/**
 * Carrega e faz o parse de um arquivo JSON de forma síncrona.
 * Usamos fs direto para continuar funcionando em ESM sem require() em módulos ESM.
 * @param {string} filePath - O caminho relativo para o arquivo JSON.
 * @returns {any | undefined} O objeto JSON ou undefined se falhar.
 */
function loadJsonSync(filePath) {
    try {
        const fullPath = path.resolve(__dirname, filePath);
        const data = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[ERRO] Falha ao carregar o arquivo JSON: ${filePath}. Erro: ${error.message}`);
        return undefined;
    }
}

/**
 * Inicializa e retorna o objeto de módulos agregados.
 * Usa import() dinâmico para módulos ESM e mantém a mesma "shape" pública anterior.
 */
let modulesPromise;

async function loadModules() {
    if (modulesPromise) return modulesPromise;

    modulesPromise = (async () => {
        const modules = {};

        // --- downloads (ESM via dynamic import) ---
        const [
            youtubeMod,
            tiktokMod,
            pinterestMod,
            igdlMod,
            lyricsMod,
            mcpluginsMod,
            spotifyMod,
            soundcloudMod,
            facebookMod,
            vimeoMod,
            twitchMod,
            redditMod,
            dailymotionMod,
            streamableMod,
            bandcampMod,
            alldlMod,
        ] = await Promise.all([
            import('./downloads/youtube.js'),
            import('./downloads/tiktok.js'),
            import('./downloads/pinterest.js'),
            import('./downloads/igdl.js'),
            import('./downloads/lyrics.js'),
            import('./downloads/mcplugins.js'),
            import('./downloads/spotify.js'),
            import('./downloads/soundcloud.js'),
            import('./downloads/facebook.js'),
            import('./downloads/vimeo.js'),
            import('./downloads/twitch.js'),
            import('./downloads/reddit.js'),
            import('./downloads/dailymotion.js'),
            import('./downloads/streamable.js'),
            import('./downloads/bandcamp.js'),
            import('./downloads/alldl.js'),
        ]);

        // Download modules with null checking
        modules.youtube = youtubeMod.default ?? youtubeMod;
        if (modules.youtube && typeof modules.youtube.search !== 'function') {
            console.warn('[EXPORTS] YouTube search function not found, adding fallback');
            modules.youtube.search = () => { throw new Error('YouTube search not available'); };
        }

        modules.tiktok = tiktokMod.default ?? tiktokMod;
        if (modules.tiktok && typeof modules.tiktok.dl !== 'function') {
            console.warn('[EXPORTS] TikTok dl function not found');
        }

        modules.pinterest = pinterestMod.default ?? pinterestMod;
        if (modules.pinterest && typeof modules.pinterest.dl !== 'function') {
            console.warn('[EXPORTS] Pinterest dl function not found');
        }

        modules.igdl = igdlMod.default ?? igdlMod;
        modules.Lyrics = lyricsMod.default ?? lyricsMod;
        modules.mcPlugin = mcpluginsMod.default ?? mcpluginsMod;
        modules.spotify = spotifyMod.default ?? spotifyMod;
        modules.soundcloud = soundcloudMod.default ?? soundcloudMod;
        modules.facebook = facebookMod.default ?? facebookMod;
        modules.vimeo = vimeoMod.default ?? vimeoMod;
        modules.twitch = twitchMod.default ?? twitchMod;
        modules.reddit = redditMod.default ?? redditMod;
        modules.dailymotion = dailymotionMod.default ?? dailymotionMod;
        modules.streamable = streamableMod.default ?? streamableMod;
        modules.bandcamp = bandcampMod.default ?? bandcampMod;
        modules.alldl = alldlMod.default ?? alldlMod;
        
        // Enhanced null checking and error handling for all modules
        if (modules.youtube) {
            // Ensure critical methods exist
            const youtubeMethods = ['search', 'mp3', 'mp4'];
            youtubeMethods.forEach(method => {
                if (typeof modules.youtube[method] !== 'function') {
                    console.warn(`[EXPORTS] YouTube.${method} not available, adding fallback`);
                    modules.youtube[method] = (...args) => {
                        throw new Error(`YouTube ${method} function not available`);
                    };
                }
            });
        } else {
            console.warn('[EXPORTS] YouTube module not loaded');
        }

        // --- utils (ESM via dynamic import) ---
        const [
            styleTextMod,
            verifyUpdateMod,
            emojiMixMod,
            uploadMod,
            tictactoeMod,
            stickerMod,
            commandStatsMod,
            relationshipsMod,
            connect4Mod,
            unoMod,
            memoriaMod,
            achievementsMod,
            giftsMod,
            reputationMod,
            qrcodeMod,
            notesMod,
            calculatorMod,
            audioEditMod,
            transmissaoMod,
        ] = await Promise.all([
            import('./utils/gerarnick.js'),
            import('./utils/update-verify.js'),
            import('./utils/emojimix.js'),
            import('./utils/upload.js'),
            import('./utils/tictactoe.js'),
            import('./utils/sticker.js'),
            import('./utils/commandStats.js'),
            import('./utils/relationships.js'),
            import('./utils/connect4.js'),
            import('./utils/uno.js'),
            import('./utils/memoria.js'),
            import('./utils/achievements.js'),
            import('./utils/gifts.js'),
            import('./utils/reputation.js'),
            import('./utils/qrcode.js'),
            import('./utils/notes.js'),
            import('./utils/calculator.js'),
            import('./utils/audioEdit.js'),
            import('./utils/transmissao.js'),
        ]);

        // Utils modules with null checking
        modules.styleText = styleTextMod.default ?? styleTextMod;
        modules.VerifyUpdate = verifyUpdateMod.default ?? verifyUpdateMod;
        modules.emojiMix = emojiMixMod.default ?? emojiMixMod;
        modules.upload = uploadMod.default ?? uploadMod;
        modules.tictactoe = tictactoeMod.default ?? tictactoeMod;
        modules.stickerModule = stickerMod.default ?? stickerMod;
        modules.commandStats = commandStatsMod.default ?? commandStatsMod;
        modules.relationshipManager = relationshipsMod.default ?? relationshipsMod;
        
        // Novos módulos de jogos e utilidades
        modules.connect4 = connect4Mod.default ?? connect4Mod;
        modules.uno = unoMod.default ?? unoMod;
        modules.memoria = memoriaMod.default ?? memoriaMod;
        modules.achievements = achievementsMod.default ?? achievementsMod;
        modules.gifts = giftsMod.default ?? giftsMod;
        modules.reputation = reputationMod.default ?? reputationMod;
        modules.qrcode = qrcodeMod.default ?? qrcodeMod;
        modules.notes = notesMod.default ?? notesMod;
        modules.calculator = calculatorMod.default ?? calculatorMod;
        modules.audioEdit = audioEditMod.default ?? audioEditMod;
        modules.transmissao = transmissaoMod.default ?? transmissaoMod;

        // expose sendSticker directly (preserving previous API shape) with null check
        if (modules.stickerModule && modules.stickerModule.sendSticker) {
            modules.sendSticker = modules.stickerModule.sendSticker;
        } else {
            console.warn('[EXPORTS] sendSticker function not available');
            modules.sendSticker = () => { throw new Error('sendSticker not available'); };
        }

        // Add null checks for critical utility functions
        if (modules.upload && typeof modules.upload !== 'function') {
            console.warn('[EXPORTS] Upload function not properly exported');
        }
        if (modules.tictactoe && typeof modules.tictactoe.invitePlayer !== 'function') {
            console.warn('[EXPORTS] TicTacToe invitePlayer not available');
        }
        if (modules.commandStats && typeof modules.commandStats.getMostUsedCommands !== 'function') {
            console.warn('[EXPORTS] CommandStats functions not available');
        }

        // --- private (ESM via dynamic import) ---
        const [iaMod, temuScammerMod, antitoxicMod, iaExpandedMod, antipalavra] = await Promise.all([
            import('./private/ia.js'),
            import('./private/temuScammer.js'),
            import('./private/antitoxic.js'),
            import('./private/iaExpanded.js'),
            import('./private/antipalavra.js'),
        ]);

        // Private modules with null checking
        if (iaMod.default || iaMod) {
            modules.ia = {
                makeAssistentRequest: iaMod.makeAssistentRequest || iaMod.processUserMessages,
                makeCognimaRequest: iaMod.makeCognimaRequest,
                notifyOwnerAboutApiKey: iaMod.notifyOwnerAboutApiKey,
                ...(iaMod.default || iaMod)
            };
            // Add null checks for IA functions
            if (typeof modules.ia.makeAssistentRequest !== 'function') {
                console.warn('[EXPORTS] IA makeAssistentRequest not available');
                modules.ia.makeAssistentRequest = () => { throw new Error('IA makeAssistentRequest not available'); };
            }
            if (typeof modules.ia.makeCognimaRequest !== 'function') {
                console.warn('[EXPORTS] IA makeCognimaRequest not available');
                modules.ia.makeCognimaRequest = () => { throw new Error('IA makeCognimaRequest not available'); };
            }
        } else {
            console.warn('[EXPORTS] IA module not loaded');
            modules.ia = {
                makeAssistentRequest: () => { throw new Error('IA module not available'); },
                makeCognimaRequest: () => { throw new Error('IA module not available'); }
            };
        }

        modules.temuScammer = temuScammerMod.default ?? temuScammerMod;
        modules.antitoxic = antitoxicMod.default ?? antitoxicMod;
        modules.iaExpanded = iaExpandedMod.default ?? iaExpandedMod;
        modules.antipalavra = antipalavra.default ?? antipalavra;

        // --- JSONs (sync read as before, exposed as functions) ---
        const toolsJsonData = loadJsonSync('json/tools.json');
        const vabJsonData = loadJsonSync('json/vab.json');

        modules.toolsJson = () => toolsJsonData;
        modules.vabJson = () => vabJsonData;

        return modules;
    })();

    return modulesPromise;
}

/**
 * Named async accessor for callers that prefer explicit async usage.
 */
export async function getModules() {
    return await loadModules();
}

/**
 * Default export resolves the aggregated modules object via top-level await.
 * This keeps existing ESM consumers using:
 *   const modules = (await import('./funcs/exports.js')).default;
 * working as expected.
 */
const modules = await loadModules();

// Additional safety checks at export level
const safeModules = new Proxy(modules, {
    get(target, prop) {
        if (!(prop in target)) {
            console.warn(`[EXPORTS] Module '${prop}' not found in exports`);
            return undefined;
        }
        const value = target[prop];
        if (typeof value === 'object' && value !== null) {
            // Add property access validation for objects
            return new Proxy(value, {
                get(obj, key) {
                    if (!(key in obj)) {
                        console.warn(`[EXPORTS] Property '${key}' not found in module '${prop}'`);
                        return undefined;
                    }
                    return obj[key];
                }
            });
        }
        return value;
    }
});

export default safeModules;