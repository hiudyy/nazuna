import fs from 'fs';
import pathz from 'path';
import crypto from 'crypto';
import { ensureDirectoryExists, ensureJsonFileExists, loadJsonFile, normalizar, getUserName, isGroupId, isUserId, isValidLid, isValidJid, buildUserId, getLidFromJidCached, idsMatch, loadJsonFileSafe, saveJsonFileSafe, validateLevelingUser, validateEconomyUser, validateGroupData, createBackup, normalizeParam, compareParams, findKeyIgnoringAccents, findInArrayIgnoringAccents, resolveParamAlias, matchParam, PARAM_ALIASES } from './helpers.js';
import {
  DATABASE_DIR,
  GRUPOS_DIR,
  USERS_DIR,
  DONO_DIR,
  PARCERIAS_DIR,
  TMP_DIR,
  LEVELING_FILE,
  CUSTOM_AUTORESPONSES_FILE,
  DIVULGACAO_FILE,
  NO_PREFIX_COMMANDS_FILE,
  COMMAND_ALIASES_FILE,
  GLOBAL_BLACKLIST_FILE,
  MENU_DESIGN_FILE,
  ECONOMY_FILE,
  MSGPREFIX_FILE,
  MSGBOTON_FILE,
  CUSTOM_REACTS_FILE,
  REMINDERS_FILE,
  CMD_NOT_FOUND_FILE,
  ANTIFLOOD_FILE,
  ANTIPV_FILE,
  GLOBAL_BLOCKS_FILE,
  CMD_LIMIT_FILE,
  CMD_USER_LIMITS_FILE,
  ANTISPAM_FILE,
  BOT_STATE_FILE,
  AUTO_HORARIOS_FILE,
  MODO_LITE_FILE,
  SUBDONOS_FILE,
  ALUGUEIS_FILE,
  CODIGOS_ALUGUEL_FILE,
  RELATIONSHIPS_FILE,
  CUSTOM_COMMANDS_FILE,
  GROUP_CUSTOMIZATION_FILE,
  MENU_AUDIO_FILE,
  MENU_LERMAIS_FILE,
  CONFIG_FILE
} from './paths.js';

ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);
ensureDirectoryExists(PARCERIAS_DIR);
ensureJsonFileExists(ANTIFLOOD_FILE);
ensureJsonFileExists(CMD_LIMIT_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(CMD_USER_LIMITS_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(ANTISPAM_FILE, {
  enabled: false,
  limit: 5,
  interval: 10,
  blockTime: 600,
  users: {},
  blocks: {}
});
ensureJsonFileExists(ANTIPV_FILE, {
  mode: 'off',
  message: '🚫 Este comando só funciona em grupos!'
});
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(GLOBAL_BLOCKS_FILE, {
  commands: {},
  users: {}
});
ensureJsonFileExists(BOT_STATE_FILE, {
  status: 'on'
});
ensureJsonFileExists(MODO_LITE_FILE, {
  status: false
});
ensureDirectoryExists(TMP_DIR);
ensureJsonFileExists(CUSTOM_AUTORESPONSES_FILE, {
  responses: []
});
ensureJsonFileExists(NO_PREFIX_COMMANDS_FILE, {
  commands: []
});
ensureJsonFileExists(COMMAND_ALIASES_FILE, {
  aliases: []
});
ensureJsonFileExists(CUSTOM_COMMANDS_FILE, {
  commands: []
});
ensureJsonFileExists(GLOBAL_BLACKLIST_FILE, {
  users: {},
  groups: {}
});
ensureJsonFileExists(MENU_DESIGN_FILE, {
  header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
  menuTopBorder: "╭┈",
  bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
  menuTitleIcon: "🍧ฺꕸ▸",
  menuItemIcon: "•.̇𖥨֗🍓⭟",
  separatorIcon: "❁",
  middleBorder: "┊"
});
ensureJsonFileExists(ECONOMY_FILE, {
  users: {},
  shop: {
    "pickaxe_bronze": { name: "Picareta de Bronze", price: 500, type: "tool", toolType: "pickaxe", tier: "bronze", durability: 20, effect: { mineBonus: 0.1 } },
    "pickaxe_ferro": { name: "Picareta de Ferro", price: 1500, type: "tool", toolType: "pickaxe", tier: "ferro", durability: 60, effect: { mineBonus: 0.25 } },
    "pickaxe_diamante": { name: "Picareta de Diamante", price: 5000, type: "tool", toolType: "pickaxe", tier: "diamante", durability: 150, effect: { mineBonus: 0.5 } },
    "repairkit": { name: "Kit de Reparos", price: 350, type: "consumable", effect: { repair: 40 } },
    "vault": { name: "Cofre", price: 1000, type: "upgrade", effect: { bankCapacity: 5000 } },
    "lucky": { name: "Amuleto da Sorte", price: 1500, type: "upgrade", effect: { workBonus: 0.2 } },
    "rod": { name: "Vara de Pesca", price: 400, type: "tool", effect: { fishBonus: 0.2 } },
    "lamp": { name: "Lanterna", price: 600, type: "tool", effect: { exploreBonus: 0.2 } },
    "bow": { name: "Arco de Caça", price: 800, type: "tool", effect: { huntBonus: 0.25 } },
    "forge": { name: "Kit de Forja", price: 1200, type: "tool", effect: { forgeBonus: 0.25 } },
    // Player Equipment - Weapons
    "espada_ferro": { name: "Espada de Ferro", price: 800, type: "equipment", slot: "weapon", attackBonus: 10, durability: 50 },
    "espada_aco": { name: "Espada de Aço", price: 1500, type: "equipment", slot: "weapon", attackBonus: 18, durability: 80 },
    "espada_diamante": { name: "Espada de Diamante", price: 3000, type: "equipment", slot: "weapon", attackBonus: 30, durability: 120 },
    "arco_basico": { name: "Arco Básico", price: 600, type: "equipment", slot: "weapon", attackBonus: 8, durability: 40 },
    "arco_reforcado": { name: "Arco Reforçado", price: 1800, type: "equipment", slot: "weapon", attackBonus: 20, durability: 70 },
    // Player Equipment - Armor
    "armadura_couro": { name: "Armadura de Couro", price: 900, type: "equipment", slot: "armor", defenseBonus: 8, durability: 60 },
    "armadura_ferro": { name: "Armadura de Ferro", price: 2400, type: "equipment", slot: "armor", defenseBonus: 20, durability: 100 },
    "armadura_aco": { name: "Armadura de Aço", price: 3600, type: "equipment", slot: "armor", defenseBonus: 32, durability: 140 },
    "escudo_madeira": { name: "Escudo de Madeira", price: 450, type: "equipment", slot: "shield", defenseBonus: 5, durability: 30 },
    "escudo_ferro": { name: "Escudo de Ferro", price: 1350, type: "equipment", slot: "shield", defenseBonus: 15, durability: 60 },
    // Player Equipment - Helmets
    "elmo_couro": { name: "Elmo de Couro", price: 600, type: "equipment", slot: "helmet", defenseBonus: 4, durability: 40 },
    "elmo_ferro": { name: "Elmo de Ferro", price: 1200, type: "equipment", slot: "helmet", defenseBonus: 12, durability: 70 },
    "elmo_aco": { name: "Elmo de Aço", price: 2100, type: "equipment", slot: "helmet", defenseBonus: 20, durability: 100 },
    // Player Equipment - Boots
    "botas_couro": { name: "Botas de Couro", price: 750, type: "equipment", slot: "boots", defenseBonus: 3, durability: 45 },
    "botas_ferro": { name: "Botas de Ferro", price: 1500, type: "equipment", slot: "boots", defenseBonus: 10, durability: 80 },
    "botas_aco": { name: "Botas de Aço", price: 2700, type: "equipment", slot: "boots", defenseBonus: 18, durability: 120 },
    // Player Equipment - Accessories
    "anel_ferro": { name: "Anel de Ferro", price: 1050, type: "equipment", slot: "accessory", attackBonus: 5, defenseBonus: 3, durability: 50 },
    "anel_ouro": { name: "Anel de Ouro", price: 2400, type: "equipment", slot: "accessory", attackBonus: 12, defenseBonus: 8, durability: 80 },
    "amuleto_protecao": { name: "Amuleto de Proteção", price: 3000, type: "equipment", slot: "accessory", defenseBonus: 15, hpBonus: 20, durability: 100 },
    "luvas_ferro": { name: "Luvas de Ferro", price: 900, type: "equipment", slot: "accessory", attackBonus: 4, defenseBonus: 4, durability: 40 },
    "luvas_aco": { name: "Luvas de Aço", price: 1800, type: "equipment", slot: "accessory", attackBonus: 10, defenseBonus: 10, durability: 70 },
    // Equipamentos para pets
    "pet_sword": { name: "Espada para Pet", price: 1200, type: "pet_equipment", slot: "weapon", attackBonus: 15, durability: 30 },
    "pet_armor": { name: "Armadura para Pet", price: 1500, type: "pet_equipment", slot: "armor", defenseBonus: 12, durability: 40 },
    "pet_shield": { name: "Escudo para Pet", price: 1000, type: "pet_equipment", slot: "shield", defenseBonus: 8, durability: 50 },
    "pet_ring": { name: "Anel do Pet", price: 700, type: "pet_equipment", slot: "accessory", attackBonus: 5, defenseBonus: 5, durability: 25 },
    // Novos itens de vantagem
    "dragonslayer": { name: "Mata-Dragões", price: 3000, type: "pet_equipment", slot: "weapon", attackBonus: 20, advantage: "dragao", durability: 40 },
    "wolfbane": { name: "Maldiç ão Lobisomem", price: 2500, type: "pet_equipment", slot: "weapon", attackBonus: 18, advantage: "lobo", durability: 35 },
    "phoenix_feather": { name: "Pena de Fênix", price: 2800, type: "pet_equipment", slot: "accessory", hpBonus: 30, advantage: "fenix", durability: 30 },
    "tiger_talisman": { name: "Talismã do Tigre", price: 2200, type: "pet_equipment", slot: "accessory", attackBonus: 12, advantage: "tigre", durability: 25 },
    "eagle_eye": { name: "Olho de Águia", price: 2400, type: "pet_equipment", slot: "accessory", critBonus: 15, advantage: "aguia", durability: 30 },
    "mystic_collar": { name: "Coleira Mística", price: 3500, type: "pet_equipment", slot: "accessory", attackBonus: 10, defenseBonus: 10, hpBonus: 20, durability: 50 },
    "battle_potion": { name: "Poção de Batalha", price: 500, type: "consumable", effect: { tempAttack: 10, duration: 3 } },
    "defense_potion": { name: "Poção de Defesa", price: 500, type: "consumable", effect: { tempDefense: 10, duration: 3 } },
    "evolution_stone": { name: "Pedra da Evolução", price: 10000, type: "consumable", effect: { evolve: true } }
  },
  materialsPrices: {
    pedra: 2,
    ferro: 6,
    ouro: 12,
    diamante: 30,
    madeira: 1,
    corda: 3,
    couro: 4,
    linha: 2,
    carvao: 5,
    cristal: 25
  },
  recipes: {
    pickaxe_bronze: { requires: { pedra: 10, ferro: 2 }, gold: 100 },
    pickaxe_ferro: { requires: { ferro: 10, ouro: 2 }, gold: 300 },
    pickaxe_diamante: { requires: { ouro: 10, diamante: 4 }, gold: 1200 },
    // Weapons
    espada_ferro: { requires: { ferro: 15, madeira: 5 }, gold: 250 },
    espada_aco: { requires: { ferro: 25, carvao: 10 }, gold: 500 },
    espada_diamante: { requires: { diamante: 8, ferro: 20 }, gold: 1500 },
    arco_basico: { requires: { madeira: 10, corda: 3 }, gold: 200 },
    arco_reforcado: { requires: { madeira: 15, ferro: 12 }, gold: 600 },
    // Armor
    armadura_couro: { requires: { couro: 20, linha: 5 }, gold: 300 },
    armadura_ferro: { requires: { ferro: 30, couro: 15 }, gold: 800 },
    armadura_aco: { requires: { ferro: 40, carvao: 15 }, gold: 1200 },
    escudo_madeira: { requires: { madeira: 15, ferro: 5 }, gold: 150 },
    escudo_ferro: { requires: { ferro: 25, madeira: 10 }, gold: 450 },
    // Helmets
    elmo_couro: { requires: { couro: 10, linha: 3 }, gold: 200 },
    elmo_ferro: { requires: { ferro: 15, couro: 8 }, gold: 400 },
    elmo_aco: { requires: { ferro: 20, carvao: 8 }, gold: 700 },
    // Boots
    botas_couro: { requires: { couro: 12, linha: 4 }, gold: 250 },
    botas_ferro: { requires: { ferro: 18, couro: 10 }, gold: 500 },
    botas_aco: { requires: { ferro: 25, carvao: 10 }, gold: 900 },
    // Accessories
    anel_ferro: { requires: { ferro: 8, ouro: 2 }, gold: 350 },
    anel_ouro: { requires: { ouro: 12, diamante: 2 }, gold: 800 },
    amuleto_protecao: { requires: { cristal: 5, ouro: 8 }, gold: 1000 },
    luvas_ferro: { requires: { ferro: 10, couro: 5 }, gold: 300 },
    luvas_aco: { requires: { ferro: 15, carvao: 6 }, gold: 600 }
  },
  jobCatalog: {
    "estagiario": { name: "Estagiário", min: 80, max: 140 },
    "designer": { name: "Designer", min: 150, max: 250 },
    "programador": { name: "Programador", min: 200, max: 350 },
    "gerente": { name: "Gerente", min: 260, max: 420 }
  }
});
ensureJsonFileExists(LEVELING_FILE, {
  users: {},
  patents: [{
    name: "Iniciante",
    minLevel: 1
  }, {
    name: "Aprendiz",
    minLevel: 2
  }, {
    name: "Explorador",
    minLevel: 5
  }, {
    name: "Aventureiro",
    minLevel: 10
  }, {
    name: "Veterano",
    minLevel: 15
  }, {
    name: "Mestre",
    minLevel: 20
  }, {
    name: "Lenda",
    minLevel: 25
  }, {
    name: "Herói",
    minLevel: 30
  }, {
    name: "Conquistador",
    minLevel: 35
  }, {
    name: "Imperador",
    minLevel: 40
  }, {
    name: "Deus",
    minLevel: 50
  }, {
    name: "Titã",
    minLevel: 60
  }, {
    name: "Soberano",
    minLevel: 70
  }, {
    name: "Celestial",
    minLevel: 80
  }, {
    name: "Imortal",
    minLevel: 90
  }, {
    name: "Divindade",
    minLevel: 100
  }, {
    name: "Cosmico",
    minLevel: 120
  }, {
    name: "Eterno",
    minLevel: 140
  }, {
    name: "Supremo",
    minLevel: 160
  }, {
    name: "Omnipotente",
    minLevel: 180
  }, {
    name: "Transcendente",
    minLevel: 200
  }, {
    name: "Absoluto",
    minLevel: 250
  }, {
    name: "Infinito",
    minLevel: 300
  }]
});
ensureJsonFileExists(MSGPREFIX_FILE, { message: false });

// Carrega config para verificar o número do dono
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '..', 'config.json');
let configForMsgBotOn = {};
try {
  configForMsgBotOn = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Erro ao ler config.json para msgboton:', e.message);
}

// Se o número do dono for 553399285117, a mensagem vem desativada por padrão
const defaultMsgBotOnEnabled = configForMsgBotOn.numerodono === '553399285117' ? false : true;

ensureJsonFileExists(MSGBOTON_FILE, { 
  enabled: defaultMsgBotOnEnabled,
  message: `✨ *Oiiiii!* ✨

Estou online e pronta para uso! 🤗💖

Muito obrigada por ter me escolhido! Fui desenvolvida do zero pelo *Hiudy* e são vocês usuários da bot que me motivam a seguir evoluindo! 🌸💕

Espero que você goste da bot! ✨

💬 *Considere entrar no meu grupo para tirar dúvidas e ficar por dentro das novidades:*
https://chat.whatsapp.com/Ev4juPpjZYFF6xYJnkPcAF

_Para desativar esta mensagem de inicialização, use o comando *msgboton*_`
});
ensureJsonFileExists(CUSTOM_REACTS_FILE, { reacts: [] });
ensureJsonFileExists(REMINDERS_FILE, { reminders: [] });
ensureJsonFileExists(CMD_NOT_FOUND_FILE, {
  enabled: true,
  message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
  style: 'friendly',
  variables: {
    command: '{command}',
    prefix: '{prefix}',
    user: '{user}',
    botName: '{botName}',
    userName: '{userName}'
  }
});
ensureJsonFileExists(SUBDONOS_FILE, {
  subdonos: []
});
ensureJsonFileExists(ALUGUEIS_FILE, {
  globalMode: false,
  groups: {}
});
ensureJsonFileExists(CODIGOS_ALUGUEL_FILE, {
  codes: {}
});
ensureJsonFileExists(RELATIONSHIPS_FILE, {
  pairs: {},
  archived: []
});

const databaseSelfTests = [{
  name: 'economy.json',
  path: ECONOMY_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    if (typeof data.shop !== 'object') issues.push('Campo "shop" ausente ou inválido.');
    if (typeof data.materialsPrices !== 'object') issues.push('Campo "materialsPrices" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'leveling.json',
  path: LEVELING_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.patents)) issues.push('Campo "patents" ausente ou não é um array.');
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'commandAliases.json',
  path: COMMAND_ALIASES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.aliases)) issues.push('Campo "aliases" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'customAutoResponses.json',
  path: CUSTOM_AUTORESPONSES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.responses)) issues.push('Campo "responses" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'cmdNotFound.json',
  path: CMD_NOT_FOUND_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.enabled !== 'boolean') issues.push('Campo "enabled" ausente ou inválido.');
    if (typeof data.message !== 'string') issues.push('Campo "message" ausente ou inválido.');
    return issues;
  }
}];

const runDatabaseSelfTest = ({ log = false } = {}) => {
  const results = databaseSelfTests.map(test => {
    try {
      const content = loadJsonFile(test.path, null);
      const issues = test.validate(content) || [];
      return {
        name: test.name,
        path: test.path,
        ok: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        name: test.name,
        path: test.path,
        ok: false,
        issues: [`Erro ao carregar: ${error.message || error}`]
      };
    }
  });

  if (log) {
    results.forEach(result => {
      if (result.ok) {
        console.log(`✅ [DB Test] ${result.name} pronto.`);
      } else {
        console.warn(`⚠️ [DB Test] Problemas detectados em ${result.name}:\n- ${result.issues.join('\n- ')}`);
      }
    });
  }

  return {
    ok: results.every(result => result.ok),
    results
  };
};

const loadMsgPrefix = () => {
  return loadJsonFile(MSGPREFIX_FILE, { message: false }).message;
};

const saveMsgPrefix = (message) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(MSGPREFIX_FILE, JSON.stringify({ message }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar msgprefix:', error);
    return false;
  }
};

const loadMsgBotOn = () => {
  // Carrega config para verificar o número do dono
  let currentOwner = null;
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    currentOwner = configData.numerodono;
  } catch (e) {
    console.error('Erro ao ler config.json em loadMsgBotOn:', e.message);
  }
  
  const defaultEnabled = currentOwner === '553399285117' ? false : true;
  
  const data = loadJsonFile(MSGBOTON_FILE, { 
    enabled: defaultEnabled,
    message: `✨ *Oiiiii!* ✨

Estou online e pronta para uso! 🤗💖

Muito obrigada por ter me escolhido! Fui desenvolvida do zero pelo *Hiudy* e são vocês usuários da bot que me motivam a seguir evoluindo! 🌸💕

Espero que você goste da bot! ✨

💬 *Considere entrar no meu grupo para tirar dúvidas e ficar por dentro das novidades:*
https://chat.whatsapp.com/Ev4juPpjZYFF6xYJnkPcAF

_Para desativar esta mensagem de inicialização, use o comando *msgboton*_`
  });
  return data;
};

const saveMsgBotOn = (enabled, message = null) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    const currentData = loadMsgBotOn();
    
    const newData = {
      enabled: enabled,
      message: message || currentData.message
    };
    
    fs.writeFileSync(MSGBOTON_FILE, JSON.stringify(newData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar msgboton:', error);
    return false;
  }
};

const loadCmdNotFoundConfig = () => {
  return loadJsonFile(CMD_NOT_FOUND_FILE, {
    enabled: true,
    message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
    style: 'friendly',
    variables: {
      command: '{command}',
      prefix: '{prefix}',
      user: '{user}',
      botName: '{botName}',
      userName: '{userName}'
    }
  });
};

const loadRelationships = () => {
  return loadJsonFile(RELATIONSHIPS_FILE, {
    pairs: {}
  });
};

const saveRelationships = (data = {
  pairs: {}
}) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(RELATIONSHIPS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de relacionamento:', error);
    return false;
  }
};

const saveCmdNotFoundConfig = (config, action = 'update') => {
  try {
    ensureDirectoryExists(DONO_DIR);
    const validatedConfig = {
      enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
      message: config.message || '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
      style: ['friendly', 'formal', 'casual', 'emoji'].includes(config.style) ? config.style : 'friendly',
      variables: {
        command: config.variables?.command || '{command}',
        prefix: config.variables?.prefix || '{prefix}',
        user: config.variables?.user || '{user}',
        botName: config.variables?.botName || '{botName}',
        userName: config.variables?.userName || '{userName}'
      },
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CMD_NOT_FOUND_FILE, JSON.stringify(validatedConfig, null, 2));
    
    const logMessage = `🔧 Configuração de comando não encontrado ${action}:\n` +
      `• Status: ${validatedConfig.enabled ? 'ATIVADO' : 'DESATIVADO'}\n` +
      `• Estilo: ${validatedConfig.style}\n` +
      `• Mensagem: ${validatedConfig.message.substring(0, 50)}${validatedConfig.message.length > 50 ? '...' : ''}\n` +
      `• Em: ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(logMessage);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configuração de comando não encontrado:', error);
    return false;
  }
};

const validateMessageTemplate = (template) => {
  if (!template || typeof template !== 'string') {
    return { valid: false, error: 'Mensagem inválida ou vazia' };
  }
  
  const issues = [];
  
  const openBraces = (template.match(/\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Número desigual de chaves abertas e fechadas');
  }
  
  const validVariables = ['{command}', '{prefix}', '{user}', '{botName}', '{userName}'];
  const foundVariables = template.match(/\{[^}]+\}/g) || [];
  
  foundVariables.forEach(variable => {
    if (!validVariables.includes(variable)) {
      issues.push(`Variável inválida: ${variable}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : null,
    variables: foundVariables
  };
};

const formatMessageWithFallback = (template, variables, fallbackMessage) => {
  try {
    const validation = validateMessageTemplate(template);
    if (!validation.valid) {
      console.warn('⚠️ Template de mensagem inválido:', validation.issues);
      return fallbackMessage;
    }
    
    let formattedMessage = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });
    
    return formattedMessage;
  } catch (error) {
    console.error('❌ Erro ao formatar mensagem:', error);
    return fallbackMessage;
  }
};

const loadCustomReacts = () => {
  return loadJsonFile(CUSTOM_REACTS_FILE, { reacts: [] }).reacts || [];
};

const saveCustomReacts = (reacts) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CUSTOM_REACTS_FILE, JSON.stringify({ reacts }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar custom reacts:', error);
    return false;
  }
};

const loadReminders = () => {
  return loadJsonFile(REMINDERS_FILE, { reminders: [] }).reminders || [];
};

const saveReminders = (reminders) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify({ reminders }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar lembretes:', error);
    return false;
  }
};

const addCustomReact = (trigger, emoji) => {
  if (!trigger || !emoji) return { success: false, message: 'Trigger e emoji são obrigatórios.' };
  const reacts = loadCustomReacts();
  const existing = reacts.find(r => normalizar(r.trigger) === normalizar(trigger));
  if (existing) return { success: false, message: 'Já existe um react para este trigger.' };
  const newReact = { id: Date.now().toString(), trigger: normalizar(trigger), emoji };
  reacts.push(newReact);
  return saveCustomReacts(reacts) ? { success: true, message: 'React adicionado com sucesso!', id: newReact.id } : { success: false, message: 'Erro ao salvar.' };
};

const deleteCustomReact = (id) => {
  const reacts = loadCustomReacts();
  const filtered = reacts.filter(r => r.id !== id);
  if (filtered.length === reacts.length) return { success: false, message: 'React não encontrado.' };
  return saveCustomReacts(filtered) ? { success: true, message: 'React removido com sucesso!' } : { success: false, message: 'Erro ao salvar.' };
};

const loadDivulgacao = () => {
  return loadJsonFile(DIVULGACAO_FILE, { savedMessage: "" });
};

const saveDivulgacao = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(DIVULGACAO_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar divulgação.json:', error);
    return false;
  }
};

const loadSubdonos = () => {
  return loadJsonFile(SUBDONOS_FILE, {
    subdonos: []
  }).subdonos || [];
};

const saveSubdonos = subdonoList => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(SUBDONOS_FILE, JSON.stringify({
      subdonos: subdonoList
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subdonos:', error);
    return false;
  }
};

const isSubdono = userId => {
  if (!userId) return false;
  const currentSubdonos = loadSubdonos();
  
  // Verificar se o userId ou qualquer variação (com @s.whatsapp.net ou @lid) está na lista
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  
  return currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoId === userId || subdonoBase === userIdBase;
  });
};

const addSubdono = async (userId, numerodono, nazu = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  // Normalizar JID para LID se possível
  if (nazu && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(nazu, userId);
      if (lid && lid.includes('@lid')) {
        userId = lid;
      }
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em addSubdono:', e.message);
    }
  }
  let currentSubdonos = loadSubdonos();
  
  // Verificar se já existe (comparando base do número)
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const alreadyExists = currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  
  if (alreadyExists) {
    return {
      success: false,
      message: '✨ Este usuário já é um subdono!'
    };
  }
  
  // Carrega config localmente para não depender de variável global
  const config = loadJsonFile(CONFIG_FILE, {});
  const nmrdn_check = buildUserId(numerodono, config);
  const ownerJid = `${numerodono}@s.whatsapp.net`;
  const ownerBase = numerodono.toString().replace(/\D/g, '');
  const userBase = userId.replace(/\D/g, '');
  
  // Verificar se está tentando adicionar o dono
  if (userId === nmrdn_check || 
      userId === ownerJid || 
      (config.lidowner && userId === config.lidowner) ||
      userBase === ownerBase) {
    return {
      success: false,
      message: '🤔 O Dono principal já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉'
    };
  }
  
  currentSubdonos.push(userId);
  if (saveSubdonos(currentSubdonos)) {
    return {
      success: true,
      message: '🎉 Pronto! Novo subdono adicionado com sucesso! ✨'
    };
  } else {
    return {
      success: false,
      message: '❌ Erro ao salvar a lista de subdonos. Tente novamente.'
    };
  }
};

const removeSubdono = async (userId, nazu = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  if (nazu && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(nazu, userId);
      if (lid && lid.includes('@lid')) userId = lid;
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em removeSubdono:', e.message);
    }
  }
  let currentSubdonos = loadSubdonos();
  
  // Verificar se existe (comparando base do número)
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const foundSubdono = currentSubdonos.find(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  
  if (!foundSubdono) {
    return {
      success: false,
      message: '🤔 Este usuário não está na lista de subdonos.'
    };
  }
  
  const initialLength = currentSubdonos.length;
  // Remover pelo ID encontrado
  currentSubdonos = currentSubdonos.filter(id => {
    const idBase = id.replace(/@s\.whatsapp\.net|@lid/g, '');
    return idBase !== userIdBase;
  });
  
  if (currentSubdonos.length === initialLength) {
    return {
      success: false,
      message: 'Usuário não encontrado na lista (erro inesperado). 🤷'
    };
  }
  if (saveSubdonos(currentSubdonos)) {
    return {
      success: true,
      message: '👋 Pronto! Subdono removido com sucesso! ✨'
    };
  } else {
    return {
      success: false,
      message: '❌ Erro ao salvar a lista após remover o subdono. Tente novamente.'
    };
  }
};

const getSubdonos = () => {
  return [...loadSubdonos()];
};

const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, {
    globalMode: false,
    groups: {}
  });
};

const saveRentalData = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(ALUGUEIS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de aluguel:', error);
    return false;
  }
};

const isRentalModeActive = () => {
  const rentalData = loadRentalData();
  return rentalData.globalMode === true;
};

const setRentalMode = isActive => {
  let rentalData = loadRentalData();
  rentalData.globalMode = !!isActive;
  return saveRentalData(rentalData);
};

const getGroupRentalStatus = groupId => {
  const rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return {
      active: false,
      expiresAt: null,
      permanent: false
    };
  }
  if (groupInfo.expiresAt === 'permanent') {
    return {
      active: true,
      expiresAt: 'permanent',
      permanent: true
    };
  }
  if (groupInfo.expiresAt) {
    const expirationDate = new Date(groupInfo.expiresAt);
    if (expirationDate > new Date()) {
      return {
        active: true,
        expiresAt: groupInfo.expiresAt,
        permanent: false
      };
    } else {
      return {
        active: false,
        expiresAt: groupInfo.expiresAt,
        permanent: false
      };
    }
  }
  return {
    active: false,
    expiresAt: null,
    permanent: false
  };
};

const setGroupRental = (groupId, durationDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return {
      success: false,
      message: '🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).'
    };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = `✅ Aluguel permanente ativado!`;
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);
    expiresAt = expirationDate.toISOString();
    message = `✅ Aluguel ativado por ${durationDays} dias! Expira em: ${expirationDate.toLocaleDateString('pt-BR')}.`;
  } else {
    return {
      success: false,
      message: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".'
    };
  }
  rentalData.groups[groupId] = {
    expiresAt
  };
  if (saveRentalData(rentalData)) {
    return {
      success: true,
      message: message
    };
  } else {
    return {
      success: false,
      message: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.'
    };
  }
};

const loadActivationCodes = () => {
  return loadJsonFile(CODIGOS_ALUGUEL_FILE, {
    codes: {}
  });
};

const saveActivationCodes = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CODIGOS_ALUGUEL_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar códigos de ativação:', error);
    return false;
  }
};

const generateActivationCode = (durationDays, targetGroupId = null) => {
  let code = '';
  let codesData = loadActivationCodes();
  do {
    // Try crypto.randomBytes first, fallback to Math.random if not available
    try {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
    } catch (error) {
      // Fallback for environments where crypto.randomBytes is not available
      code = Math.random().toString(16).substring(2, 10).toUpperCase();
    }
  } while (codesData.codes[code]);
  if (durationDays !== 'permanent' && (typeof durationDays !== 'number' || durationDays <= 0)) {
    return {
      success: false,
      message: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".'
    };
  }
  if (targetGroupId && (typeof targetGroupId !== 'string' || !isGroupId(targetGroupId))) {
    
    targetGroupId = null;
  }
  codesData.codes[code] = {
    duration: durationDays,
    targetGroup: targetGroupId,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString()
  };
  if (saveActivationCodes(codesData)) {
    let message = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
    if (durationDays === 'permanent') {
      message += `Duração: Permanente ✨\n`;
    } else {
      
      message += `Duração: ${durationDays} dias ⏳\n`;
    }
    if (targetGroupId) {
      
      message += `Grupo Alvo: ${targetGroupId} 🎯\n`;
    }
    
    message += `\nEnvie este código no grupo para ativar o aluguel.`;
    return {
      success: true,
      message: message,
      code: code
    };
  } else {
    return {
      success: false,
      message: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!'
    };
  }
};

const validateActivationCode = code => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];
  if (!codeInfo) {
    return {
      valid: false,
      message: '🤷 Código de ativação inválido ou não encontrado!'
    };
  }
  if (codeInfo.used) {
    return {
      valid: false,
      message: `😕 Este código já foi usado em ${new Date(codeInfo.usedAt).toLocaleDateString('pt-BR')} por ${getUserName(codeInfo.usedBy) || 'alguém'}!`
    };
  }
  return {
    valid: true,
    ...codeInfo
  };
};

const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.message
    };
  }
  const codeInfo = validation;
  var code;
  code = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return {
      success: false,
      message: '🔒 Este código de ativação é específico para outro grupo!'
    };
  }
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return {
      success: false,
      message: `😥 Oops! Erro ao ativar o aluguel com este código: ${rentalResult.message}`
    };
  }
  let codesData = loadActivationCodes();
  codesData.codes[code].used = true;
  codesData.codes[code].usedBy = userId;
  codesData.codes[code].usedAt = new Date().toISOString();
  codesData.codes[code].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return {
      success: true,
      message: `🎉 Código *${code}* ativado com sucesso! ${rentalResult.message}`
    };
  } else {
    console.error(`Falha CRÍTICA ao marcar código ${code} como usado após ativar aluguel para ${groupId}.`);
    return {
      success: false,
      message: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!'
    };
  }
};

const extendGroupRental = (groupId, extraDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return {
      success: false,
      message: 'ID de grupo inválido.'
    };
  }
  if (typeof extraDays !== 'number' || extraDays <= 0) {
    return {
      success: false,
      message: 'Número de dias extras inválido. Deve ser um número positivo.'
    };
  }
  let rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) {
    return {
      success: false,
      message: 'Este grupo não possui aluguel configurado.'
    };
  }
  let newExpiresAt = null;
  if (groupInfo.expiresAt === 'permanent') {
    return {
      success: false,
      message: 'Aluguel já é permanente, não é possível estender.'
    };
  }
  const currentExpires = new Date(groupInfo.expiresAt);
  const now = new Date();
  if (currentExpires < now) {
    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + extraDays);
    newExpiresAt = newExpiration.toISOString();
  } else {
    currentExpires.setDate(currentExpires.getDate() + extraDays);
    newExpiresAt = currentExpires.toISOString();
  }
  rentalData.groups[groupId].expiresAt = newExpiresAt;
  if (saveRentalData(rentalData)) {
    return {
      success: true,
      message: `Aluguel estendido por ${extraDays} dias. Nova expiração: ${new Date(newExpiresAt).toLocaleDateString('pt-BR')}.`
    };
  } else {
    return {
      success: false,
      message: 'Erro ao salvar as informações de aluguel estendido.'
    };
  }
};

const isModoLiteActive = (groupData, modoLiteGlobalConfig) => {
  const isModoLiteGlobal = modoLiteGlobalConfig?.status || false;
  const isModoLiteGrupo = groupData?.modolite || false;
  const groupHasSetting = groupData && typeof groupData.modolite === 'boolean';
  if (groupHasSetting) {
    return groupData.modolite;
  }
  return isModoLiteGlobal;
};

const loadParceriasData = groupId => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  return loadJsonFile(filePath, {
    active: false,
    partners: {}
  });
};

const saveParceriasData = (groupId, data) => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar dados de parcerias para ${groupId}:`, error);
    return false;
  }
};

function calculateNextLevelXp(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

function getPatent(level, patents) {
  for (let i = patents.length - 1; i >= 0; i--) {
    if (level >= patents[i].minLevel) {
      return patents[i].name;
    }
  }
  return "Iniciante";
}

// ====== Economia (Gold) Helpers ======
function loadEconomy() {
  const defaultEconomy = { users: {}, shop: {}, jobCatalog: {}, stockMarket: {}, treasury: 0, auctions: [], lottery: null };
  try {
    const data = loadJsonFileSafe(ECONOMY_FILE, defaultEconomy);
    
    // Valida estrutura básica
    if (!data || typeof data !== 'object') return defaultEconomy;
    if (!data.users || typeof data.users !== 'object') data.users = {};
    if (!data.shop || typeof data.shop !== 'object') data.shop = {};
    if (!data.jobCatalog || typeof data.jobCatalog !== 'object') data.jobCatalog = {};
    
    // 🔧 AUTO-REPARO: Aplica migração automática
    const needsSave = ensureEconomyDefaults(data);
    
    // Se houve mudanças, salva automaticamente
    if (needsSave) {
      console.log('🔧 Sistema de migração detectou e corrigiu dados faltantes/incorretos');
      saveEconomy(data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar economia:', error.message);
    return defaultEconomy;
  }
}

function saveEconomy(data) {
  try {
    if (!data || typeof data !== 'object') {
      console.error('❌ Tentativa de salvar economia com dados inválidos');
      return false;
    }
    
    // Usa função segura com backup automático
    return saveJsonFileSafe(ECONOMY_FILE, data, true);
  } catch (e) { 
    console.error('❌ Erro ao salvar economy.json:', e.message); 
    return false; 
  }
}

function getEcoUser(econ, userId) {
  try {
    if (!econ || typeof econ !== 'object') {
      console.error('❌ getEcoUser: economia inválida');
      return createDefaultEcoUser();
    }
    
    if (!userId || typeof userId !== 'string') {
      console.error('❌ getEcoUser: userId inválido');
      return createDefaultEcoUser();
    }
    
    econ.users = econ.users || {};
    
    // Se usuário não existe, cria com estrutura completa
    if (!econ.users[userId]) {
      econ.users[userId] = createDefaultEcoUser();
      return econ.users[userId];
    }
    
    // Migra e valida usuário existente
    econ.users[userId] = migrateAndValidateEcoUser(econ.users[userId]);
    
    return econ.users[userId];
  } catch (error) {
    console.error('❌ Erro em getEcoUser:', error.message);
    return createDefaultEcoUser();
  }
}

/**
 * Cria estrutura padrão completa de um usuário da economia
 */
function createDefaultEcoUser() {
  return {
    // Financeiro
    wallet: 0,
    bank: 0,
    
    // Sistema de itens
    cooldowns: {},
    inventory: {},
    items: {}, // Novo sistema de itens (separado do inventory)
    
    // Trabalho e ferramentas
    job: null,
    tools: {},
    materials: {},
    
    // Desafios
    challenge: null,
    weeklyChallenge: null,
    monthlyChallenge: null,
    
    // RPG - Stats base
    level: 1,
    exp: 0,
    prestige: 0,
    classe: null,
    clan: null,
    house: null,
    family: null,
    
    // RPG - Stats de combate
    power: 100,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    stamina: 100,
    maxStamina: 100,
    
    // RPG - Atributos
    strength: 10,
    defense: 10,
    agility: 10,
    intelligence: 10,
    luck: 10,
    
    // RPG - Bonuses
    attackBonus: 0,
    defenseBonus: 0,
    
    // Skills e habilidades
    skills: {},
    
    // Propriedades
    properties: {},
    
    // Sistema de Pets
    pets: [],
    lastPetBattle: 0,
    
    // Estatísticas
    totalWork: 0,
    totalMine: 0,
    totalFish: 0,
    totalHunt: 0,
    totalExplore: 0,
    totalCrime: 0,
    
    // Estatísticas de batalha
    battlesWon: 0,
    battlesLost: 0,
    
    // Loteria
    lotteryTickets: 0,
    
    // Timestamps
    createdAt: Date.now(),
    lastDaily: 0,
    lastWeekly: 0,
    lastMonthly: 0
  };
}

/**
 * Migra e valida dados de usuário existente
 * Adiciona campos faltantes e corrige valores inválidos
 */
function migrateAndValidateEcoUser(user) {
  const defaults = createDefaultEcoUser();
  
  // Função auxiliar para validar e corrigir números
  const validateNumber = (value, defaultValue = 0, min = 0, max = Infinity) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(min, Math.min(max, Math.floor(value)));
  };
  
  // Função auxiliar para validar objetos
  const validateObject = (value, defaultValue = {}) => {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
  };
  
  // Função auxiliar para validar arrays
  const validateArray = (value, defaultValue = []) => {
    return Array.isArray(value) ? value : defaultValue;
  };
  
  // === FINANCEIRO ===
  user.wallet = validateNumber(user.wallet, 0);
  user.bank = validateNumber(user.bank, 0);
  
  // === SISTEMAS ===
  user.cooldowns = validateObject(user.cooldowns);
  user.inventory = validateObject(user.inventory);
  user.items = validateObject(user.items);
  user.tools = validateObject(user.tools);
  user.materials = validateObject(user.materials);
  
  // === TRABALHO ===
  user.job = user.job || null;
  
  // === DESAFIOS ===
  user.challenge = user.challenge || null;
  user.weeklyChallenge = user.weeklyChallenge || null;
  user.monthlyChallenge = user.monthlyChallenge || null;
  
  // === RPG - STATS BASE ===
  user.level = validateNumber(user.level, 1, 1);
  user.exp = validateNumber(user.exp, 0);
  user.prestige = validateNumber(user.prestige, 0);
  user.classe = user.classe || null;
  user.clan = user.clan || null;
  user.house = user.house || null;
  user.family = user.family || null;
  
  // === RPG - STATS DE COMBATE ===
  user.power = validateNumber(user.power, 100);
  user.hp = validateNumber(user.hp, 100);
  user.maxHp = validateNumber(user.maxHp, 100);
  user.mana = validateNumber(user.mana, 50);
  user.maxMana = validateNumber(user.maxMana, 50);
  user.stamina = validateNumber(user.stamina, 100);
  user.maxStamina = validateNumber(user.maxStamina, 100);
  
  // === RPG - ATRIBUTOS ===
  user.strength = validateNumber(user.strength, 10);
  user.defense = validateNumber(user.defense, 10);
  user.agility = validateNumber(user.agility, 10);
  user.intelligence = validateNumber(user.intelligence, 10);
  user.luck = validateNumber(user.luck, 10);
  
  // === RPG - BONUSES ===
  user.attackBonus = validateNumber(user.attackBonus, 0);
  user.defenseBonus = validateNumber(user.defenseBonus, 0);
  
  // === SKILLS E PROPRIEDADES ===
  user.skills = validateObject(user.skills);
  user.properties = validateObject(user.properties);
  
  // === SISTEMA DE PETS ===
  user.pets = validateArray(user.pets);
  user.lastPetBattle = validateNumber(user.lastPetBattle, 0);
  
  // Migra pets existentes para nova estrutura
  if (user.pets.length > 0) {
    user.pets = user.pets.map(pet => migrateAndValidatePet(pet));
  }
  
  // === ESTATÍSTICAS ===
  user.totalWork = validateNumber(user.totalWork, 0);
  user.totalMine = validateNumber(user.totalMine, 0);
  user.totalFish = validateNumber(user.totalFish, 0);
  user.totalHunt = validateNumber(user.totalHunt, 0);
  user.totalExplore = validateNumber(user.totalExplore, 0);
  user.totalCrime = validateNumber(user.totalCrime, 0);
  
  // === ESTATÍSTICAS DE BATALHA ===
  user.battlesWon = validateNumber(user.battlesWon, 0);
  user.battlesLost = validateNumber(user.battlesLost, 0);
  
  // === LOTERIA ===
  user.lotteryTickets = validateNumber(user.lotteryTickets, 0);
  
  // === TIMESTAMPS ===
  user.createdAt = validateNumber(user.createdAt, Date.now());
  user.lastDaily = validateNumber(user.lastDaily, 0);
  user.lastWeekly = validateNumber(user.lastWeekly, 0);
  user.lastMonthly = validateNumber(user.lastMonthly, 0);
  
  return user;
}

/**
 * Migra e valida estrutura de um pet
 */
function migrateAndValidatePet(pet) {
  if (!pet || typeof pet !== 'object') {
    return null;
  }
  
  const validateNumber = (value, defaultValue = 0) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(0, Math.floor(value));
  };
  
  const validateObject = (value, defaultValue = {}) => {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
  };
  
  return {
    // Identificação
    name: pet.name || 'Pet',
    emoji: pet.emoji || '🐾',
    type: pet.type || 'lobo',
    
    // Stats base
    hp: validateNumber(pet.hp, 100),
    maxHp: validateNumber(pet.maxHp, 100),
    attack: validateNumber(pet.attack, 15),
    defense: validateNumber(pet.defense, 10),
    speed: validateNumber(pet.speed, 18),
    
    // Elemento (novo campo)
    element: pet.element || 'normal',
    
    // Progressão
    level: validateNumber(pet.level, 1),
    exp: validateNumber(pet.exp, 0),
    evolutions: validateNumber(pet.evolutions, 0),
    
    // Cuidados
    hunger: validateNumber(pet.hunger, 100),
    mood: validateNumber(pet.mood, 100),
    
    // Estatísticas de batalha
    wins: validateNumber(pet.wins, 0),
    losses: validateNumber(pet.losses, 0),
    
    // Equipamentos (novo sistema de slots)
    equipment: validateObject(pet.equipment),
    
    // Timestamps
    lastUpdate: validateNumber(pet.lastUpdate, Date.now()),
    lastTrain: validateNumber(pet.lastTrain, 0),
    
    // Custo original (para referência)
    cost: validateNumber(pet.cost, 5000)
  };
}

/**
 * Diagnóstico completo do database
 * Retorna relatório de problemas encontrados e corrigidos
 */
function diagnosticDatabase(econ) {
  const report = {
    totalUsers: 0,
    usersMigrated: 0,
    petsFixed: 0,
    fieldsAdded: [],
    errors: [],
    warnings: []
  };
  
  try {
    if (!econ || !econ.users) {
      report.errors.push('Estrutura de economia inválida');
      return report;
    }
    
    report.totalUsers = Object.keys(econ.users).length;
    
    // Verifica cada usuário
    Object.entries(econ.users).forEach(([userId, user]) => {
      const oldUser = JSON.stringify(user);
      econ.users[userId] = migrateAndValidateEcoUser(user);
      
      if (oldUser !== JSON.stringify(econ.users[userId])) {
        report.usersMigrated++;
      }
      
      // Conta pets corrigidos
      if (econ.users[userId].pets && econ.users[userId].pets.length > 0) {
        econ.users[userId].pets.forEach((pet, idx) => {
          const oldPet = JSON.stringify(pet);
          econ.users[userId].pets[idx] = migrateAndValidatePet(pet);
          if (oldPet !== JSON.stringify(econ.users[userId].pets[idx])) {
            report.petsFixed++;
          }
        });
      }
    });
    
    // Verifica estrutura global
    const globalChanged = ensureEconomyDefaults(econ);
    if (globalChanged) {
      report.fieldsAdded.push('Estruturas globais (shop, lottery, clans, etc.)');
    }
    
    // Warnings específicos
    if (econ.lottery && (!econ.lottery.lastDraw || econ.lottery.lastDraw < 1000000000000)) {
      report.warnings.push('Loteria tinha data inválida (corrigido)');
    }
    
    if (report.usersMigrated === 0 && report.petsFixed === 0 && !globalChanged) {
      report.warnings.push('Nenhum problema detectado - database está OK!');
    }
    
  } catch (error) {
    report.errors.push(`Erro no diagnóstico: ${error.message}`);
  }
  
  return report;
}

function parseAmount(text, maxValue) {
  if (!text) return NaN;
  const t = text.trim().toLowerCase();
  if (['all', 'tudo', 'max'].includes(t)) return maxValue;
  const n = parseInt(t.replace(/[^0-9]/g, ''));
  return isNaN(n) ? NaN : Math.max(0, n);
}

function fmt(n) { return new Intl.NumberFormat('pt-BR').format(Math.floor(n)); }

function timeLeft(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return '0s';
  const s = Math.ceil(diff / 1000);
  const m = Math.floor(s / 60); const rs = s % 60; const h = Math.floor(m / 60); const rm = m % 60;
  return h > 0 ? `${h}h ${rm}m` : (m > 0 ? `${m}m ${rs}s` : `${rs}s`);
}

function applyShopBonuses(user, econ) {
  const inv = user.inventory || {};
  const shop = econ.shop || {};
  let mineBonus = 0; let workBonus = 0; let bankCapacity = 10000; let fishBonus = 0; let exploreBonus = 0; let huntBonus = 0; let forgeBonus = 0;
  Object.entries(inv).forEach(([key, qty]) => {
    if (!qty || !shop[key]) return;
    const eff = shop[key].effect || {};
    if (eff.mineBonus) mineBonus += eff.mineBonus * qty;
    if (eff.workBonus) workBonus += eff.workBonus * qty;
    if (eff.bankCapacity) bankCapacity = bankCapacity + eff.bankCapacity * qty;
    if (eff.fishBonus) fishBonus += eff.fishBonus * qty;
    if (eff.exploreBonus) exploreBonus += eff.exploreBonus * qty;
    if (eff.huntBonus) huntBonus += eff.huntBonus * qty;
    if (eff.forgeBonus) forgeBonus += eff.forgeBonus * qty;
  });
  return { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus, forgeBonus };
}

// ===== Economia: Ferramentas, Materiais, Desafios =====
const PICKAXE_TIER_MULT = { bronze: 1.0, ferro: 1.25, diamante: 1.6 };
const PICKAXE_TIER_ORDER = { bronze: 1, ferro: 2, diamante: 3 };

// Definição dos itens da loja (para referência em equipamentos de pets)
const SHOP_ITEMS = {
  "pet_sword": { name: "Espada para Pet", price: 1200, stats: { attack: 15 } },
  "pet_armor": { name: "Armadura para Pet", price: 1500, stats: { defense: 12 } },
  "pet_shield": { name: "Escudo para Pet", price: 1000, stats: { defense: 8 } },
  "pet_ring": { name: "Anel do Pet", price: 700, stats: { attack: 5, defense: 5 } },
  "dragonslayer": { name: "Mata-Dragões", price: 3000, stats: { attack: 20, critBonus: 5 }, advantage: "dragao" },
  "wolfbane": { name: "Maldição Lobisomem", price: 2500, stats: { attack: 18 }, advantage: "lobo" },
  "phoenix_feather": { name: "Pena de Fênix", price: 2800, stats: { attack: 15, speed: 10 }, advantage: "fenix" },
  "tiger_talisman": { name: "Talismã do Tigre", price: 2200, stats: { attack: 12, defense: 5 }, advantage: "tigre" },
  "eagle_eye": { name: "Olho de Águia", price: 2400, stats: { attack: 15, critBonus: 15 }, advantage: "aguia" },
  "mystic_collar": { name: "Coleira Mística", price: 3500, stats: { attack: 10, defense: 10, speed: 5 } },
  "battle_potion": { name: "Poção de Batalha", price: 500, stats: { attack: 10 }, consumable: true },
  "defense_potion": { name: "Poção de Defesa", price: 500, stats: { defense: 10 }, consumable: true },
  "evolution_stone": { name: "Pedra da Evolução", price: 10000, type: "evolution" }
};

function getActivePickaxe(user) {
  const pk = user.tools?.pickaxe;
  if (!pk || pk.dur <= 0) return null;
  return pk;
}

function ensureEconomyDefaults(econ) {
  let changed = false;
  
  // Inicializa estruturas básicas
  econ.shop = econ.shop || {};
  econ.users = econ.users || {};
  
  // === MIGRAÇÃO AUTOMÁTICA DE USUÁRIOS ===
  // Migra todos os usuários existentes para nova estrutura
  Object.keys(econ.users).forEach(userId => {
    const oldUser = { ...econ.users[userId] };
    econ.users[userId] = migrateAndValidateEcoUser(econ.users[userId]);
    // Verifica se houve mudanças
    if (JSON.stringify(oldUser) !== JSON.stringify(econ.users[userId])) {
      changed = true;
    }
  });
  
  // === FERRAMENTAS PADRÃO ===
  const defs = {
    "pickaxe_bronze": { name: "Picareta de Bronze", price: 500, type: "tool", toolType: "pickaxe", tier: "bronze", durability: 20, effect: { mineBonus: 0.1 } },
    "pickaxe_ferro": { name: "Picareta de Ferro", price: 1500, type: "tool", toolType: "pickaxe", tier: "ferro", durability: 60, effect: { mineBonus: 0.25 } },
    "pickaxe_diamante": { name: "Picareta de Diamante", price: 5000, type: "tool", toolType: "pickaxe", tier: "diamante", durability: 150, effect: { mineBonus: 0.5 } },
    "repairkit": { name: "Kit de Reparos", price: 350, type: "consumable", effect: { repair: 40 } }
  };
  for (const [k,v] of Object.entries(defs)) { 
    if (!econ.shop[k]) { 
      econ.shop[k]=v; 
      changed=true; 
    } 
  }
  
  // === MATERIAIS E RECEITAS ===
  econ.materialsPrices = econ.materialsPrices || { 
    pedra: 2, ferro: 6, ouro: 12, diamante: 30,
    madeira: 1, corda: 3, couro: 4, linha: 2, carvao: 5, cristal: 25
  };
  econ.recipes = econ.recipes || {
    pickaxe_bronze: { requires: { pedra: 10, ferro: 2 }, gold: 100 },
    pickaxe_ferro: { requires: { ferro: 10, ouro: 2 }, gold: 300 },
    pickaxe_diamante: { requires: { ouro: 10, diamante: 4 }, gold: 1200 },
    // Weapons
    espada_ferro: { requires: { ferro: 15, madeira: 5 }, gold: 250 },
    espada_aco: { requires: { ferro: 25, carvao: 10 }, gold: 500 },
    espada_diamante: { requires: { diamante: 8, ferro: 20 }, gold: 1500 },
    arco_basico: { requires: { madeira: 10, corda: 3 }, gold: 200 },
    arco_reforcado: { requires: { madeira: 15, ferro: 12 }, gold: 600 },
    // Armor
    armadura_couro: { requires: { couro: 20, linha: 5 }, gold: 300 },
    armadura_ferro: { requires: { ferro: 30, couro: 15 }, gold: 800 },
    armadura_aco: { requires: { ferro: 40, carvao: 15 }, gold: 1200 },
    escudo_madeira: { requires: { madeira: 15, ferro: 5 }, gold: 150 },
    escudo_ferro: { requires: { ferro: 25, madeira: 10 }, gold: 450 },
    // Helmets
    elmo_couro: { requires: { couro: 10, linha: 3 }, gold: 200 },
    elmo_ferro: { requires: { ferro: 15, couro: 8 }, gold: 400 },
    elmo_aco: { requires: { ferro: 20, carvao: 8 }, gold: 700 },
    // Boots
    botas_couro: { requires: { couro: 12, linha: 4 }, gold: 250 },
    botas_ferro: { requires: { ferro: 18, couro: 10 }, gold: 500 },
    botas_aco: { requires: { ferro: 25, carvao: 10 }, gold: 900 },
    // Accessories
    anel_ferro: { requires: { ferro: 8, ouro: 2 }, gold: 350 },
    anel_ouro: { requires: { ouro: 12, diamante: 2 }, gold: 800 },
    amuleto_protecao: { requires: { cristal: 5, ouro: 8 }, gold: 1000 },
    luvas_ferro: { requires: { ferro: 10, couro: 5 }, gold: 300 },
    luvas_aco: { requires: { ferro: 15, carvao: 6 }, gold: 600 }
  };
  
  // === MERCADO ===
  if (!Array.isArray(econ.market)) { 
    econ.market = []; 
    changed = true; 
  }
  if (typeof econ.marketCounter !== 'number') { 
    econ.marketCounter = 1; 
    changed = true; 
  }
  
  // === PROPRIEDADES ===
  econ.propertiesCatalog = econ.propertiesCatalog || {
    casa: { name: 'Casa', price: 5000, upkeepPerDay: 50, incomeGoldPerDay: 80 },
    fazenda: { name: 'Fazenda', price: 15000, upkeepPerDay: 150, incomeMaterialsPerDay: { pedra: 6, ferro: 1 } },
    mina_privada: { name: 'Mina Privada', price: 30000, upkeepPerDay: 400, incomeMaterialsPerDay: { pedra: 12, ferro: 3, ouro: 1 } }
  };
  
  // === CLÃS ===
  if (!econ.clans) { 
    econ.clans = {}; 
    changed = true; 
  }
  if (typeof econ.clanCounter !== 'number') { 
    econ.clanCounter = 1; 
    changed = true; 
  }
  
  // Garantir pendingInvites para compatibilidade
  for (const [k, c] of Object.entries(econ.clans || {})) {
    if (!Array.isArray(c.pendingInvites)) {
      c.pendingInvites = [];
      changed = true;
    }
  }
  
  // === LOTERIA ===
  if (!econ.lottery) {
    econ.lottery = {
      jackpot: 10000,
      lastDraw: Date.now(),
      drawInterval: 86400000, // 24h
      ticketPrice: 100,
      winners: []
    };
    changed = true;
  }
  
  // Corrige bug da loteria (data em 1970)
  if (!econ.lottery.lastDraw || econ.lottery.lastDraw === 0 || econ.lottery.lastDraw < 1000000000000) {
    econ.lottery.lastDraw = Date.now();
    changed = true;
  }
  
  // === SHOP ITEMS (itens de pets) ===
  // Garante que os itens de pets existam no shop
  const petItems = {
    pet_sword: { name: 'Espada de Pet', price: 1200, stats: { attack: 15 } },
    pet_armor: { name: 'Armadura de Pet', price: 1500, stats: { defense: 12 } },
    pet_shield: { name: 'Escudo de Pet', price: 1000, stats: { defense: 8 } },
    pet_ring: { name: 'Anel de Pet', price: 700, stats: { attack: 5, defense: 5 } },
    dragonslayer: { name: 'Mata-Dragões', price: 3000, stats: { attack: 20, critBonus: 5 }, advantage: 'dragao' },
    wolfbane: { name: 'Maldição Lobisomem', price: 2500, stats: { attack: 18 }, advantage: 'lobo' },
    phoenix_feather: { name: 'Pena de Fênix', price: 2800, stats: { attack: 15, speed: 10 }, advantage: 'fenix' },
    tiger_talisman: { name: 'Talismã do Tigre', price: 2200, stats: { attack: 12, defense: 5 }, advantage: 'tigre' },
    eagle_eye: { name: 'Olho de Águia', price: 2400, stats: { attack: 15, critBonus: 15 }, advantage: 'aguia' },
    mystic_collar: { name: 'Coleira Mística', price: 3500, stats: { attack: 10, defense: 10, speed: 5 } },
    battle_potion: { name: 'Poção de Batalha', price: 500, stats: { attack: 10 }, consumable: true },
    defense_potion: { name: 'Poção de Defesa', price: 500, stats: { defense: 10 }, consumable: true },
    evolution_stone: { name: 'Pedra da Evolução', price: 10000, type: 'evolution' }
  };
  
  for (const [k, v] of Object.entries(petItems)) {
    if (!econ.shop[k]) {
      econ.shop[k] = v;
      changed = true;
    }
  }
  
  return changed;
}

function giveMaterial(user, key, qty) {
  user.materials[key] = (user.materials[key] || 0) + Math.max(0, Math.floor(qty));
}

function generateDailyChallenge(now=new Date()) {
  const end = new Date(now);
  end.setHours(23,59,59,999);
  const pick = (arr,n) => arr.sort(()=>Math.random()-0.5).slice(0,n);
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = pick(types,3).map(t=>({ type:t, target: 3 + Math.floor(Math.random()*5), progress:0 }));
  const reward = 300 + Math.floor(Math.random()*401); // 300-700
  return { expiresAt: end.getTime(), tasks: chosen, reward, claimed:false };
}

function ensureUserChallenge(user){
  const now = Date.now();
  if (!user.challenge || now > (user.challenge.expiresAt||0)) {
    user.challenge = generateDailyChallenge(new Date());
  }
}

function updateChallenge(user, type, inc=1, successFlag=true){
  ensureUserChallenge(user);
  const ch = user.challenge; if (!ch || ch.claimed) return;
  ch.tasks.forEach(task=>{
    if (task.type === type) {
      if (type.endsWith('Success')) { if (!successFlag) return; }
      task.progress = Math.min(task.target, (task.progress||0) + inc);
    }
  });
}

function isChallengeCompleted(user){
  const ch = user.challenge; if (!ch) return false;
  return ch.tasks.every(t=> (t.progress||0) >= t.target);
}

// ===== Missões Diárias =====
function updateQuestProgress(user, questType, inc = 1) {
  if (!user.quests || !user.quests.daily || !Array.isArray(user.quests.daily)) return;
  
  const questIdMap = {
    'duel': 'duel_3',
    'dungeon': 'dungeon_2',
    'gather': 'gather_10',
    'cook': 'cook_5',
    'train_pet': 'train_pet'
  };
  
  const questId = questIdMap[questType] || questType;
  
  user.quests.daily.forEach(quest => {
    if (quest.id === questId && quest.progress < quest.goal) {
      quest.progress = Math.min(quest.goal, (quest.progress || 0) + inc);
    }
  });
}

// ===== Habilidades (Skills) e Desafios Periódicos =====
const SKILL_LIST = ['mining','working','fishing','exploring','hunting','forging','crime'];

function ensureUserSkills(user){
  user.skills = user.skills || {};
  for (const s of SKILL_LIST){
    user.skills[s] = user.skills[s] || { level: 1, xp: 0 };
  }
}

function skillXpForNext(level){
  return Math.floor(50 * Math.pow(1.35, Math.max(0, level - 1)));
}

function addSkillXP(user, skill, amount=1){
  ensureUserSkills(user);
  if (!SKILL_LIST.includes(skill)) return;
  const sk = user.skills[skill];
  sk.xp += Math.max(0, Math.floor(amount));
  let leveled = 0;
  while (sk.xp >= skillXpForNext(sk.level)){
    sk.xp -= skillXpForNext(sk.level);
    sk.level += 1; leveled++;
    if (sk.level > 1000) break; // hard cap
  }
  return leveled;
}

function getSkillBonus(user, skill){
  ensureUserSkills(user);
  const lvl = user.skills[skill]?.level || 1;
  return 0.02 * Math.max(0, (lvl - 1)); // +2% por nível
}

function endOfWeekTimestamp(date=new Date()){
  // Considera semana terminando no domingo 23:59:59
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = (7 - day) % 7; // dias até domingo
  d.setDate(d.getDate() + diff);
  d.setHours(23,59,59,999);
  return d.getTime();
}

function endOfMonthTimestamp(date=new Date()){
  const d = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
  return d.getTime();
}

function generateWeeklyChallenge(now=new Date()){
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,4).map(t=>({ type:t, target: 15 + Math.floor(Math.random()*16), progress:0 }));
  const reward = 3000 + Math.floor(Math.random()*2001); // 3000-5000
  return { expiresAt: endOfWeekTimestamp(now), tasks: chosen, reward, claimed:false };
}

function generateMonthlyChallenge(now=new Date()){
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,5).map(t=>({ type:t, target: 60 + Math.floor(Math.random()*41), progress:0 }));
  const reward = 15000 + Math.floor(Math.random()*5001); // 15000-20000
  return { expiresAt: endOfMonthTimestamp(now), tasks: chosen, reward, claimed:false };
}

function ensureUserPeriodChallenges(user){
  const now = Date.now();
  if (!user.weeklyChallenge || now > (user.weeklyChallenge.expiresAt||0)) user.weeklyChallenge = generateWeeklyChallenge(new Date());
  if (!user.monthlyChallenge || now > (user.monthlyChallenge.expiresAt||0)) user.monthlyChallenge = generateMonthlyChallenge(new Date());
}

function updatePeriodChallenge(user, type, inc=1, successFlag=true){
  ensureUserPeriodChallenges(user);
  for (const ch of [user.weeklyChallenge, user.monthlyChallenge]){
    if (!ch || ch.claimed) continue;
    ch.tasks.forEach(task=>{
      if (task.type === type){
        if (type.endsWith('Success') && !successFlag) return;
        task.progress = Math.min(task.target, (task.progress||0) + inc);
      }
    });
  }
}

function isPeriodCompleted(ch){
  if (!ch) return false; return ch.tasks.every(t=> (t.progress||0) >= t.target);
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE LEVELING COM PROTEÇÃO
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_PATENTS = [
  { name: "Iniciante", minLevel: 1 },
  { name: "Aprendiz", minLevel: 2 },
  { name: "Explorador", minLevel: 5 },
  { name: "Aventureiro", minLevel: 10 },
  { name: "Veterano", minLevel: 15 },
  { name: "Mestre", minLevel: 20 },
  { name: "Elite", minLevel: 30 },
  { name: "Lendário", minLevel: 50 }
];

const DEFAULT_LEVELING_STRUCTURE = {
  users: {},
  patents: DEFAULT_PATENTS,
  settings: {
    xpPerMessage: 10,
    xpCooldown: 30000,
    levelUpNotification: true
  }
};

/**
 * Carrega dados de leveling com proteção contra corrupção
 */
function loadLevelingSafe() {
  try {
    const data = loadJsonFileSafe(LEVELING_FILE, DEFAULT_LEVELING_STRUCTURE, DEFAULT_LEVELING_STRUCTURE);
    
    // Validações adicionais
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Dados de leveling inválidos, usando padrão');
      return { ...DEFAULT_LEVELING_STRUCTURE };
    }
    
    // Garante estrutura correta
    if (!data.users || typeof data.users !== 'object') {
      data.users = {};
    }
    
    if (!Array.isArray(data.patents) || data.patents.length === 0) {
      data.patents = DEFAULT_PATENTS;
    }
    
    // Valida cada usuário
    for (const [userId, userData] of Object.entries(data.users)) {
      if (!userData || typeof userData !== 'object') {
        data.users[userId] = validateLevelingUser(null);
        continue;
      }
      
      // Corrige valores inválidos
      data.users[userId] = validateLevelingUser(userData);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar leveling:', error.message);
    return { ...DEFAULT_LEVELING_STRUCTURE };
  }
}

/**
 * Salva dados de leveling com proteção
 */
function saveLevelingSafe(data) {
  try {
    if (!data || typeof data !== 'object') {
      console.error('❌ Tentativa de salvar leveling com dados inválidos');
      return false;
    }
    
    // Garante estrutura mínima
    data.users = data.users || {};
    data.patents = data.patents || DEFAULT_PATENTS;
    
    return saveJsonFileSafe(LEVELING_FILE, data, true);
  } catch (error) {
    console.error('❌ Erro ao salvar leveling:', error.message);
    return false;
  }
}

/**
 * Obtém usuário de leveling com validação
 */
function getLevelingUser(levelingData, userId) {
  try {
    if (!levelingData || typeof levelingData !== 'object') {
      console.error('❌ getLevelingUser: levelingData inválido');
      return validateLevelingUser(null);
    }
    
    if (!userId || typeof userId !== 'string') {
      console.error('❌ getLevelingUser: userId inválido');
      return validateLevelingUser(null);
    }
    
    levelingData.users = levelingData.users || {};
    
    if (!levelingData.users[userId]) {
      levelingData.users[userId] = validateLevelingUser(null);
    } else {
      levelingData.users[userId] = validateLevelingUser(levelingData.users[userId]);
    }
    
    return levelingData.users[userId];
  } catch (error) {
    console.error('❌ Erro em getLevelingUser:', error.message);
    return validateLevelingUser(null);
  }
}

function checkLevelUp(userId, userData, levelingData, nazu, from) {
  try {
    // Validação de entrada
    if (!userData || typeof userData !== 'object') return;
    if (!levelingData || typeof levelingData !== 'object') return;
    
    // Garante valores numéricos válidos
    userData.level = typeof userData.level === 'number' && !isNaN(userData.level) ? Math.max(1, Math.floor(userData.level)) : 1;
    userData.xp = typeof userData.xp === 'number' && !isNaN(userData.xp) ? Math.max(0, Math.floor(userData.xp)) : 0;
    
    const nextLevelXp = calculateNextLevelXp(userData.level);
    
    if (userData.xp >= nextLevelXp) {
      userData.level++;
      userData.xp -= nextLevelXp;
      userData.patent = getPatent(userData.level, levelingData.patents || DEFAULT_PATENTS);
      
      // Usa salvamento seguro
      saveLevelingSafe(levelingData);
      
      let levelUpText = `╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n`;
      levelUpText += `│\n`;
      levelUpText += `│ 👤 @${getUserName(userId)}\n`;
      levelUpText += `│\n`;
      levelUpText += `│ 📊 *Nível Atual:* ${userData.level}\n`;
      levelUpText += `│ ✨ *XP:* ${userData.xp}/${calculateNextLevelXp(userData.level)}\n`;
      levelUpText += `│ 🎖️ *Patente:* ${userData.patent}\n`;
      levelUpText += `│\n`;
      levelUpText += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n`;
      levelUpText += `\n🎊 *Parabéns pelo progresso!* 🎊`;
      
      if (nazu && from) {
        nazu.sendMessage(from, {
          text: levelUpText,
          mentions: [userId]
        }).catch(err => console.error('Erro ao enviar msg level up:', err.message));
      }
    }
  } catch (error) {
    console.error('❌ Erro em checkLevelUp:', error.message);
  }
}

function checkLevelDown(userId, userData, levelingData) {
  try {
    // Validação de entrada
    if (!userData || typeof userData !== 'object') return;
    if (!levelingData || typeof levelingData !== 'object') return;
    
    // Garante valores numéricos válidos
    userData.level = typeof userData.level === 'number' && !isNaN(userData.level) ? Math.max(1, Math.floor(userData.level)) : 1;
    userData.xp = typeof userData.xp === 'number' && !isNaN(userData.xp) ? Math.floor(userData.xp) : 0;
    
    while (userData.xp < 0 && userData.level > 1) {
      userData.level--;
      const prevLevelXp = calculateNextLevelXp(userData.level - 1);
      userData.xp += prevLevelXp;
    }
    
    if (userData.xp < 0) {
      userData.xp = 0;
    }
    
    userData.patent = getPatent(userData.level, levelingData.patents || DEFAULT_PATENTS);
  } catch (error) {
    console.error('❌ Erro em checkLevelDown:', error.message);
  }
}

const loadCustomAutoResponses = () => {
  return loadJsonFile(CUSTOM_AUTORESPONSES_FILE, {
    responses: []
  }).responses || [];
};

const saveCustomAutoResponses = responses => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CUSTOM_AUTORESPONSES_FILE, JSON.stringify({
      responses
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas personalizadas:', error);
    return false;
  }
};

const loadCustomCommands = () => {
  try {
    const data = loadJsonFile(CUSTOM_COMMANDS_FILE, { commands: [] });
    return Array.isArray(data.commands) ? data.commands : [];
  } catch (error) {
    console.error('❌ Erro ao carregar comandos personalizados:', error);
    return [];
  }
};

const saveCustomCommands = (commands) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(CUSTOM_COMMANDS_FILE, JSON.stringify({ commands }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos personalizados:', error);
    return false;
  }
};

const removeCustomCommand = (predicate) => {
  try {
    const commands = loadCustomCommands();
    const filtered = commands.filter(cmd => !predicate(cmd));
    if (filtered.length === commands.length) {
      return { removed: false, commands };
    }
    const success = saveCustomCommands(filtered);
    return { removed: success, commands: filtered };
  } catch (error) {
    console.error('❌ Erro ao remover comando personalizado:', error);
    return { removed: false, commands: [] };
  }
};

const findCustomCommand = (trigger) => {
  try {
    const normalized = normalizar(trigger || '').replace(/\s+/g, '');
    if (!normalized) return null;
    const commands = loadCustomCommands();
    return commands.find(cmd => cmd.trigger === normalized) || null;
  } catch (error) {
    console.error('❌ Erro ao buscar comando personalizado:', error);
    return null;
  }
};

// Funções para auto-respostas com suporte a mídia
const loadGroupAutoResponses = (groupId) => {
  const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
  const groupData = loadJsonFile(groupFile, {});
  return groupData.autoResponses || [];
};

const saveGroupAutoResponses = (groupId, autoResponses) => {
  try {
    const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
    let groupData = loadJsonFile(groupFile, {});
    groupData.autoResponses = autoResponses;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas do grupo:', error);
    return false;
  }
};

const addAutoResponse = async (groupId, trigger, responseData, isGlobal = false) => {
  try {
    const newResponse = {
      id: Date.now().toString(),
      trigger: normalizar(trigger),
      response: responseData,
      createdAt: new Date().toISOString(),
      isGlobal: isGlobal
    };

    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      globalResponses.push(newResponse);
      return saveCustomAutoResponses(globalResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      groupResponses.push(newResponse);
      return saveGroupAutoResponses(groupId, groupResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar auto-resposta:', error);
    return false;
  }
};

const deleteAutoResponse = (groupId, responseId, isGlobal = false) => {
  try {
    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      const filteredResponses = globalResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === globalResponses.length) return false;
      return saveCustomAutoResponses(filteredResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      const filteredResponses = groupResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === groupResponses.length) return false;
      return saveGroupAutoResponses(groupId, filteredResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar auto-resposta:', error);
    return false;
  }
};

const processAutoResponse = async (nazu, from, triggerText, info) => {
  try {
    const normalizedTrigger = normalizar(triggerText);
    
    // Verificar auto-respostas globais (do dono)
    const globalResponses = loadCustomAutoResponses();
    for (const response of globalResponses) {
      if (normalizedTrigger.includes(response.trigger || response.received)) {
        await sendAutoResponse(nazu, from, response, info);
        return true;
      }
    }

    // Verificar auto-respostas do grupo (dos admins)
    if (from.endsWith('@g.us')) {
      const groupResponses = loadGroupAutoResponses(from);
      for (const response of groupResponses) {
        if (normalizedTrigger.includes(response.trigger)) {
          await sendAutoResponse(nazu, from, response, info);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao processar auto-resposta:', error);
    return false;
  }
};

const sendAutoResponse = async (nazu, from, response, quotedMessage) => {
  try {
    const responseData = response.response || response;
    
    // Compatibilidade com sistema antigo (apenas texto)
    if (typeof responseData === 'string') {
      await nazu.sendMessage(from, { text: responseData }, { quoted: quotedMessage });
      return;
    }

    // Sistema novo com suporte a mídia
    const messageContent = {};
    const sendOptions = { quoted: quotedMessage };

    switch (responseData.type) {
      case 'text':
        messageContent.text = responseData.content;
        break;

      case 'image':
        if (responseData.buffer) {
          messageContent.image = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.image = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'video':
        if (responseData.buffer) {
          messageContent.video = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.video = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'audio':
        if (responseData.buffer) {
          messageContent.audio = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.audio = { url: responseData.url };
        }
        messageContent.mimetype = 'audio/mp4';
        messageContent.ptt = responseData.ptt || false;
        break;

      case 'sticker':
        if (responseData.buffer) {
          messageContent.sticker = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.sticker = { url: responseData.url };
        }
        break;

      default:
        messageContent.text = responseData.content || 'Resposta automática';
    }

    await nazu.sendMessage(from, messageContent, sendOptions);
  } catch (error) {
    console.error('❌ Erro ao enviar auto-resposta:', error);
  }
};

const loadNoPrefixCommands = () => {
  return loadJsonFile(NO_PREFIX_COMMANDS_FILE, {
    commands: []
  }).commands || [];
};

const saveNoPrefixCommands = commands => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(NO_PREFIX_COMMANDS_FILE, JSON.stringify({
      commands
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos sem prefixo:', error);
    return false;
  }
};

const loadCommandAliases = () => {
  return loadJsonFile(COMMAND_ALIASES_FILE, {
    aliases: []
  }).aliases || [];
};

const saveCommandAliases = aliases => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(COMMAND_ALIASES_FILE, JSON.stringify({
      aliases
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar apelidos de comandos:', error);
    return false;
  }
};

const loadGlobalBlacklist = () => {
  return loadJsonFile(GLOBAL_BLACKLIST_FILE, {
    users: {},
    groups: {}
  });
};

const saveGlobalBlacklist = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(GLOBAL_BLACKLIST_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar blacklist global:', error);
    return false;
  }
};

const addGlobalBlacklist = async (userId, reason, addedBy, nazu = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  // Se userId é um JID e temos o nazu, tentamos normalizar para LID
  if (nazu && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(nazu, userId);
      if (lid && lid.includes('@lid')) userId = lid;
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em addGlobalBlacklist:', e.message);
    }
  }
  let blacklistData = loadGlobalBlacklist();
  // Verifica se já existe (comparando base entre LID/JID)
  const alreadyExistsKey = Object.keys(blacklistData.users).find(k => idsMatch(k, userId));
  if (alreadyExistsKey) {
    return {
      success: false,
      message: `✨ Usuário @${getUserName(userId)} já está na blacklist global!`
    };
  }
  blacklistData.users[userId] = {
    reason: reason || 'Não especificado',
    addedBy: addedBy || 'Desconhecido',
    addedAt: new Date().toISOString()
  };
  if (saveGlobalBlacklist(blacklistData)) {
    return {
      success: true,
      message: `🎉 Usuário @${getUserName(userId)} adicionado à blacklist global com sucesso! Motivo: ${reason || 'Não especificado'}`
    };
  } else {
    return {
      success: false,
      message: '😥 Erro ao salvar a blacklist global. Tente novamente!'
    };
  }
};

const removeGlobalBlacklist = async (userId, nazu = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return {
      success: false,
      message: 'ID de usuário inválido. Use o LID ou marque o usuário.'
    };
  }
  // Tenta normalizar para LID se tivermos acesso ao nazu
  if (nazu && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(nazu, userId);
      if (lid && lid.includes('@lid')) userId = lid;
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em removeGlobalBlacklist:', e.message);
    }
  }

  let blacklistData = loadGlobalBlacklist();
  // permite remover por correspondência base (JID/LID)
  let foundKey = Object.keys(blacklistData.users).find(k => idsMatch(k, userId));
  if (!blacklistData.users[userId] && !foundKey) {
    return {
      success: false,
      message: `🤔 Usuário @${getUserName(userId)} não está na blacklist global.`
    };
  }
  // Se encontrou por correspondência, deleta a chave encontrada
  if (foundKey) {
    delete blacklistData.users[foundKey];
  } else {
    delete blacklistData.users[userId];
  }
  if (saveGlobalBlacklist(blacklistData)) {
    return {
      success: true,
      message: `👋 Usuário @${getUserName(userId)} removido da blacklist global com sucesso!`
    };
  } else {
    return {
      success: false,
      message: '😥 Erro ao salvar a blacklist global após remoção. Tente novamente!'
    };
  }
};

const getGlobalBlacklist = () => {
  return loadGlobalBlacklist();
};

const loadMenuDesign = () => {
  try {
    if (fs.existsSync(MENU_DESIGN_FILE)) {
      return JSON.parse(fs.readFileSync(MENU_DESIGN_FILE, 'utf-8'));
    } else {
      return {
        header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
        menuTopBorder: "╭┈",
        bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
        menuTitleIcon: "🍧ฺꕸ▸",
        menuItemIcon: "•.̇𖥨֗🍓⭟",
        separatorIcon: "❁",
        middleBorder: "┊"
      };
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar design do menu: ${error.message}`);
    return {
      header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
      menuTopBorder: "╭┈",
      bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
      menuTitleIcon: "🍧ฺꕸ▸",
      menuItemIcon: "•.̇𖥨֗🍓⭟",
      separatorIcon: "❁",
      middleBorder: "┊"
    };
  }
};

const saveMenuDesign = (design) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    fs.writeFileSync(MENU_DESIGN_FILE, JSON.stringify(design, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar design do menu: ${error.message}`);
    return false;
  }
};

const getMenuDesignWithDefaults = (botName, userName) => {
  const design = loadMenuDesign();

  // Substitui os placeholders pelos valores atuais
  const processedDesign = {};
  for (const [key, value] of Object.entries(design)) {
    if (typeof value === 'string') {
      processedDesign[key] = value
        .replace(/{botName}/g, botName)
        .replace(/{userName}/g, userName);
    } else {
      processedDesign[key] = value;
    }
  }

  return processedDesign;
};

// ===== Per-User Command Limiting System =====
const loadCommandLimits = () => {
  const data = loadJsonFile(CMD_LIMIT_FILE, {
    commands: {},
    users: {}
  });
  if (!data || typeof data !== 'object') {
    return { commands: {}, users: {} };
  }
  return {
    ...data,
    commands: data.commands && typeof data.commands === 'object' ? data.commands : {},
    users: data.users && typeof data.users === 'object' ? data.users : {}
  };
};

const saveCommandLimits = (data) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CMD_LIMIT_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar limites de comandos:', error);
    return false;
  }
};

const addCommandLimit = (commandName, maxUses, timeFrame) => {
  try {
    const limitsData = loadCommandLimits();
    
    // Validate inputs
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!maxUses || maxUses <= 0 || !Number.isInteger(maxUses)) {
      return {
        success: false,
        message: '❌ Número de usos deve ser um inteiro positivo!'
      };
    }
    
    if (!timeFrame || typeof timeFrame !== 'string') {
      return {
        success: false,
        message: '❌ Período de tempo inválido!'
      };
    }
    
    // Validate timeFrame format (e.g., "1h", "30m", "1d")
    const timeFrameRegex = /^(\d+)([smhd])$/i;
    if (!timeFrameRegex.test(timeFrame)) {
      return {
        success: false,
        message: '❌ Formato de tempo inválido! Use formatos como: 30m (30 minutos), 1h (1 hora), 1d (1 dia)'
      };
    }
    
    // Check if command already has a limit
    if (limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} já possui um limite configurado!`
      };
    }
    
    limitsData.commands[cmdName] = {
      maxUses: maxUses,
      timeFrame: timeFrame,
      createdAt: new Date().toISOString()
    };
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite adicionado para o comando ${cmdName}!\n📊 Máximo: ${maxUses} usos por ${timeFrame} por usuário`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao salvar o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao adicionar limite!'
    };
  }
};

const removeCommandLimit = (commandName) => {
  try {
    const limitsData = loadCommandLimits();
    
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} não possui limite configurado!`
      };
    }
    
    delete limitsData.commands[cmdName];
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite removido do comando ${cmdName}!`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao remover o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao remover limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao remover limite!'
    };
  }
};

const getCommandLimits = () => {
  try {
    const limitsData = loadCommandLimits();
    return limitsData.commands || {};
  } catch (error) {
    console.error('❌ Erro ao carregar limites de comandos:', error);
    return {};
  }
};

const checkCommandLimit = (commandName, userId) => {
  try {
    const limitsData = loadCommandLimits();
    const cmdName = commandName.toLowerCase().trim();
    const commandLimit = limitsData.commands[cmdName];
    
    if (!commandLimit) {
      return {
        limited: false,
        message: null
      };
    }
    
    // Initialize users tracking for this command if not exists
    limitsData.users[cmdName] = limitsData.users[cmdName] || {};
    const userUsage = limitsData.users[cmdName][userId] || { uses: 0, resetTime: 0 };
    
    const now = Date.now();
    
    // Reset counter if time frame has passed
    if (now >= userUsage.resetTime) {
      userUsage.uses = 0;
      userUsage.resetTime = now + parseTimeFrame(commandLimit.timeFrame);
    }
    
    if (userUsage.uses >= commandLimit.maxUses) {
      const timeLeft = userUsage.resetTime - now;
      return {
        limited: true,
        message: `🚫 Comando ${cmdName} bloqueado! Tente novamente em ${formatTimeLeft(timeLeft)}.`,
        resetTime: userUsage.resetTime
      };
    }
    
    // Increment usage count for this user
    userUsage.uses++;
    userUsage.lastUsed = now;
    limitsData.users[cmdName][userId] = userUsage;
    
    saveCommandLimits(limitsData);
    
    return {
      limited: false,
      message: null,
      remainingUses: commandLimit.maxUses - userUsage.uses
    };
  } catch (error) {
    console.error('❌ Erro ao verificar limite de comando:', error);
    return {
      limited: false,
      message: null
    };
  }
};

// Helper function to parse time frame (e.g., "1h" -> 3600000 milliseconds)
const parseTimeFrame = (timeFrame) => {
  const match = timeFrame.match(/^(\d+)([smhd])$/i);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 's': return value * 1000;        // seconds
    case 'm': return value * 60 * 1000;   // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return 0;
  }
};

// Helper function to format time left
const formatTimeLeft = (milliseconds) => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/*
// ANTIGO EXPORT - COMENTADO PARA EVITAR DUPLICAÇÃO
export {
  runDatabaseSelfTest,
  loadMsgPrefix,
  saveMsgPrefix,
  loadMsgBotOn,
  saveMsgBotOn,
  loadCmdNotFoundConfig,
  saveCmdNotFoundConfig,
  validateMessageTemplate,
  formatMessageWithFallback,
  loadCustomReacts,
  saveCustomReacts,
  loadReminders,
  saveReminders,
  addCustomReact,
  deleteCustomReact,
  loadDivulgacao,
  saveDivulgacao,
  loadSubdonos,
  saveSubdonos,
  isSubdono,
  addSubdono,
  removeSubdono,
  getSubdonos,
  loadRentalData,
  saveRentalData,
  isRentalModeActive,
  setRentalMode,
  getGroupRentalStatus,
  setGroupRental,
  loadActivationCodes,
  saveActivationCodes,
  generateActivationCode,
  validateActivationCode,
  useActivationCode,
  extendGroupRental,
  isModoLiteActive,
  loadParceriasData,
  saveParceriasData,
  calculateNextLevelXp,
  getPatent,
  loadEconomy,
  saveEconomy,
  getEcoUser,
  createDefaultEcoUser,
  migrateAndValidateEcoUser,
  migrateAndValidatePet,
  diagnosticDatabase,
  parseAmount,
  fmt,
  timeLeft,
  applyShopBonuses,
  PICKAXE_TIER_MULT,
  PICKAXE_TIER_ORDER,
  SHOP_ITEMS,
  getActivePickaxe,
  ensureEconomyDefaults,
  giveMaterial,
  generateDailyChallenge,
  ensureUserChallenge,
  updateChallenge,
  isChallengeCompleted,
  updateQuestProgress,
  SKILL_LIST,
  ensureUserSkills,
  skillXpForNext,
  addSkillXP,
  getSkillBonus,
  endOfWeekTimestamp,
  endOfMonthTimestamp,
  generateWeeklyChallenge,
  generateMonthlyChallenge,
  ensureUserPeriodChallenges,
  updatePeriodChallenge,
  isPeriodCompleted,
  checkLevelUp,
  checkLevelDown,
  loadCustomAutoResponses,
  saveCustomAutoResponses,
  loadGroupAutoResponses,
  saveGroupAutoResponses,
  addAutoResponse,
  deleteAutoResponse,
  processAutoResponse,
  sendAutoResponse,
  loadCustomCommands,
  saveCustomCommands,
  removeCustomCommand,
  findCustomCommand,
  loadNoPrefixCommands,
  saveNoPrefixCommands,
  loadCommandAliases,
  saveCommandAliases,
  loadGlobalBlacklist,
  saveGlobalBlacklist,
  addGlobalBlacklist,
  removeGlobalBlacklist,
  getGlobalBlacklist,
  loadMenuDesign,
  saveMenuDesign,
  getMenuDesignWithDefaults,
  loadRelationships,
  saveRelationships,
  // Command limiting functions
  loadCommandLimits,
  saveCommandLimits,
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  parseTimeFrame,
  formatTimeLeft,
  // Funções de segurança JSON
  loadJsonFileSafe,
  saveJsonFileSafe,
  validateLevelingUser,
  validateEconomyUser,
  validateGroupData,
  createBackup,
  // Funções de leveling seguras
  loadLevelingSafe,
  saveLevelingSafe,
  getLevelingUser,
  DEFAULT_PATENTS,
  DEFAULT_LEVELING_STRUCTURE,
  // Funções de normalização de parâmetros
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  findInArrayIgnoringAccents,
  resolveParamAlias,
  matchParam,
  PARAM_ALIASES
};

*/

// ============== SISTEMA DE PERSONALIZAÇÃO DE GRUPO ==============

const loadGroupCustomization = () => {
  ensureJsonFileExists(GROUP_CUSTOMIZATION_FILE, { enabled: false, groups: {} });
  return loadJsonFile(GROUP_CUSTOMIZATION_FILE);
};

const saveGroupCustomization = (data) => {
  fs.writeFileSync(GROUP_CUSTOMIZATION_FILE, JSON.stringify(data, null, 2));
};

const isGroupCustomizationEnabled = () => {
  const data = loadGroupCustomization();
  return data.enabled || false;
};

const setGroupCustomizationEnabled = (enabled) => {
  const data = loadGroupCustomization();
  data.enabled = enabled;
  saveGroupCustomization(data);
  return data.enabled;
};

const getGroupCustomization = (groupId) => {
  if (!isGroupCustomizationEnabled()) return null;
  const data = loadGroupCustomization();
  return data.groups[groupId] || null;
};

const setGroupCustomName = (groupId, customName) => {
  const data = loadGroupCustomization();
  if (!data.groups[groupId]) {
    data.groups[groupId] = {};
  }
  data.groups[groupId].customName = customName;
  saveGroupCustomization(data);
  return true;
};

const setGroupCustomPhoto = (groupId, photoPath) => {
  const data = loadGroupCustomization();
  if (!data.groups[groupId]) {
    data.groups[groupId] = {};
  }
  data.groups[groupId].customPhoto = photoPath;
  saveGroupCustomization(data);
  return true;
};

const removeGroupCustomName = (groupId) => {
  const data = loadGroupCustomization();
  if (data.groups[groupId]) {
    delete data.groups[groupId].customName;
    if (Object.keys(data.groups[groupId]).length === 0) {
      delete data.groups[groupId];
    }
    saveGroupCustomization(data);
  }
  return true;
};

const removeGroupCustomPhoto = (groupId) => {
  const data = loadGroupCustomization();
  if (data.groups[groupId]) {
    // Remove o arquivo físico se existir
    if (data.groups[groupId].customPhoto && fs.existsSync(data.groups[groupId].customPhoto)) {
      fs.unlinkSync(data.groups[groupId].customPhoto);
    }
    delete data.groups[groupId].customPhoto;
    if (Object.keys(data.groups[groupId]).length === 0) {
      delete data.groups[groupId];
    }
    saveGroupCustomization(data);
  }
  return true;
};

// ============== SISTEMA DE ÁUDIO DO MENU ==============

const loadMenuAudio = () => {
  ensureJsonFileExists(MENU_AUDIO_FILE, { enabled: false, audioPath: null });
  return loadJsonFile(MENU_AUDIO_FILE);
};

const saveMenuAudio = (data) => {
  fs.writeFileSync(MENU_AUDIO_FILE, JSON.stringify(data, null, 2));
};

const isMenuAudioEnabled = () => {
  const data = loadMenuAudio();
  return data.enabled && data.audioPath && fs.existsSync(data.audioPath);
};

const getMenuAudioPath = () => {
  const data = loadMenuAudio();
  if (data.enabled && data.audioPath && fs.existsSync(data.audioPath)) {
    return data.audioPath;
  }
  return null;
};

const setMenuAudio = (audioPath) => {
  const data = loadMenuAudio();
  data.enabled = true;
  data.audioPath = audioPath;
  saveMenuAudio(data);
  return true;
};

const removeMenuAudio = () => {
  const data = loadMenuAudio();
  
  // Remove o arquivo físico se existir
  if (data.audioPath && fs.existsSync(data.audioPath)) {
    try {
      fs.unlinkSync(data.audioPath);
    } catch (error) {
      console.error('Erro ao remover áudio:', error);
    }
  }
  
  data.enabled = false;
  data.audioPath = null;
  saveMenuAudio(data);
  return true;
};

// ============== SISTEMA DE LER MAIS DO MENU ==============

const loadMenuLerMais = () => {
  ensureJsonFileExists(MENU_LERMAIS_FILE, { enabled: true });
  return loadJsonFile(MENU_LERMAIS_FILE);
};

const saveMenuLerMais = (data) => {
  fs.writeFileSync(MENU_LERMAIS_FILE, JSON.stringify(data, null, 2));
};

const isMenuLerMaisEnabled = () => {
  const data = loadMenuLerMais();
  return data.enabled !== false; // Por padrão ativo
};

const setMenuLerMais = (enabled) => {
  const data = loadMenuLerMais();
  data.enabled = enabled;
  saveMenuLerMais(data);
  return data.enabled;
};

const getMenuLerMaisText = () => {
  if (!isMenuLerMaisEnabled()) {
    return '';
  }
  // Caracteres invisíveis para o "ler mais"
  return '‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎\n';
};

export {
  runDatabaseSelfTest,
  loadMsgPrefix,
  saveMsgPrefix,
  loadMsgBotOn,
  saveMsgBotOn,
  loadCmdNotFoundConfig,
  saveCmdNotFoundConfig,
  validateMessageTemplate,
  formatMessageWithFallback,
  loadCustomReacts,
  saveCustomReacts,
  loadReminders,
  saveReminders,
  addCustomReact,
  deleteCustomReact,
  loadDivulgacao,
  saveDivulgacao,
  loadSubdonos,
  saveSubdonos,
  isSubdono,
  addSubdono,
  removeSubdono,
  getSubdonos,
  loadRentalData,
  saveRentalData,
  isRentalModeActive,
  setRentalMode,
  getGroupRentalStatus,
  setGroupRental,
  loadActivationCodes,
  saveActivationCodes,
  generateActivationCode,
  validateActivationCode,
  useActivationCode,
  extendGroupRental,
  isModoLiteActive,
  loadParceriasData,
  saveParceriasData,
  calculateNextLevelXp,
  getPatent,
  loadEconomy,
  saveEconomy,
  getEcoUser,
  createDefaultEcoUser,
  migrateAndValidateEcoUser,
  migrateAndValidatePet,
  diagnosticDatabase,
  parseAmount,
  fmt,
  timeLeft,
  applyShopBonuses,
  PICKAXE_TIER_MULT,
  PICKAXE_TIER_ORDER,
  SHOP_ITEMS,
  getActivePickaxe,
  ensureEconomyDefaults,
  giveMaterial,
  generateDailyChallenge,
  ensureUserChallenge,
  updateChallenge,
  isChallengeCompleted,
  updateQuestProgress,
  SKILL_LIST,
  ensureUserSkills,
  skillXpForNext,
  addSkillXP,
  getSkillBonus,
  endOfWeekTimestamp,
  endOfMonthTimestamp,
  generateWeeklyChallenge,
  generateMonthlyChallenge,
  ensureUserPeriodChallenges,
  updatePeriodChallenge,
  isPeriodCompleted,
  checkLevelUp,
  checkLevelDown,
  loadCustomAutoResponses,
  saveCustomAutoResponses,
  loadGroupAutoResponses,
  saveGroupAutoResponses,
  addAutoResponse,
  deleteAutoResponse,
  processAutoResponse,
  sendAutoResponse,
  loadCustomCommands,
  saveCustomCommands,
  removeCustomCommand,
  findCustomCommand,
  loadNoPrefixCommands,
  saveNoPrefixCommands,
  loadCommandAliases,
  saveCommandAliases,
  loadGlobalBlacklist,
  saveGlobalBlacklist,
  addGlobalBlacklist,
  removeGlobalBlacklist,
  getGlobalBlacklist,
  loadMenuDesign,
  saveMenuDesign,
  getMenuDesignWithDefaults,
  loadRelationships,
  saveRelationships,
  // Command limiting functions
  loadCommandLimits,
  saveCommandLimits,
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  parseTimeFrame,
  formatTimeLeft,
  // Funções de segurança JSON
  loadJsonFileSafe,
  saveJsonFileSafe,
  validateLevelingUser,
  validateEconomyUser,
  validateGroupData,
  createBackup,
  // Funções de leveling seguras
  loadLevelingSafe,
  saveLevelingSafe,
  getLevelingUser,
  DEFAULT_PATENTS,
  DEFAULT_LEVELING_STRUCTURE,
  // Funções de normalização de parâmetros
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  findInArrayIgnoringAccents,
  resolveParamAlias,
  matchParam,
  PARAM_ALIASES,
  // Sistema de Personalização de Grupo
  loadGroupCustomization,
  saveGroupCustomization,
  isGroupCustomizationEnabled,
  setGroupCustomizationEnabled,
  getGroupCustomization,
  setGroupCustomName,
  setGroupCustomPhoto,
  removeGroupCustomName,
  removeGroupCustomPhoto,
  // Sistema de Áudio do Menu
  loadMenuAudio,
  saveMenuAudio,
  isMenuAudioEnabled,
  getMenuAudioPath,
  setMenuAudio,
  removeMenuAudio,
  // Sistema de Ler Mais do Menu
  loadMenuLerMais,
  isMenuLerMaisEnabled,
  setMenuLerMais,
  getMenuLerMaisText
};