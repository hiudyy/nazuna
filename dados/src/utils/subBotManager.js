import a, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from 'whaileys';
const makeWASocket = a.default;
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swiftly from 'swiftly';
import { buildUserId, getLidFromJidCached, getUserName } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUBBOTS_FILE = path.join(__dirname, '../../database/subbots.json');
const SUBBOTS_DIR = path.join(__dirname, '../../database/subbots');
const BASE_DATABASE_DIR = path.join(__dirname, '../../database');

/**
 * Busca a versão do Baileys diretamente do JSON do GitHub
 * @returns {Promise<{version: number[]}>}
 */
async function fetchBaileysVersionFromGitHub() {
    try {
        const data = await swiftly.get('https://raw.githubusercontent.com/WhiskeySockets/Baileys/refs/heads/master/src/Defaults/baileys-version.json', {
            timeout: 120000
        });
        return {
            version: data.version
        };
    } catch (error) {
        console.error('❌ Erro ao buscar versão do Baileys do GitHub, usando função fetchLatestBaileysVersion como fallback:', error.message);
        // Fallback para função original caso falhe
        return await fetchLatestBaileysVersion();
    }
}

// Instâncias ativas de sub-bots
const activeSubBots = new Map();

// Controle de geração de código em progresso
const generatingCode = new Set();

// Logger silencioso
const logger = pino({ level: 'silent' });

/**
 * Carrega lista de sub-bots do arquivo
 */
function loadSubBots() {
    try {
        if (!fs.existsSync(SUBBOTS_FILE)) {
            fs.writeFileSync(SUBBOTS_FILE, JSON.stringify({ subbots: {} }, null, 2));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(SUBBOTS_FILE, 'utf-8'));
        return data.subbots || {};
    } catch (error) {
        console.error('Erro ao carregar sub-bots:', error);
        return {};
    }
}

/**
 * Salva lista de sub-bots no arquivo
 */
function saveSubBots(subbots) {
    try {
        const data = { subbots };
        fs.writeFileSync(SUBBOTS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar sub-bots:', error);
        return false;
    }
}

/**
 * Cria diretórios necessários para um sub-bot
 */
function createSubBotDirectories(botId) {
    const botDir = path.join(SUBBOTS_DIR, botId);
    const authDir = path.join(botDir, 'auth');
    const databaseDir = path.join(botDir, 'database');
    const gruposDir = path.join(databaseDir, 'grupos');
    const usersDir = path.join(databaseDir, 'users');
    const donoDir = path.join(databaseDir, 'dono');

    const dirs = [botDir, authDir, databaseDir, gruposDir, usersDir, donoDir];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    return {
        botDir,
        authDir,
        databaseDir,
        gruposDir,
        usersDir,
        donoDir
    };
}

/**
 * Cria configuração inicial para sub-bot
 */
function createSubBotConfig(botId, phoneNumber, ownerNumber) {
    const dirs = createSubBotDirectories(botId);
    
    // Config baseado no principal
    const mainConfigPath = path.join(__dirname, '../config.json');
    let mainConfig = {};
    
    try {
        mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf-8'));
    } catch (error) {
        console.error('Erro ao ler config principal:', error);
    }

        const config = {
        numerodono: ownerNumber || mainConfig.numerodono || '',
        nomedono: mainConfig.nomedono || 'Dono',
        nomebot: `SubBot ${botId.substring(0, 8)}`,
        prefixo: mainConfig.prefixo || '!',
        apikey: mainConfig.apikey || '',
        debug: false,
    // Se ownerNumber já for um LID, persiste aqui; index.js deve passar LID para manter DB consistente
    lidowner: ownerNumber && ownerNumber.includes('@lid') ? ownerNumber : '',
        botNumber: phoneNumber
    };

    const configPath = path.join(dirs.databaseDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { config, dirs };
}

/**
 * Inicializa uma instância de sub-bot
 * @param {boolean} generatePairingCode - Se deve gerar código de pareamento
 * @returns {Promise<{sock: Object, pairingCode: string|null}>}
 */
async function initializeSubBot(botId, phoneNumber, ownerNumber, generatePairingCode = false) {
    try {
        console.log(`🤖 Inicializando sub-bot ${botId}...`);

        const { config, dirs } = createSubBotConfig(botId, phoneNumber, ownerNumber);
        
        const { state, saveCreds } = await useMultiFileAuthState(dirs.authDir, makeCacheableSignalKeyStore);
        const version = [2, 3000, 1030831524];

        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger,
            browser: ['Windows', 'Edge', '143.0.3650.66'],
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: true,
            markOnlineOnConnect: true,
            connectTimeoutMs: 120000,
            retryRequestDelayMs: 5000,
            qrTimeout: 180000,
            keepAliveIntervalMs: 30_000,
            defaultQueryTimeoutMs: undefined,
            msgRetryCounterCache,
            auth: state,
        });

        let pairingCode = null;

        // Aguarda a conexão abrir antes de solicitar pairing code
        if (generatePairingCode && !sock.authState.creds.registered) {
            const cleanPhone = phoneNumber;
            
            console.log(`⏳ Aguardando socket inicializar...`);
            
            // Aguarda um pouco para o socket estar pronto
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                // Agora solicita o código
                pairingCode = await sock.requestPairingCode(cleanPhone);
                
                console.log(`🔑 Código de pareamento gerado para ${phoneNumber}: ${pairingCode}`);

                // Salva informações do sub-bot
                const subbots = loadSubBots();
                if (subbots[botId]) {
                    subbots[botId].pairingCode = pairingCode;
                    subbots[botId].status = 'aguardando_pareamento';
                    subbots[botId].lastPairingRequest = new Date().toISOString();
                    saveSubBots(subbots);
                }
            } catch (pairingError) {
                console.error(`❌ Erro ao solicitar código de pareamento:`, pairingError.message);
                throw new Error(`Não foi possível gerar o código de pareamento. Tente novamente em alguns segundos.`);
            }
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log(`✅ Sub-bot ${botId} conectado com sucesso!`);
                
                const subbots = loadSubBots();
                if (subbots[botId]) {
                    subbots[botId].status = 'conectado';
                    subbots[botId].lastConnection = new Date().toISOString();
                    // Armazena o número do sub-bot em LID para consistência da DB
                    let botNum = sock.user?.id?.split(':')[0] || phoneNumber;
                    try {
                        botNum = await getLidFromJidCached(sock, botNum);
                    } catch (e) {
                        console.warn('Não foi possível normalizar número do sub-bot para LID:', e.message);
                    }
                    subbots[botId].number = botNum;
                    saveSubBots(subbots);
                }
 
                activeSubBots.set(botId, sock);
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(`❌ Sub-bot ${botId} desconectado. Código: ${reason}`);

                activeSubBots.delete(botId);

                const subbots = loadSubBots();
                if (subbots[botId]) {
                    subbots[botId].status = 'desconectado';
                    subbots[botId].lastDisconnection = new Date().toISOString();
                    subbots[botId].disconnectReason = reason;
                    saveSubBots(subbots);
                }

                // Se foi logout, remove completamente
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`🗑️ Sub-bot ${botId} foi deslogado, removendo dados...`);
                    await removeSubBot(botId);
                } else if (reason === 428) {
                    // Erro 428 = aguardando pareamento, não reconectar automaticamente
                    console.log(`⏸️ Sub-bot ${botId} aguardando pareamento. Use o código enviado para conectar.`);
                    if (subbots[botId]) {
                        subbots[botId].status = 'aguardando_pareamento';
                        saveSubBots(subbots);
                    }
                } else if (sock.authState.creds.registered) {
                    // Só reconecta automaticamente se já estiver registrado
                    console.log(`🔄 Tentando reconectar sub-bot ${botId} em 10 segundos...`);
                    setTimeout(() => {
                        initializeSubBot(botId, phoneNumber, ownerNumber);
                    }, 10000);
                } else {
                    console.log(`⏸️ Sub-bot ${botId} não registrado. Aguardando pareamento manual.`);
                }
            }
        });

        // Handler de mensagens - processa comandos
        sock.ev.on('messages.upsert', async (m) => {
            if (!m.messages || m.type !== 'notify') return;
            
            try {
                for (const info of m.messages) {
                    if (!info || !info.message || !info.key?.remoteJid) continue;
                    
                    // Ignora mensagens próprias do bot
                    if (info.key.fromMe) continue;
                    
                    console.log(`📨 Sub-bot ${botId} processando mensagem de ${info.key.remoteJid}`);
                    
                    // Define o caminho do config do sub-bot temporariamente
                    const originalConfigPath = process.env.CONFIG_PATH;
                    const originalDatabasePath = process.env.DATABASE_PATH;
                    const originalIsSubbot = process.env.IS_SUBBOT;
                    const originalSubbotId = process.env.SUBBOT_ID;
                    
                    const subBotConfigPath = path.join(dirs.databaseDir, 'config.json');
                    
                    // IMPORTANTE: Define as variáveis ANTES de importar qualquer módulo
                    process.env.CONFIG_PATH = subBotConfigPath;
                    process.env.DATABASE_PATH = dirs.databaseDir;
                    process.env.IS_SUBBOT = 'true';
                    process.env.SUBBOT_ID = botId;
                    
                    try {
                        // Carrega o módulo de processamento (import dinâmico)
                        // As variáveis de ambiente devem estar definidas antes deste import
                        const indexModule = await import('../index.js');
                        
                        // Obtém a função default exportada
                        const NazuninhaBotExec = indexModule.default || indexModule;
                        
                        if (typeof NazuninhaBotExec !== 'function') {
                            console.error(`❌ Erro: NazuninhaBotExec não é uma função. Tipo: ${typeof NazuninhaBotExec}`);
                            console.error(`Módulo importado:`, Object.keys(indexModule));
                            continue;
                        }
                        
                        // Cria um cache simples para este sub-bot usando Map (compatível com bot principal)
                        const messagesCache = new Map();
                        
                        // Chave composta: remoteJid_messageId para permitir filtrar por grupo
                        if (info.key?.id && info.key?.remoteJid) {
                            const cacheKey = `${info.key.remoteJid}_${info.key.id}`;
                            messagesCache.set(cacheKey, info);
                        }
                        
                        // Processa a mensagem usando a mesma lógica do bot principal
                        await NazuninhaBotExec(sock, info, null, messagesCache, null);
                    } catch (importError) {
                        console.error(`❌ Erro ao importar/executar processamento no sub-bot ${botId}:`, importError.message);
                        console.error(`Stack trace:`, importError.stack);
                    } finally {
                        // Restaura o config original
                        if (originalConfigPath !== undefined) {
                            process.env.CONFIG_PATH = originalConfigPath;
                        } else {
                            delete process.env.CONFIG_PATH;
                        }
                        if (originalDatabasePath !== undefined) {
                            process.env.DATABASE_PATH = originalDatabasePath;
                        } else {
                            delete process.env.DATABASE_PATH;
                        }
                        if (originalIsSubbot !== undefined) {
                            process.env.IS_SUBBOT = originalIsSubbot;
                        } else {
                            delete process.env.IS_SUBBOT;
                        }
                        if (originalSubbotId !== undefined) {
                            process.env.SUBBOT_ID = originalSubbotId;
                        } else {
                            delete process.env.SUBBOT_ID;
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Erro geral ao processar mensagem no sub-bot ${botId}:`, error.message);
                console.error(`Stack trace:`, error.stack);
            }
        });

        return { sock, pairingCode };
    } catch (error) {
        console.error(`❌ Erro ao inicializar sub-bot ${botId}:`, error);
        throw error;
    }
}

/**
 * Adiciona um novo sub-bot
 */
async function addSubBot(phoneNumber, ownerNumber, subBotLid) {
    try {
    // Valida número
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!/^\d{10,15}$/.test(cleanPhone)) {
            return {
                success: false,
                message: '❌ Número inválido! Use formato: 5511999999999'
            };
        }

        // Valida LID do sub-bot
        if (!subBotLid || !subBotLid.includes('@lid')) {
            return {
                success: false,
                message: '❌ LID do sub-bot inválido! Marque o número do sub-bot.'
            };
        }

        // Gera ID único
        const botId = `subbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Verifica se já existe
        const subbots = loadSubBots();
        const existing = Object.values(subbots).find(b => b.phoneNumber === phoneNumber);
        if (existing) {
            return {
                success: false,
                message: '❌ Já existe um sub-bot com este número!'
            };
        }

        // Verifica se o LID já está cadastrado
        const existingLid = Object.values(subbots).find(b => b.subBotLid === subBotLid);
        if (existingLid) {
            return {
                success: false,
                message: '❌ Este número já está cadastrado como sub-bot!'
            };
        }

        // Cria diretórios
        if (!fs.existsSync(SUBBOTS_DIR)) {
            fs.mkdirSync(SUBBOTS_DIR, { recursive: true });
        }

        // Salva as informações do sub-bot SEM inicializar ainda
        // ownerNumber here should already be normalized to LID (index.js will pass LID).
        subbots[botId] = {
            id: botId,
            phoneNumber,
            ownerNumber,
            subBotLid,
            status: 'aguardando_codigo',
            createdAt: new Date().toISOString(),
            lastConnection: null,
            pairingCode: null
        };
        saveSubBots(subbots);

        // Cria diretórios mas não inicializa
        createSubBotDirectories(botId);
        createSubBotConfig(botId, phoneNumber, ownerNumber);

        // Monta mensagem de resposta
        let message = `✅ *SUB-BOT REGISTRADO COM SUCESSO!*\n\n`;
        message += `📱 *Número:* ${phoneNumber}\n`;
        message += `🆔 *ID:* \`${botId}\`\n`;
        message += `� *LID:* \`${subBotLid}\`\n\n`;
        message += `⚠️ *IMPORTANTE:*\n`;
        message += `O sub-bot foi registrado mas ainda não está ativo.\n\n`;
        message += `📲 *Próximo passo:*\n`;
        message += `O dono do sub-bot (${phoneNumber}) deve usar o comando:\n`;
        message += `\`!gerarcodigo\`\n\n`;
        message += `Isso gerará o código de pareamento para conectar o sub-bot!`;

        return {
            success: true,
            message,
            botId,
            phoneNumber,
            subBotLid
        };
    } catch (error) {
        console.error('Erro ao adicionar sub-bot:', error);
        return {
            success: false,
            message: `❌ Erro ao criar sub-bot: ${error.message}`
        };
    }
}

/**
 * Remove um sub-bot
 */
async function removeSubBot(botId) {
    try {
        const subbots = loadSubBots();
        
        if (!subbots[botId]) {
            return {
                success: false,
                message: '❌ Sub-bot não encontrado!'
            };
        }

        // Desconecta se estiver ativo
        const activeSock = activeSubBots.get(botId);
        if (activeSock) {
            try {
                await activeSock.logout();
            } catch (e) {
                console.log('Erro ao fazer logout:', e.message);
            }
            activeSubBots.delete(botId);
        }

        // Remove diretório
        const botDir = path.join(SUBBOTS_DIR, botId);
        if (fs.existsSync(botDir)) {
            fs.rmSync(botDir, { recursive: true, force: true });
        }

        // Remove do registro
        delete subbots[botId];
        saveSubBots(subbots);

        return {
            success: true,
            message: `✅ Sub-bot ${botId} removido com sucesso!`
        };
    } catch (error) {
        console.error('Erro ao remover sub-bot:', error);
        return {
            success: false,
            message: `❌ Erro ao remover sub-bot: ${error.message}`
        };
    }
}

/**
 * Lista todos os sub-bots
 */
function listSubBots() {
    try {
        const subbots = loadSubBots();
        const list = Object.values(subbots);

        if (list.length === 0) {
            return {
                success: true,
                message: '📋 Nenhum sub-bot cadastrado.',
                subbots: []
            };
        }

        return {
            success: true,
            subbots: list.map(bot => ({
                id: bot.id,
                phoneNumber: bot.phoneNumber,
                number: bot.number || 'N/A',
                status: bot.status || 'desconhecido',
                createdAt: bot.createdAt,
                lastConnection: bot.lastConnection || 'Nunca',
                isActive: activeSubBots.has(bot.id)
            }))
        };
    } catch (error) {
        console.error('Erro ao listar sub-bots:', error);
        return {
            success: false,
            message: `❌ Erro ao listar sub-bots: ${error.message}`,
            subbots: []
        };
    }
}

/**
 * Inicializa todos os sub-bots salvos
 */
async function initializeAllSubBots() {
    try {
        const subbots = loadSubBots();
        const keys = Object.keys(subbots);

        if (keys.length === 0) {
            console.log('📋 Nenhum sub-bot para inicializar.');
            return;
        }

        console.log(`🤖 Verificando ${keys.length} sub-bot(s)...`);

        let initialized = 0;
        for (const botId of keys) {
            const bot = subbots[botId];
            
            // Só inicializa se não estiver ativo e se tiver credenciais salvas (já foi pareado)
            if (!activeSubBots.has(botId)) {
                const authDir = path.join(SUBBOTS_DIR, botId, 'auth');
                const credsFile = path.join(authDir, 'creds.json');
                
                // Verifica se já foi pareado (tem creds.json)
                if (fs.existsSync(credsFile)) {
                    try {
                        console.log(`🔄 Inicializando sub-bot ${botId}...`);
                        await initializeSubBot(botId, bot.phoneNumber, bot.ownerNumber, false);
                        initialized++;
                        // Pequeno delay entre inicializações
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        console.error(`❌ Erro ao inicializar sub-bot ${botId}:`, error.message);
                    }
                } else {
                    console.log(`⏸️ Sub-bot ${botId} aguardando pareamento inicial.`);
                }
            }
        }

        console.log(`✅ Inicialização concluída! ${initialized} sub-bot(s) conectado(s).`);
    } catch (error) {
        console.error('❌ Erro ao inicializar sub-bots:', error);
    }
}

/**
 * Desconecta todos os sub-bots
 */
async function disconnectAllSubBots() {
    try {
        console.log('🛑 Desconectando todos os sub-bots...');
        
        for (const [botId, sock] of activeSubBots.entries()) {
            try {
                await sock.logout();
                console.log(`✅ Sub-bot ${botId} desconectado`);
            } catch (error) {
                console.error(`❌ Erro ao desconectar sub-bot ${botId}:`, error.message);
            }
        }

        activeSubBots.clear();
        console.log('✅ Todos os sub-bots foram desconectados');
    } catch (error) {
        console.error('❌ Erro ao desconectar sub-bots:', error);
    }
}

/**
 * Obtém informações de um sub-bot específico
 */
function getSubBotInfo(botId) {
    const subbots = loadSubBots();
    const bot = subbots[botId];
    
    if (!bot) {
        return { success: false, message: '❌ Sub-bot não encontrado!' };
    }

    return {
        success: true,
        bot: {
            ...bot,
            isActive: activeSubBots.has(botId)
        }
    };
}

/**
 * Reconecta um sub-bot específico após pareamento
 */
async function reconnectSubBot(botId) {
    try {
        const subbots = loadSubBots();
        const bot = subbots[botId];
        
        if (!bot) {
            return {
                success: false,
                message: '❌ Sub-bot não encontrado!'
            };
        }

        if (activeSubBots.has(botId)) {
            return {
                success: false,
                message: '⚠️ Sub-bot já está conectado!'
            };
        }

        console.log(`🔄 Reconectando sub-bot ${botId}...`);
        await initializeSubBot(botId, bot.phoneNumber, bot.ownerNumber, false);

        return {
            success: true,
            message: `✅ Sub-bot ${botId} reconectando...`
        };
    } catch (error) {
        console.error('Erro ao reconectar sub-bot:', error);
        return {
            success: false,
            message: `❌ Erro ao reconectar: ${error.message}`
        };
    }
}

/**
 * Gera código de pareamento para um sub-bot específico
 * Reseta as credenciais e gera novo código
 */
async function generatePairingCodeForSubBot(userLid) {
    try {
        const subbots = loadSubBots();
        
        // Encontra o sub-bot pelo LID
        const botEntry = Object.entries(subbots).find(([_, bot]) => bot.subBotLid === userLid);
        
        if (!botEntry) {
            return {
                success: false,
                message: '❌ Você não está cadastrado como sub-bot!'
            };
        }

        const [botId, bot] = botEntry;

        // Verifica se já está gerando código
        if (generatingCode.has(botId)) {
            return {
                success: false,
                message: '⏳ Já existe uma geração de código em andamento! Aguarde alguns segundos e tente novamente.'
            };
        }

        // Marca como gerando
        generatingCode.add(botId);

        try {
            // Desconecta se estiver ativo
            const activeSock = activeSubBots.get(botId);
            if (activeSock) {
                try {
                    await activeSock.logout();
                    activeSubBots.delete(botId);
                } catch (e) {
                    console.log('Desconectando sub-bot anterior:', e.message);
                }
            }

            // Remove credenciais antigas
            const authDir = path.join(SUBBOTS_DIR, botId, 'auth');
            if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                fs.mkdirSync(authDir, { recursive: true });
            }

            console.log(`🔑 Gerando novo código de pareamento para sub-bot ${botId}...`);

            // Inicializa com geração de código
            const result = await initializeSubBot(botId, bot.phoneNumber, bot.ownerNumber, true);

            if (!result.pairingCode) {
                return {
                    success: false,
                    message: '❌ Erro ao gerar código de pareamento!'
                };
            }

            // Monta mensagem com o código
            let message = `🔑 *CÓDIGO DE PAREAMENTO GERADO!*\n\n`;
            message += `📱 *Seu número:* ${bot.phoneNumber}\n`;
            message += `🆔 *ID:* \`${botId}\`\n\n`;
            message += `🔢 *CÓDIGO:*\n`;
            message += `\`\`\`${result.pairingCode}\`\`\`\n\n`;
            message += `📲 *Instruções:*\n`;
            message += `1. Abra o WhatsApp no seu número\n`;
            message += `2. Vá em *Configurações > Aparelhos conectados*\n`;
            message += `3. Clique em *"Conectar um aparelho"*\n`;
            message += `4. Clique em *"Conectar com número de telefone"*\n`;
            message += `5. Digite o código acima\n\n`;
            message += `⏱️ *Atenção:* O código expira em alguns minutos!\n`;
            message += `🔄 Após parear, você será conectado automaticamente como sub-bot!`;

            return {
                success: true,
                message,
                pairingCode: result.pairingCode,
                botId
            };
        } finally {
            // Remove da lista de gerando após 10 segundos
            setTimeout(() => {
                generatingCode.delete(botId);
            }, 10000);
        }
    } catch (error) {
        console.error('Erro ao gerar código de pareamento:', error);
        // Remove do controle em caso de erro
        generatingCode.delete(botId);
        return {
            success: false,
            message: `❌ Erro ao gerar código: ${error.message}`
        };
    }
}

export {
    addSubBot,
    removeSubBot,
    listSubBots,
    initializeAllSubBots,
    disconnectAllSubBots,
    getSubBotInfo,
    reconnectSubBot,
    generatePairingCodeForSubBot,
    activeSubBots
};
