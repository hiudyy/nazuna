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
            filmesMod,
        ] = await Promise.all([
            import('./downloads/youtube.js'),
            import('./downloads/tiktok.js'),
            import('./downloads/pinterest.js'),
            import('./downloads/igdl.js'),
            import('./downloads/lyrics.js'),
            import('./downloads/mcplugins.js'),
            import('./downloads/filmes.js'),
        ]);

        modules.youtube = youtubeMod.default ?? youtubeMod;
        modules.tiktok = tiktokMod.default ?? tiktokMod;
        modules.pinterest = pinterestMod.default ?? pinterestMod;
        modules.igdl = igdlMod.default ?? igdlMod;
        modules.Lyrics = lyricsMod.default ?? lyricsMod;
        modules.mcPlugin = mcpluginsMod.default ?? mcpluginsMod;
        modules.FilmesDL = filmesMod.default ?? filmesMod;

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
        ] = await Promise.all([
            import('./utils/gerarnick.js'),
            import('./utils/update-verify.js'),
            import('./utils/emojimix.js'),
            import('./utils/upload.js'),
            import('./utils/tictactoe.js'),
            import('./utils/sticker.js'),
            import('./utils/commandStats.js'),
            import('./utils/relationships.js'),
        ]);

        modules.styleText = styleTextMod.default ?? styleTextMod;
        modules.VerifyUpdate = verifyUpdateMod.default ?? verifyUpdateMod;
        modules.emojiMix = emojiMixMod.default ?? emojiMixMod;
        modules.upload = uploadMod.default ?? uploadMod;
        modules.tictactoe = tictactoeMod.default ?? tictactoeMod;
        modules.stickerModule = stickerMod.default ?? stickerMod;
        modules.commandStats = commandStatsMod.default ?? commandStatsMod;
        modules.relationshipManager = relationshipsMod.default ?? relationshipsMod;

        // expose sendSticker directly (preserving previous API shape)
        if (modules.stickerModule && modules.stickerModule.sendSticker) {
            modules.sendSticker = modules.stickerModule.sendSticker;
        }

        // --- private (ESM via dynamic import) ---
        const [iaMod, temuScammerMod] = await Promise.all([
            import('./private/ia.js'),
            import('./private/temuScammer.js'),
        ]);

        modules.ia = iaMod.default ?? iaMod;
        modules.temuScammer = temuScammerMod.default ?? temuScammerMod;

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
export default modules;