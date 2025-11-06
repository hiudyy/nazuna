const fs = require('fs');
const pathz = require('path');

// Cache global de JID → LID em memória (para acesso rápido)
let jidLidMemoryCache = new Map();
let jidLidCacheFile = null;

// Inicializa o caminho do cache
function initJidLidCache(cacheFilePath) {
  jidLidCacheFile = cacheFilePath;
  
  // Carrega cache existente do arquivo
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
      jidLidMemoryCache = new Map(Object.entries(data.mappings || {}));
      console.log(`✅ Cache JID→LID carregado: ${jidLidMemoryCache.size} entradas`);
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao carregar cache JID→LID: ${error.message}`);
  }
}

// Salva o cache em disco
function saveJidLidCache() {
  if (!jidLidCacheFile) return;
  
  try {
    const data = {
      version: '1.0',
      lastUpdate: new Date().toISOString(),
      mappings: Object.fromEntries(jidLidMemoryCache)
    };
    
    const dirPath = pathz.dirname(jidLidCacheFile);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(jidLidCacheFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ Erro ao salvar cache JID→LID: ${error.message}`);
  }
}

// Busca LID do cache ou via onWhatsApp
async function getLidFromJidCached(nazu, jid) {
  if (!isValidJid(jid)) {
    return jid; // Já é LID ou outro formato
  }
  
  // 1. Verifica cache em memória primeiro (mais rápido)
  if (jidLidMemoryCache.has(jid)) {
    return jidLidMemoryCache.get(jid);
  }
  
  // 2. Se não está no cache, busca via API
  try {
    const result = await nazu.onWhatsApp(jid);
    if (result && result[0] && result[0].lid) {
      const lid = result[0].lid;
      
      // Salva no cache
      jidLidMemoryCache.set(jid, lid);
      
      // Salva em disco (debounced - a cada 10 novos)
      if (jidLidMemoryCache.size % 10 === 0) {
        saveJidLidCache();
      }
      
      return lid;
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar LID para ${jid}: ${error.message}`);
  }
  
  // 3. Fallback: retorna o JID original
  return jid;
}

// Converte um array de IDs (JID/LID) para LID em batch
async function convertIdsToLid(nazu, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  
  const converted = [];
  
  // Processa em paralelo (batch de 5 para não sobrecarregar)
  const batchSize = 5;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchPromises = batch.map(id => getLidFromJidCached(nazu, id));
    const batchResults = await Promise.all(batchPromises);
    converted.push(...batchResults);
  }
  
  return converted;
}

// Verifica se dois IDs são equivalentes (ignora sufixo @lid/@s.whatsapp.net)
function idsMatch(id1, id2) {
  if (!id1 || !id2) return false;
  
  const base1 = id1.split('@')[0];
  const base2 = id2.split('@')[0];
  
  return base1 === base2;
}

// Verifica se um ID está presente em um array (comparação por base)
function idInArray(id, array) {
  if (!id || !Array.isArray(array)) return false;
  
  const baseId = id.split('@')[0];
  return array.some(item => {
    const baseItem = item?.split('@')[0];
    return baseItem === baseId;
  });
}

// Converte qualquer ID (JID ou LID) para o formato unificado (preferencialmente LID)
async function normalizeUserId(nazu, userId) {
  if (!userId || typeof userId !== 'string') return userId;
  
  // Se já é LID, retorna direto
  if (isValidLid(userId)) {
    return userId;
  }
  
  // Se é JID, busca o LID
  if (isValidJid(userId)) {
    return await getLidFromJidCached(nazu, userId);
  }
  
  // Outros formatos retornam como estão
  return userId;
}

function formatUptime(seconds, longFormat = false, showZero = false) {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor(seconds % (24 * 3600) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  const formats = longFormat ? {
    d: val => `${val} ${val === 1 ? 'dia' : 'dias'}`,
    h: val => `${val} ${val === 1 ? 'hora' : 'horas'}`,
    m: val => `${val} ${val === 1 ? 'minuto' : 'minutos'}`,
    s: val => `${val} ${val === 1 ? 'segundo' : 'segundos'}`
  } : {
    d: val => `${val}d`,
    h: val => `${val}h`,
    m: val => `${val}m`,
    s: val => `${val}s`
  };
  const uptimeStr = [];
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  return uptimeStr.length > 0 ? uptimeStr.join(longFormat ? ', ' : ' ') : longFormat ? '0 segundos' : '0s';
}

const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};

// Funções auxiliares para LID/JID
const isGroupId = (id) => id && typeof id === 'string' && id.endsWith('@g.us');
const isUserId = (id) => id && typeof id === 'string' && (id.includes('@lid') || id.includes('@s.whatsapp.net'));
const isValidLid = (str) => /^[a-zA-Z0-9_]+@lid$/.test(str);
const isValidJid = (str) => /^\d+@s\.whatsapp\.net$/.test(str);

// Função para extrair nome de usuário de LID/JID de forma compatível
const getUserName = (userId) => {
  if (!userId || typeof userId !== 'string') return 'unknown';
  if (userId.includes('@lid')) {
    return userId.split('@')[0];
  } else if (userId.includes('@s.whatsapp.net')) {
    return userId.split('@')[0];
  }
  return userId.split('@')[0] || userId;
};

// Função para obter LID a partir de JID (quando necessário para compatibilidade)
const getLidFromJid = async (nazu, jid) => {
  if (!isValidJid(jid)) return jid; // Já é LID ou outro formato
  try {
    const result = await nazu.onWhatsApp(jid);
    if (result && result[0] && result[0].lid) {
      return result[0].lid;
    }
  } catch (error) {
    console.warn(`Erro ao obter LID para ${jid}: ${error.message}`);
  }
  return jid; // Fallback para o JID original
};

// Função para construir ID do usuário (LID ou JID como fallback)
const buildUserId = (numberString, config) => {
  if (config.lidowner && numberString === config.numerodono) {
    return config.lidowner;
  }
  return numberString.replace(/[^\d]/g, '') + '@s.whatsapp.net';
};

// Função para obter o ID do bot
const getBotId = (nazu) => {
  const botId = nazu.user.id.split(':')[0];
  return botId.includes('@lid') ? botId : botId + '@s.whatsapp.net';
};

function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true
      });
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
}

function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      const dirPath = pathz.dirname(filePath);
      ensureDirectoryExists(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  }
}

const loadJsonFile = (path, defaultValue = {}) => {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : defaultValue;
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${path}:`, error);
    return defaultValue;
  }
};

module.exports = {
  formatUptime,
  normalizar,
  isGroupId,
  isUserId,
  isValidLid,
  isValidJid,
  getUserName,
  getLidFromJid,
  buildUserId,
  getBotId,
  ensureDirectoryExists,
  ensureJsonFileExists,
  loadJsonFile,
  initJidLidCache,
  saveJidLidCache,
  getLidFromJidCached,
  normalizeUserId,
  convertIdsToLid,
  idsMatch,
  idInArray
};