// Lista central de todos os módulos de menu que queremos carregar.
// O nome da chave será o nome no objeto final. O valor é o caminho do arquivo.
const path = require('path');

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
            const module = require(path.resolve(__dirname, filePath));
            loadedMenus[name] = module;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Falha ao carregar o menu '${name}' de ${filePath}:`, error.message);
            invalidMenus.push(name);
        }
    }

    // Se houver menus inválidos, loga um aviso claro
    if (invalidMenus.length > 0) {
        console.warn(`[${new Date().toISOString()}] AVISO: Os seguintes menus não foram carregados corretamente: ${invalidMenus.join(', ')}.`);
        console.error(`[${new Date().toISOString()}] ERRO CRÍTICO: A inicialização pode estar incompleta.`);
    }

    return loadedMenus;
}

// Carrega os menus e os exporta de forma síncrona.
module.exports = loadMenus();