import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Em ESM, definimos __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carrega um módulo JavaScript local de forma síncrona usando require disponível globalmente
 * em tempo de execução (Node >= 22 com --experimental-require-module, ou via createRequire).
 * Para manter compatibilidade, usamos createRequire.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Carrega um módulo JavaScript local de forma síncrona.
 * @param {string} modulePath - O caminho relativo para o módulo.
 * @returns {any | undefined} O módulo carregado ou undefined se falhar.
 */
function loadModuleSync(modulePath) {
    try {
        return require(path.resolve(__dirname, modulePath));
    } catch (error) {
        console.warn(`[AVISO] Não foi possível carregar o módulo local: ${modulePath}. Erro: ${error.message}`);
        return undefined;
    }
}

/**
 * Carrega e faz o parse de um arquivo JSON de forma síncrona.
 * @param {string} filePath - O caminho relativo para o arquivo JSON.
 * @returns {any | undefined} O objeto JSON ou undefined se falhar.
 */
function loadJsonSync(filePath) {
    try {
        const fullPath = path.resolve(__dirname, filePath);
        const data = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`[ERRO] Falha ao carregar o arquivo JSON: ${filePath}. Erro: ${error.message}`);
        return undefined;
    }
}

// Caminhos dos módulos locais organizados por pastas
const localModulePaths = {
    // --- downloads ---
    youtube: "./downloads/youtube.js",
    tiktok: "./downloads/tiktok.js",
    pinterest: "./downloads/pinterest.js",
    igdl: "./downloads/igdl.js",
    Lyrics: "./downloads/lyrics.js",
    mcPlugin: "./downloads/mcplugins.js",
    FilmesDL: "./downloads/filmes.js",

    // --- utils ---
    styleText: "./utils/gerarnick.js",
    VerifyUpdate: "./utils/update-verify.js",
    emojiMix: "./utils/emojimix.js",
    upload: "./utils/upload.js",
    tictactoe: "./utils/tictactoe.js",
    stickerModule: "./utils/sticker.js",
    commandStats: "./utils/commandStats.js",
    relationshipManager: "./utils/relationships.js",

    // --- private ---
    ia: "./private/ia.js",
    temuScammer: "./private/temuScammer.js",
};

const modules = (() => {
    try {
        // Carrega todos os módulos locais de forma síncrona
        const loadedResources = {};
        for (const [key, filePath] of Object.entries(localModulePaths)) {
            loadedResources[key] = loadModuleSync(filePath);
        }

        // Carrega os JSONs de forma síncrona
        loadedResources.toolsJson = loadJsonSync("json/tools.json");
        loadedResources.vabJson = loadJsonSync("json/vab.json");

        // Monta o objeto final para exportação (shape compatível com o CommonJS anterior)
        return {
            ...loadedResources,
            sendSticker: loadedResources.stickerModule?.sendSticker,
            stickerModule: undefined,
            toolsJson: () => loadedResources.toolsJson,
            vabJson: () => loadedResources.vabJson,
        };
    } catch (error) {
        console.error(`[ERRO FATAL] Ocorreu um erro crítico durante a inicialização:`, error.message);
        console.log(`[SISTEMA] Encerrando a aplicação devido a uma falha na inicialização.`);
        process.exit(1);
    }
})();

export default modules;