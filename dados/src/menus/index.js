// Loader ESM-safe para todos os menus.
// Mantém a mesma API: objeto `menus` com chaves nomeadas (menu, menuAlterador, etc.)
// e adiciona `getMenus()` para acesso explícito assíncrono.

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa estático dos menus e seus arquivos correspondentes.
const menuModules = {
    menu: './menu.js',
    menuAlterador: './alteradores.js',
    menudown: './menudown.js',
    menuadm: './menuadm.js',
    menubn: './menubn.js',
    menuDono: './menudono.js',
    menuMembros: './menumemb.js',
    menuFerramentas: './ferramentas.js',
    menuSticker: './menufig.js',
    menuIa: './menuia.js',
    menuTopCmd: './topcmd.js',
    menuRPG: './menurpg.js',
    menuVIP: './menuvip.js',
    menuBuscas: './menubuscas.js',
    menuBrawlStars: './menubrawl.js'
};

let menusPromise;

async function loadMenus() {
    if (menusPromise) return menusPromise;

    menusPromise = (async () => {
        const menus = {};

        for (const [name, relPath] of Object.entries(menuModules)) {
            try {
                const mod = await import(new URL(relPath, import.meta.url));
                const fn = mod.default || mod[name];

                if (typeof fn === 'function') {
                    menus[name] = fn;
                } else {
                    console.error(
                        `[${new Date().toISOString()}] [AVISO] Menu '${name}' em ${relPath} não exporta função válida (esperado default function).`
                    );
                }
            } catch (err) {
                console.error(
                    `[${new Date().toISOString()}] [AVISO] Falha ao carregar o menu '${name}' de ${relPath}: ${err.message}`
                );
            }
        }

        const failed = Object.keys(menuModules).filter((name) => !menus[name]);
        if (failed.length > 0) {
            console.error(
                `[${new Date().toISOString()}] [AVISO] Os seguintes menus não foram carregados corretamente: ${failed.join(', ')}.`
            );
            console.error(
                `[${new Date().toISOString()}] [AVISO] Verifique se os arquivos exportam "export default function(...) { ... }" conforme esperado.`
            );
        }

        return menus;
    })();

    return menusPromise;
}

export async function getMenus() {
    return await loadMenus();
}

const menus = await loadMenus();
export default menus;