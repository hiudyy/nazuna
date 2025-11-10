// Lista central de todos os módulos de menu que queremos carregar.
// O nome da chave será o nome no objeto final. O valor é o caminho do arquivo.
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const menuModules = {
    menu: "./menu.js",
    menuAlterador: "./alteradores.js",
    menudown: "./menudown.js",
    menuadm: "./menuadm.js",
    menubn: "./menubn.js",
    menuDono: "./menudono.js",
    menuMembros: "./menumemb.js",
    menuFerramentas: "./ferramentas.js",
    menuSticker: "./menufig.js",
    menuIa: "./menuia.js",
    menuTopCmd: "./topcmd.js",
    menuRPG: "./menurpg.js",
    menuVIP: "./menuvip.js"
};

/**
 * Carrega todos os menus listados em menuModules de forma síncrona.
 * Valida se cada módulo foi carregado corretamente.
 * @returns {Object} Um objeto contendo todos os menus carregados.
 */
function loadMenus() {
    const loadedMenus = {};
    const invalidMenus = [];

    for (const [name, filePath] of Object.entries(menuModules)) {
        try {
            // Import dinâmico síncrono via createRequire para manter o comportamento existente
            const { createRequire } = require('module');
            const localRequire = createRequire(import.meta.url);
            const mod = localRequire(path.resolve(__dirname, filePath));
            loadedMenus[name] = mod;
        } catch (error) {
            console.error(
                `[${new Date().toISOString()}] Falha ao carregar o menu '${name}' de ${filePath}:`,
                error.message
            );
            invalidMenus.push(name);
        }
    }

    if (invalidMenus.length > 0) {
        console.warn(
            `[${new Date().toISOString()}] AVISO: Os seguintes menus não foram carregados corretamente: ${invalidMenus.join(
                ', '
            )}.`
        );
        console.error(
            `[${new Date().toISOString()}] ERRO CRÍTICO: A inicialização pode estar incompleta.`
        );
    }

    return loadedMenus;
}

// Em ESM, exportamos o objeto já carregado mantendo o mesmo shape do module.exports anterior
const menus = loadMenus();
export default menus;