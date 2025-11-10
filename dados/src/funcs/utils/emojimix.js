import axios from 'axios';

// --- CONFIGURAÇÃO ---
const CONFIG = {
    API: {
        BASE_URL: 'https://tenor.googleapis.com/v2',
        KEY: "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ",
        DEFAULT_PARAMS: {
            contentfilter: 'high',
            media_filter: 'png_transparent',
            component: 'proactive',
            collection: 'emoji_kitchen_v5',
        },
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY_MS: 1000,
    },
};

// --- ERRO CUSTOMIZADO ---
class EmojiMixError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EmojiMixError';
    }
}

// --- CLASSE DO CLIENTE ---
class TenorClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new EmojiMixError('Chave da API Tenor não configurada. Verifique suas variáveis de ambiente.');
        }

        // Cria uma instância do Axios com configurações padrão
        this.api = axios.create({
            baseURL: CONFIG.API.BASE_URL,
            params: {
                key: apiKey,
                ...CONFIG.API.DEFAULT_PARAMS,
            },
        });
    }

    /**
     * Busca a mistura de emojis com lógica de retentativa.
     * @param {string} emoji1 Primeiro emoji.
     * @param {string} emoji2 Segundo emoji.
     * @returns {Promise<string[]>} Uma lista de URLs de imagens.
     */
    async fetchMix(emoji1, emoji2) {
        const query = `${emoji1}_${emoji2}`;
        
        // Lógica de retentativa usando um loop, que é mais escalável que recursão
        for (let attempt = 1; attempt <= CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
            try {
                const response = await this.api.get('/featured', {
                    params: { q: query },
                });

                if (!response.data?.results?.length) {
                    throw new EmojiMixError('Combinação de emojis não disponível.');
                }
                
                return response.data.results.map(result => result.url);
            } catch (error) {
                // Tenta novamente apenas se for erro de 'Too Many Requests' e ainda houver tentativas
                if (error.response?.status === 429 && attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
                    console.warn(`[EmojiMix] Rate limit atingido. Tentando novamente em ${attempt}s...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY_MS * attempt));
                } else {
                    // Se for outro erro ou a última tentativa, lança o erro final
                    throw new EmojiMixError(`Erro ao buscar emojis: ${error.message}`);
                }
            }
        }
    }
}

// --- FUNÇÃO PÚBLICA ---
// Cria uma única instância do cliente (padrão Singleton) para ser usada pela função
const client = new TenorClient(CONFIG.API.KEY);

/**
 * Retorna a URL de uma mistura aleatória de dois emojis.
 * @param {string} emoji1 Primeiro emoji.
 * @param {string} emoji2 Segundo emoji.
 * @returns {Promise<string>} A URL da imagem do emoji misturado.
 */
async function emojiMix(emoji1, emoji2) {
    try {
        const urls = await client.fetchMix(emoji1, emoji2);
        // Retorna um elemento aleatório do array de URLs
        return urls[Math.floor(Math.random() * urls.length)];
    } catch (error) {
        console.error(`[Erro Final] ${error.message}`);
        // Re-lança o erro para que a aplicação que chamou a função possa tratá-lo
        throw error;
    }
}

export default emojiMix;