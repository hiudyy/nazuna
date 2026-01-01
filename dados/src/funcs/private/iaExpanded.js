// --- COMANDOS DE IA EXPANDIDOS ---
// Horóscopo, Debate, História Interativa
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORIES_FILE = path.join(__dirname, '../../../database/stories.json');

// Signos do zodíaco
const SIGNOS = {
    aries: { emoji: '♈', nome: 'Áries', periodo: '21/03 - 19/04', elemento: '🔥 Fogo' },
    touro: { emoji: '♉', nome: 'Touro', periodo: '20/04 - 20/05', elemento: '🌍 Terra' },
    gemeos: { emoji: '♊', nome: 'Gêmeos', periodo: '21/05 - 20/06', elemento: '💨 Ar' },
    cancer: { emoji: '♋', nome: 'Câncer', periodo: '21/06 - 22/07', elemento: '💧 Água' },
    leao: { emoji: '♌', nome: 'Leão', periodo: '23/07 - 22/08', elemento: '🔥 Fogo' },
    virgem: { emoji: '♍', nome: 'Virgem', periodo: '23/08 - 22/09', elemento: '🌍 Terra' },
    libra: { emoji: '♎', nome: 'Libra', periodo: '23/09 - 22/10', elemento: '💨 Ar' },
    escorpiao: { emoji: '♏', nome: 'Escorpião', periodo: '23/10 - 21/11', elemento: '💧 Água' },
    sagitario: { emoji: '♐', nome: 'Sagitário', periodo: '22/11 - 21/12', elemento: '🔥 Fogo' },
    capricornio: { emoji: '♑', nome: 'Capricórnio', periodo: '22/12 - 19/01', elemento: '🌍 Terra' },
    aquario: { emoji: '♒', nome: 'Aquário', periodo: '20/01 - 18/02', elemento: '💨 Ar' },
    peixes: { emoji: '♓', nome: 'Peixes', periodo: '19/02 - 20/03', elemento: '💧 Água' }
};

// Aliases para signos
const SIGNO_ALIASES = {
    'áries': 'aries', 'aries': 'aries',
    'touro': 'touro',
    'gêmeos': 'gemeos', 'gemeos': 'gemeos',
    'câncer': 'cancer', 'cancer': 'cancer',
    'leão': 'leao', 'leao': 'leao',
    'virgem': 'virgem',
    'libra': 'libra',
    'escorpião': 'escorpiao', 'escorpiao': 'escorpiao',
    'sagitário': 'sagitario', 'sagitario': 'sagitario',
    'capricórnio': 'capricornio', 'capricornio': 'capricornio',
    'aquário': 'aquario', 'aquario': 'aquario',
    'peixes': 'peixes'
};

// --- HORÓSCOPO ---

const getHoroscopePrompt = (signo) => {
    const signoData = SIGNOS[signo];
    const today = new Date().toLocaleDateString('pt-BR');
    
    return `Você é um astrólogo místico e carismático. Gere um horóscopo diário para o signo de ${signoData.nome} (${signoData.emoji}) para o dia ${today}.

O horóscopo deve incluir:
1. Uma previsão geral para o dia (2-3 frases)
2. Amor e relacionamentos (1-2 frases)
3. Trabalho e finanças (1-2 frases)
4. Saúde e bem-estar (1 frase)
5. Um conselho do dia
6. Números da sorte (3 números entre 1-60)
7. Cor da sorte

Seja místico mas otimista. Use uma linguagem envolvente e poética.
Formato esperado (mantenha os emojis):

🌟 *PREVISÃO GERAL*
[previsão]

❤️ *AMOR*
[amor]

💼 *TRABALHO*
[trabalho]

🧘 *SAÚDE*
[saúde]

💡 *CONSELHO*
[conselho]

🔢 *NÚMEROS:* [n1], [n2], [n3]
🎨 *COR:* [cor]`;
};

const generateHoroscope = async (signoInput, aiFunction, prefix = '/') => {
    const signoKey = SIGNO_ALIASES[signoInput.toLowerCase()];
    
    if (!signoKey) {
        const listaSignos = Object.values(SIGNOS).map(s => `${s.emoji} ${s.nome}`).join('\n');
        return {
            success: false,
            message: `❌ Signo inválido!\n\n🔮 *SIGNOS DISPONÍVEIS:*\n${listaSignos}\n\n💡 Uso: ${prefix}horoscopo <signo>`
        };
    }
    
    const signo = SIGNOS[signoKey];
    
    if (!aiFunction) {
        return {
            success: false,
            message: '❌ Função de IA não disponível!'
        };
    }
    
    try {
        const prompt = getHoroscopePrompt(signoKey);
        const response = await aiFunction(prompt);
        
        const today = new Date().toLocaleDateString('pt-BR');
        const header = `${signo.emoji} *HORÓSCOPO DE ${signo.nome.toUpperCase()}*\n` +
                       `📅 ${today} | ${signo.elemento}\n` +
                       `━━━━━━━━━━━━━━━━━━\n\n`;
        
        return {
            success: true,
            message: header + response
        };
    } catch (err) {
        console.error('[HOROSCOPO] Erro:', err.message);
        return {
            success: false,
            message: '❌ Erro ao gerar horóscopo. Tente novamente!'
        };
    }
};

// --- DEBATE ---

const getDebatePrompt = (tema) => {
    return `Você é um debatedor intelectual imparcial. Apresente um debate completo sobre o tema: "${tema}"

Estruture assim:

⚔️ *DEBATE: ${tema.toUpperCase()}*
━━━━━━━━━━━━━━━━━━

👍 *ARGUMENTOS A FAVOR:*
1. [argumento forte com explicação breve]
2. [argumento forte com explicação breve]
3. [argumento forte com explicação breve]

👎 *ARGUMENTOS CONTRA:*
1. [argumento forte com explicação breve]
2. [argumento forte com explicação breve]
3. [argumento forte com explicação breve]

📊 *DADOS E FATOS:*
• [fato relevante 1]
• [fato relevante 2]

🤔 *CONCLUSÃO:*
[Uma conclusão equilibrada que apresente ambos os lados sem tomar partido]

💭 *REFLEXÃO:*
[Uma pergunta para o leitor refletir]

Seja objetivo, use dados quando possível, e mantenha imparcialidade. Evite temas muito polêmicos de forma radical.`;
};

const generateDebate = async (tema, aiFunction, prefix = '/') => {
    if (!tema || tema.trim().length < 3) {
        return {
            success: false,
            message: `❌ Por favor, forneça um tema para o debate!\n\n💡 Uso: ${prefix}debater <tema>\n📌 Exemplo: ${prefix}debater redes sociais`
        };
    }
    
    if (!aiFunction) {
        return {
            success: false,
            message: '❌ Função de IA não disponível!'
        };
    }
    
    try {
        const prompt = getDebatePrompt(tema);
        const response = await aiFunction(prompt);
        
        return {
            success: true,
            message: response
        };
    } catch (err) {
        console.error('[DEBATE] Erro:', err.message);
        return {
            success: false,
            message: '❌ Erro ao gerar debate. Tente novamente!'
        };
    }
};

// --- HISTÓRIA INTERATIVA ---

const loadStories = () => {
    try {
        if (fs.existsSync(STORIES_FILE)) {
            return JSON.parse(fs.readFileSync(STORIES_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[STORIES] Erro ao carregar:', err.message);
    }
    return { active: {}, completed: [] };
};

const saveStories = (data) => {
    try {
        const dir = path.dirname(STORIES_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STORIES_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[STORIES] Erro ao salvar:', err.message);
    }
};

const STORY_GENRES = {
    fantasia: { emoji: '🧙', name: 'Fantasia', desc: 'Magia, dragões e reinos encantados' },
    terror: { emoji: '👻', name: 'Terror', desc: 'Suspense e horror' },
    romance: { emoji: '💕', name: 'Romance', desc: 'Amor e relacionamentos' },
    aventura: { emoji: '⚔️', name: 'Aventura', desc: 'Ação e exploração' },
    ficcao: { emoji: '🚀', name: 'Ficção Científica', desc: 'Futuro e tecnologia' },
    misterio: { emoji: '🔍', name: 'Mistério', desc: 'Enigmas e investigação' }
};

const getStoryPrompt = (genre, previousChoices = [], currentChapter = 1) => {
    const genreData = STORY_GENRES[genre];
    const isFirst = previousChoices.length === 0;
    
    if (isFirst) {
        return `Você é um mestre contador de histórias. Crie o INÍCIO de uma história interativa do gênero ${genreData.name} (${genreData.desc}).

A história deve:
1. Apresentar o cenário e personagem principal de forma envolvente
2. Criar uma situação que exige uma decisão
3. Terminar com exatamente 3 opções de escolha para o leitor

Formato:
📖 *CAPÍTULO 1*
━━━━━━━━━━━━━━━━━━

[Narrativa do início da história - 3-4 parágrafos]

━━━━━━━━━━━━━━━━━━
🎭 *O QUE VOCÊ FAZ?*

1️⃣ [Primeira opção]
2️⃣ [Segunda opção]
3️⃣ [Terceira opção]

_Responda com o número da sua escolha!_`;
    }
    
    const choicesText = previousChoices.map((c, i) => `Capítulo ${i + 1}: Escolha ${c}`).join('\n');
    
    return `Você é um mestre contador de histórias continuando uma história interativa do gênero ${genreData.name}.

Escolhas anteriores do leitor:
${choicesText}

Continue a história com base na última escolha (${previousChoices[previousChoices.length - 1]}).

${currentChapter >= 5 ? 'Este é o capítulo FINAL. Conclua a história de forma satisfatória, sem novas escolhas.' : 'Crie uma continuação emocionante com 3 novas opções de escolha.'}

Formato:
📖 *CAPÍTULO ${currentChapter}*
━━━━━━━━━━━━━━━━━━

[Continuação da história - 2-3 parágrafos]

${currentChapter >= 5 ? '🏆 *FIM*\n\n[Conclusão da história]' : `━━━━━━━━━━━━━━━━━━
🎭 *O QUE VOCÊ FAZ?*

1️⃣ [Primeira opção]
2️⃣ [Segunda opção]
3️⃣ [Terceira opção]

_Responda com o número da sua escolha!_`}`;
};

const startStory = async (groupId, genre, aiFunction, prefix = '/') => {
    const genreKey = genre.toLowerCase();
    
    if (!STORY_GENRES[genreKey]) {
        const genres = Object.entries(STORY_GENRES)
            .map(([key, g]) => `${g.emoji} *${g.name}* - ${g.desc}`)
            .join('\n');
        return {
            success: false,
            message: `📚 *HISTÓRIA INTERATIVA*\n\n❌ Gênero inválido!\n\n🎭 *Gêneros disponíveis:*\n${genres}\n\n💡 Uso: ${prefix}historia <gênero>`
        };
    }
    
    const data = loadStories();
    
    if (data.active[groupId]) {
        return {
            success: false,
            message: `📚 *HISTÓRIA INTERATIVA*\n\n⚠️ Já existe uma história em andamento!\n\n💡 Use /historia escolher <1-3> para continuar\n💡 Use /historia cancelar para encerrar`
        };
    }
    
    if (!aiFunction) {
        return { success: false, message: '❌ Função de IA não disponível!' };
    }
    
    try {
        const prompt = getStoryPrompt(genreKey);
        const response = await aiFunction(prompt);
        
        data.active[groupId] = {
            genre: genreKey,
            chapter: 1,
            choices: [],
            startedAt: new Date().toISOString(),
            lastUpdate: Date.now()
        };
        saveStories(data);
        
        const genreData = STORY_GENRES[genreKey];
        const header = `${genreData.emoji} *HISTÓRIA INTERATIVA - ${genreData.name.toUpperCase()}*\n\n`;
        
        return {
            success: true,
            message: header + response
        };
    } catch (err) {
        console.error('[STORIES] Erro:', err.message);
        return { success: false, message: '❌ Erro ao iniciar história. Tente novamente!' };
    }
};

const continueStory = async (groupId, choice, aiFunction) => {
    const data = loadStories();
    const story = data.active[groupId];
    
    if (!story) {
        return {
            success: false,
            message: `📚 *HISTÓRIA INTERATIVA*\n\n❌ Nenhuma história em andamento!\n\n💡 Use /historia <gênero> para começar`
        };
    }
    
    const choiceNum = parseInt(choice);
    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > 3) {
        return {
            success: false,
            message: '❌ Escolha inválida! Use 1, 2 ou 3.'
        };
    }
    
    if (!aiFunction) {
        return { success: false, message: '❌ Função de IA não disponível!' };
    }
    
    try {
        story.choices.push(choiceNum);
        story.chapter++;
        story.lastUpdate = Date.now();
        
        const prompt = getStoryPrompt(story.genre, story.choices, story.chapter);
        const response = await aiFunction(prompt);
        
        // Verificar se é o fim
        if (story.chapter >= 5) {
            data.completed.push({
                ...story,
                completedAt: new Date().toISOString()
            });
            delete data.active[groupId];
        }
        
        saveStories(data);
        
        const genreData = STORY_GENRES[story.genre];
        const header = `${genreData.emoji} *HISTÓRIA INTERATIVA - ${genreData.name.toUpperCase()}*\n\n`;
        
        return {
            success: true,
            message: header + response,
            finished: story.chapter >= 5
        };
    } catch (err) {
        console.error('[STORIES] Erro:', err.message);
        return { success: false, message: '❌ Erro ao continuar história. Tente novamente!' };
    }
};

const cancelStory = (groupId) => {
    const data = loadStories();
    
    if (!data.active[groupId]) {
        return {
            success: false,
            message: '❌ Nenhuma história em andamento!'
        };
    }
    
    delete data.active[groupId];
    saveStories(data);
    
    return {
        success: true,
        message: '📚 História cancelada!'
    };
};

const getStoryStatus = (groupId) => {
    const data = loadStories();
    const story = data.active[groupId];
    
    if (!story) {
        const genres = Object.entries(STORY_GENRES)
            .map(([key, g]) => `${g.emoji} ${g.name}`)
            .join(' | ');
        return {
            success: true,
            active: false,
            message: `📚 *HISTÓRIA INTERATIVA*\n\n❌ Nenhuma história ativa.\n\n🎭 Gêneros: ${genres}\n\n💡 Use /historia <gênero> para começar!`
        };
    }
    
    const genreData = STORY_GENRES[story.genre];
    return {
        success: true,
        active: true,
        message: `📚 *HISTÓRIA INTERATIVA*\n\n` +
                 `${genreData.emoji} Gênero: ${genreData.name}\n` +
                 `📖 Capítulo: ${story.chapter}/5\n` +
                 `🎭 Escolhas: ${story.choices.join(' → ') || 'Nenhuma ainda'}\n\n` +
                 `💡 Use /historia escolher <1-3> para continuar`
    };
};

export {
    SIGNOS,
    SIGNO_ALIASES,
    STORY_GENRES,
    generateHoroscope,
    generateDebate,
    startStory,
    continueStory,
    cancelStory,
    getStoryStatus
};

export default {
    SIGNOS,
    STORY_GENRES,
    generateHoroscope,
    generateDebate,
    startStory,
    continueStory,
    cancelStory,
    getStoryStatus
};
