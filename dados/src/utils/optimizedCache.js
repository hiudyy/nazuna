import NodeCache from 'node-cache';
import path from 'path';
import zlib from 'zlib';

class OptimizedCacheManager {
    constructor() {
        this.caches = new Map();
        this.memoryThreshold = 0.95; // 95% da memória disponível
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutos
        this.compressionEnabled = true;
        this.isOptimizing = false;
        this.lruOrder = new Map(); // For LRU eviction
        this.accessCounts = new Map(); // For dynamic TTL
        
        this.initializeCaches();
        this.startMemoryMonitoring();
    }

    /**
     * Inicializa os caches com configurações otimizadas
     */
    initializeCaches() {
        // Cache para retry de mensagens (menor TTL, mais eficiente)
        this.caches.set('msgRetry', new NodeCache({
            stdTTL: 2 * 60, // 2 minutos (reduzido de 5)
            checkperiod: 30, // Verifica a cada 30 segundos
            useClones: false,
            maxKeys: 1000, // Limita número de chaves
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para metadados de grupos (TTL maior, dados mais estáveis)
        this.caches.set('groupMeta', new NodeCache({
            stdTTL: 10 * 60, // 10 minutos
            checkperiod: 2 * 60, // Verifica a cada 2 minutos
            useClones: false,
            maxKeys: 500, // Máximo 500 grupos
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para metadados de grupos específico do index.js (TTL de 10 segundos)
        this.caches.set('indexGroupMeta', new NodeCache({
            stdTTL: 10, // 10 segundos
            checkperiod: 30, // Verifica a cada 30 segundos
            useClones: false,
            maxKeys: 500, // Máximo 500 grupos
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para mensagens recentes (para anti-delete)
        this.caches.set('messages', new NodeCache({
            stdTTL: 60, // 1 minuto apenas
            checkperiod: 15, // Verifica a cada 15 segundos
            useClones: false,
            maxKeys: 2000, // Máximo 2000 mensagens
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para dados de usuários (sessões, permissões)
        this.caches.set('userData', new NodeCache({
            stdTTL: 30 * 60, // 30 minutos
            checkperiod: 5 * 60, // Verifica a cada 5 minutos
            useClones: false,
            maxKeys: 2000,
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para comandos e rate limiting
        this.caches.set('commands', new NodeCache({
            stdTTL: 5 * 60, // 5 minutos
            checkperiod: 60, // Verifica a cada minuto
            useClones: false,
            maxKeys: 5000,
            deleteOnExpire: true,
            forceString: false
        }));

        // Cache para mídia temporária (TTL muito baixo)
        this.caches.set('media', new NodeCache({
            stdTTL: 30, // 30 segundos apenas
            checkperiod: 10, // Verifica a cada 10 segundos
            useClones: false,
            maxKeys: 100, // Poucos itens de mídia
            deleteOnExpire: true,
            forceString: false
        }));

    }

    /**
     * Obtém cache específico
     */
    getCache(type) {
        return this.caches.get(type);
    }

    /**
     * Obtém valor do cache de metadados de grupos específico do index.js
     */
    async getIndexGroupMeta(groupId) {
        return await this.get('indexGroupMeta', groupId);
    }

    /**
     * Define valor no cache de metadados de grupos específico do index.js
     */
    async setIndexGroupMeta(groupId, value) {
        return await this.set('indexGroupMeta', groupId, value, 10); // 10 segundos TTL
    }

    /**
     * Define valor no cache com compressão opcional
     */
    async set(cacheType, key, value, ttl = null) {
        try {
            const cache = this.caches.get(cacheType);
            if (!cache) {
                return false;
            }

            let finalValue = value;

            // Comprime dados grandes se habilitado
            if (this.compressionEnabled && this.shouldCompress(value)) {
                finalValue = await this.compressData(value);
            }

            // Update access counts and LRU
            this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
            this.lruOrder.set(key, Date.now());

            // Calculate dynamic TTL based on access frequency
            const accessCount = this.accessCounts.get(key);
            let dynamicTtl = ttl;
            if (!ttl && accessCount > 5) {
                dynamicTtl = Math.min(60 * 60, accessCount * 60); // Up to 1 hour for frequently accessed
            }

            if (dynamicTtl) {
                return cache.set(key, finalValue, dynamicTtl);
            } else {
                return cache.set(key, finalValue);
            }
        } catch (error) {
            console.error(`❌ Erro ao definir cache ${cacheType}:`, error.message);
            return false;
        }
    }

    /**
     * Obtém valor do cache com descompressão automática
     */
    async get(cacheType, key) {
        try {
            const cache = this.caches.get(cacheType);
            if (!cache) {
                return undefined;
            }

            let value = cache.get(key);
            
            if (value !== undefined) {
                // Update LRU and access counts
                this.lruOrder.set(key, Date.now());
                this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);

                if (this.compressionEnabled && this.isCompressed(value)) {
                    value = await this.decompressData(value);
                }
            }

            return value;
        } catch (error) {
            console.error(`❌ Erro ao obter cache ${cacheType}:`, error.message);
            return undefined;
        }
    }

    /**
     * Remove item do cache
     */
    del(cacheType, key) {
        try {
            const cache = this.caches.get(cacheType);
            if (cache) {
                const deleted = cache.del(key);
                if (deleted) {
                    this.lruOrder.delete(key);
                    this.accessCounts.delete(key);
                }
                return deleted;
            }
            return false;
        } catch (error) {
            console.error(`❌ Erro ao remover cache ${cacheType}:`, error.message);
            return false;
        }
    }

    /**
     * Limpa cache específico
     */
    clear(cacheType) {
        const cache = this.caches.get(cacheType);
        if (cache) {
            const keysCount = cache.keys().length;
            cache.flushAll();
            return true;
        }
        return false;
    }

    /**
     * Verifica se dados devem ser comprimidos
     */
    shouldCompress(data) {
        try {
            const dataString = JSON.stringify(data);
            return dataString.length > 1024; // Comprime se > 1KB
        } catch {
            return false;
        }
    }

    /**
     * Comprime dados usando zlib
     */
    async compressData(data) {
        try {
            const dataString = JSON.stringify(data);
            const compressed = zlib.gzipSync(dataString);
            return {
                __compressed: true,
                data: compressed,
                originalSize: dataString.length,
                compressedSize: compressed.length,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Erro na compressão:', error.message);
            return data;
        }
    }

    /**
     * Verifica se dados estão comprimidos
     */
    isCompressed(data) {
        return data && typeof data === 'object' && data.__compressed === true;
    }

    /**
     * Descomprime dados usando zlib
     */
    async decompressData(compressedData) {
        try {
            if (!this.isCompressed(compressedData)) {
                return compressedData;
            }
            const decompressed = zlib.gunzipSync(compressedData.data);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('❌ Erro na descompressão:', error.message);
            return compressedData;
        }
    }

    /**
     * Inicia monitoramento de memória
     */
    startMemoryMonitoring() {
        setInterval(async () => {
            await this.checkMemoryUsage();
        }, this.cleanupInterval);

        // Verifica imediatamente
        setTimeout(() => {
            this.checkMemoryUsage();
        }, 10000);
    }

    /**
     * Verifica uso de memória e otimiza se necessário
     */
    async checkMemoryUsage() {
        try {
            const memUsage = process.memoryUsage();
            const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
            const rssMB = Math.round(memUsage.rss / 1024 / 1024);
            
            const memoryPercentage = memUsage.heapUsed / memUsage.heapTotal;

            if (memoryPercentage > 1024) {
                await this.optimizeMemory('high_memory_usage');
            } else if (usedMB > 300) {
                await this.optimizeMemory('moderate_memory_usage');
            }

            if (Date.now() % (30 * 60 * 1000) < this.cleanupInterval) {
                this.logCacheStatistics();
            }
        } catch (error) {
            console.error('❌ Erro ao verificar uso de memória:', error.message);
        }
    }

    /**
     * Otimiza uso de memória
     */
    async optimizeMemory(reason) {
        if (this.isOptimizing) return;
        this.isOptimizing = true;

        try {
            
            let freedMemory = 0;
            
            const cacheOrder = ['media', 'messages', 'commands', 'userData', 'indexGroupMeta', 'groupMeta', 'msgRetry'];
            
            for (const cacheType of cacheOrder) {
                const cache = this.caches.get(cacheType);
                if (cache) {
                    const beforeKeys = cache.keys().length;
                    
                    if (reason === 'high_memory_usage') {
                        if (['media', 'messages'].includes(cacheType)) {
                            cache.flushAll();
                        } else {
                            await this.removeOldCacheItems(cache, 0.5);
                        }
                    } else {
                        cache.flushAll();
                        await this.removeOldCacheItems(cache, 0.2);
                    }
                }
                
                // Força garbage collection após cada cache
                if (global.gc) {
                    global.gc();
                }
            }

            // 2. Força garbage collection final
            if (global.gc) {
                global.gc();
            }

            // 3. Verifica resultado
            const newMemUsage = process.memoryUsage();
            const newUsedMB = Math.round(newMemUsage.heapUsed / 1024 / 1024);
            
        } catch (error) {
            console.error('❌ Erro durante otimização de memória:', error.message);
        } finally {
            this.isOptimizing = false;
        }
    }

    /**
     * Remove itens antigos do cache usando LRU
     */
    async removeOldCacheItems(cache, percentage) {
        try {
            const keys = cache.keys();
            const removeCount = Math.floor(keys.length * percentage);
            
            if (removeCount === 0) return;

            // Sort by LRU order (oldest first)
            const sortedKeys = keys.sort((a, b) => (this.lruOrder.get(a) || 0) - (this.lruOrder.get(b) || 0));
            const keysToRemove = sortedKeys.slice(0, removeCount);
            
            for (const key of keysToRemove) {
                cache.del(key);
                this.lruOrder.delete(key);
                this.accessCounts.delete(key);
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover itens antigos do cache:', error.message);
        }
    }

    /**
     * Registra estatísticas dos caches
     */
    logCacheStatistics() {
        
        for (const [type, cache] of this.caches) {
            const keys = cache.keys();
            const stats = cache.getStats();
            
        }
    }

    /**
     * Obtém estatísticas completas
     */
    getStatistics() {
        const stats = {
            memory: process.memoryUsage(),
            caches: {},
            isOptimizing: this.isOptimizing,
            compressionEnabled: this.compressionEnabled
        };

        for (const [type, cache] of this.caches) {
            stats.caches[type] = {
                keys: cache.keys().length,
                stats: cache.getStats()
            };
        }

        return stats;
    }

    /**
     * Configura parâmetros de otimização
     */
    configure(options = {}) {
        if (options.memoryThreshold !== undefined) {
            this.memoryThreshold = Math.max(0.5, Math.min(0.95, options.memoryThreshold));
        }
        
        if (options.cleanupInterval !== undefined) {
            this.cleanupInterval = Math.max(60000, options.cleanupInterval); // Mínimo 1 minuto
        }
        
        if (options.compressionEnabled !== undefined) {
            this.compressionEnabled = options.compressionEnabled;
        }

    }

    /**
     * Força limpeza de todos os caches
     */
    forceCleanup() {
        
        for (const [type, cache] of this.caches) {
            const keysCount = cache.keys().length;
            cache.flushAll();
        }

        if (global.gc) {
            global.gc();
        }

    }

    /**
     * Para o monitoramento (para shutdown gracioso)
     */
    stopMonitoring() {
        this.isOptimizing = false;
    }
}

export default OptimizedCacheManager;