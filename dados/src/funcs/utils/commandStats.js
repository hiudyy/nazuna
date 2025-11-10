import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATS_FILE = path.join(__dirname, '../../../database/commandStats.json');

let statsCache = null;
let isWriting = false;
let hasPendingWrite = false;

async function initializeStats() {
    try {
        await fs.access(STATS_FILE);
        const data = await fs.readFile(STATS_FILE, 'utf8');
        statsCache = JSON.parse(data);
    } catch (error) {
        statsCache = { commands: {}, lastUpdated: new Date().toISOString() };
        try {
            await fs.mkdir(path.dirname(STATS_FILE), { recursive: true });
            await fs.writeFile(STATS_FILE, JSON.stringify(statsCache, null, 2));
        } catch (writeError) {
            console.error('Falha ao criar arquivo inicial de estatísticas:', writeError.message);
        }
    }
}

async function saveStats() {
    if (isWriting) { hasPendingWrite = true; return; }
    isWriting = true;
    try {
        statsCache.lastUpdated = new Date().toISOString();
        await fs.writeFile(STATS_FILE, JSON.stringify(statsCache, null, 2));
    } catch (error) { console.error('Erro ao escrever arquivo de estatísticas:', error.message); }
    finally { isWriting = false; if (hasPendingWrite) { hasPendingWrite = false; saveStats(); } }
}

async function trackCommandUsage(command, userId) {
    if (!statsCache) await initializeStats();
    const commandStats = statsCache.commands[command] || { count: 0, users: {}, lastUsed: '' };
    commandStats.count++;
    commandStats.users[userId] = (commandStats.users[userId] || 0) + 1;
    commandStats.lastUsed = new Date().toISOString();
    statsCache.commands[command] = commandStats;
    await saveStats();
    return true;
}

async function getMostUsedCommands(limit = 10) {
    if (!statsCache) await initializeStats();
    const commandsArray = Object.entries(statsCache.commands).map(([name, data]) => ({ name, count: data.count, lastUsed: data.lastUsed, uniqueUsers: Object.keys(data.users).length }));
    commandsArray.sort((a, b) => b.count - a.count);
    return commandsArray.slice(0, limit);
}

async function getCommandStats(command) {
    if (!statsCache) await initializeStats();
    const commandData = statsCache.commands[command];
    if (!commandData) return null;
    const topUsers = Object.entries(commandData.users).map(([userId, count]) => ({ userId, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return { name: command, count: commandData.count, lastUsed: commandData.lastUsed, uniqueUsers: Object.keys(commandData.users).length, topUsers };
}

initializeStats();

export { trackCommandUsage, getMostUsedCommands, getCommandStats };
