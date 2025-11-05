const { default: makeWASocket } = require('whaileys/lib/Socket');
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('whaileys');
const { Boom } = require('@hapi/boom');
const NodeCache = require('node-cache');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const SUBBOTS_FILE = path.join(__dirname, '../../database/subbots.json');
const SUBBOTS_DIR = path.join(__dirname, '../../database/subbots');
const BASE_DATABASE_DIR = path.join(__dirname, '../../database');

// Instâncias ativas de sub-bots
const activeSubBots = new Map();

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
        lidowner: '',
        botNumber: phoneNumber
    };

    const configPath = path.join(dirs.databaseDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { config, dirs };
}

/**
 * Inicializa uma instância de sub-bot
 * @returns {Promise<{sock: Object, pairingCode: string|null}>}
 */
async function initializeSubBot(botId, phoneNumber, ownerNumber) {
    try {
        console.log(`🤖 Inicializando sub-bot ${botId}...`);

        const { config, dirs } = createSubBotConfig(botId, phoneNumber, ownerNumber);
        
        const { state, saveCreds } = await useMultiFileAuthState(dirs.authDir, makeCacheableSignalKeyStore);
        const { version } = await fetchLatestBaileysVersion();

        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger,
            browser: ['Ubuntu', 'Edge', '141.0.3537.99'],
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

        // Solicita pairing code
        if (!sock.authState.creds.registered) {
            const cleanPhone = phoneNumber;
            pairingCode = await sock.requestPairingCode(cleanPhone);
            
            console.log(`🔑 Código de pareamento gerado para ${phoneNumber}: ${pairingCode}`);

            // Salva informações do sub-bot
            const subbots = loadSubBots();
            subbots[botId] = {
                id: botId,
                phoneNumber,
                ownerNumber,
                pairingCode,
                status: 'aguardando_pareamento',
                createdAt: new Date().toISOString(),
                lastConnection: null,
                dirs
            };
            saveSubBots(subbots);
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
                    subbots[botId].number = sock.user?.id?.split(':')[0] || phoneNumber;
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
                } else {
                    // Tenta reconectar após 10 segundos
                    console.log(`🔄 Tentando reconectar sub-bot ${botId} em 10 segundos...`);
                    setTimeout(() => {
                        initializeSubBot(botId, phoneNumber, ownerNumber);
                    }, 10000);
                }
            }
        });

        // Handler de mensagens simples (apenas loga por enquanto)
        sock.ev.on('messages.upsert', async (m) => {
            if (!m.messages || m.type !== 'notify') return;
            
            for (const msg of m.messages) {
                if (!msg.message) continue;
                console.log(`📨 Sub-bot ${botId} recebeu mensagem de ${msg.key.remoteJid}`);
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
async function addSubBot(phoneNumber, ownerNumber) {
    try {
        // Valida número
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!/^\d{10,15}$/.test(cleanPhone)) {
            return {
                success: false,
                message: '❌ Número inválido! Use formato: 5511999999999'
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

        // Cria diretórios
        if (!fs.existsSync(SUBBOTS_DIR)) {
            fs.mkdirSync(SUBBOTS_DIR, { recursive: true });
        }

        // Inicializa o sub-bot
        const result = await initializeSubBot(botId, phoneNumber, ownerNumber);

        // Monta mensagem de resposta
        let message = `✅ *SUB-BOT CRIADO COM SUCESSO!*\n\n`;
        message += `📱 *Número:* ${phoneNumber}\n`;
        message += `🆔 *ID:* ${botId}\n\n`;

        if (result.pairingCode) {
            message += `🔑 *CÓDIGO DE PAREAMENTO:*\n`;
            message += `\`\`\`${result.pairingCode}\`\`\`\n\n`;
            message += `📲 *Instruções:*\n`;
            message += `1. Abra o WhatsApp no número ${phoneNumber}\n`;
            message += `2. Vá em Configurações > Aparelhos conectados\n`;
            message += `3. Clique em "Conectar um aparelho"\n`;
            message += `4. Clique em "Conectar com número de telefone"\n`;
            message += `5. Digite o código acima\n\n`;
            message += `⏱️ O código expira em alguns minutos!`;
        } else {
            message += `✅ Sub-bot já está autenticado e conectando...`;
        }

        return {
            success: true,
            message,
            botId,
            phoneNumber,
            pairingCode: result.pairingCode
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

        console.log(`🤖 Inicializando ${keys.length} sub-bot(s)...`);

        for (const botId of keys) {
            const bot = subbots[botId];
            
            // Só inicializa se não estiver ativo
            if (!activeSubBots.has(botId)) {
                try {
                    await initializeSubBot(botId, bot.phoneNumber, bot.ownerNumber);
                    // Pequeno delay entre inicializações
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`❌ Erro ao inicializar sub-bot ${botId}:`, error.message);
                }
            }
        }

        console.log(`✅ Inicialização de sub-bots concluída!`);
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

module.exports = {
    addSubBot,
    removeSubBot,
    listSubBots,
    initializeAllSubBots,
    disconnectAllSubBots,
    getSubBotInfo,
    activeSubBots
};
