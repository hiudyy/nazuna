import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo de banco de dados
const DB_PATH = path.join(__dirname, '../../database/userContext.json');

// Função para obter data/hora no fuso horário do Brasil (GMT-3)
function getBrazilDateTime() {
  const now = new Date();
  // Converter para horário do Brasil (UTC-3)
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return brazilTime.toISOString();
}

/**
 * Classe para gerenciar o contexto de usuários
 * Armazena informações importantes sobre cada usuário para personalizar conversas
 */
class UserContextDB {
  constructor() {
    this.data = this.loadDatabase();
    this.saveQueue = [];
    this.isSaving = false;
  }

  /**
   * Carrega o banco de dados do arquivo
   */
  loadDatabase() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const content = fs.readFileSync(DB_PATH, 'utf-8');
        if (content.trim()) {
          return JSON.parse(content);
        }
      }
      return {};
    } catch (error) {
      console.error('Erro ao carregar banco de contexto:', error);
      return {};
    }
  }

  /**
   * Salva o banco de dados no arquivo (com debounce)
   */
  async saveDatabase() {
    this.saveQueue.push(Date.now());
    
    if (this.isSaving) return;
    
    this.isSaving = true;
    
    // Aguarda 2 segundos para acumular várias alterações
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log('✅ Contexto de usuários salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar contexto de usuários:', error);
    }
    
    this.isSaving = false;
    this.saveQueue = [];
  }

  /**
   * Obtém o contexto completo de um usuário
   */
  getUserContext(userId) {
    if (!this.data[userId]) {
      this.data[userId] = this.createNewUserContext(userId);
      this.saveDatabase();
    }
    return this.data[userId];
  }

  /**
   * Cria um novo contexto para um usuário
   */
  createNewUserContext(userId) {
    return {
      userId,
      nome: null,
      apelidos: [],
      preferencias: {
        assuntos_favoritos: [],
        gostos: [],
        nao_gostos: [],
        hobbies: [],
        estilo_conversa: 'casual',
        usa_emojis: true,
        formal: false
      },
      informacoes_pessoais: {
        idade: null,
        localizacao: null,
        profissao: null,
        relacionamento: null,
        familia: []
      },
      historico_conversa: {
        total_mensagens: 0,
        primeira_conversa: getBrazilDateTime(),
        ultima_conversa: getBrazilDateTime(),
        frequencia_interacao: 'baixa',
        topicos_recentes: []
      },
      padroes_comportamento: {
        horarios_ativos: {},
        dias_semana_ativos: {},
        humor_comum: 'neutro',
        tipo_mensagens: {
          perguntas: 0,
          afirmacoes: 0,
          emocoes: 0,
          comandos: 0
        }
      },
      relacionamento_nazuna: {
        nivel_intimidade: 1,
        apelido_nazuna: null,
        memorias_especiais: [],
        conversas_marcantes: [],
        sentimento: 'neutro'
      },
      notas_importantes: [],
      ultima_atualizacao: getBrazilDateTime()
    };
  }

  /**
   * Atualiza informações básicas do usuário
   */
  updateUserInfo(userId, nome = null, apelido = null) {
    const context = this.getUserContext(userId);
    
    if (nome && nome !== context.nome) {
      context.nome = nome;
    }
    
    if (apelido && !context.apelidos.includes(apelido)) {
      context.apelidos.push(apelido);
      if (context.apelidos.length > 5) {
        context.apelidos = context.apelidos.slice(-5);
      }
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Adiciona uma preferência ou interesse do usuário
   */
  addUserPreference(userId, tipo, valor) {
    const context = this.getUserContext(userId);
    
    const tipos_validos = ['assuntos_favoritos', 'gostos', 'nao_gostos', 'hobbies'];
    
    if (!tipos_validos.includes(tipo)) {
      console.warn(`Tipo de preferência inválido: ${tipo}`);
      return;
    }
    
    if (!context.preferencias[tipo].includes(valor)) {
      context.preferencias[tipo].push(valor);
      
      // Manter apenas os 20 mais recentes
      if (context.preferencias[tipo].length > 20) {
        context.preferencias[tipo] = context.preferencias[tipo].slice(-20);
      }
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Atualiza informações pessoais do usuário
   */
  updatePersonalInfo(userId, campo, valor) {
    const context = this.getUserContext(userId);
    
    if (context.informacoes_pessoais.hasOwnProperty(campo)) {
      context.informacoes_pessoais[campo] = valor;
      context.ultima_atualizacao = getBrazilDateTime();
      this.saveDatabase();
    }
  }

  /**
   * Adiciona uma nota importante sobre o usuário
   */
  addImportantNote(userId, nota) {
    const context = this.getUserContext(userId);
    
    const novaNota = {
      texto: nota,
      data: getBrazilDateTime(),
      relevancia: 'alta'
    };
    
    context.notas_importantes.push(novaNota);
    
    // Manter apenas as 50 notas mais recentes
    if (context.notas_importantes.length > 50) {
      context.notas_importantes = context.notas_importantes.slice(-50);
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Registra uma interação do usuário
   */
  registerInteraction(userId, mensagem, tipo = 'afirmacao') {
    const context = this.getUserContext(userId);
    
    // Atualizar contadores
    context.historico_conversa.total_mensagens++;
    context.historico_conversa.ultima_conversa = getBrazilDateTime();
    
    // Atualizar tipo de mensagens
    if (context.padroes_comportamento.tipo_mensagens[tipo] !== undefined) {
      context.padroes_comportamento.tipo_mensagens[tipo]++;
    }
    
    // Atualizar horário de atividade
    const hora = new Date().getHours();
    context.padroes_comportamento.horarios_ativos[hora] = 
      (context.padroes_comportamento.horarios_ativos[hora] || 0) + 1;
    
    // Atualizar dia da semana
    const dia = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    context.padroes_comportamento.dias_semana_ativos[dia] = 
      (context.padroes_comportamento.dias_semana_ativos[dia] || 0) + 1;
    
    // Calcular frequência de interação
    const primeiraConversa = new Date(context.historico_conversa.primeira_conversa);
    const diasDesde = Math.floor((Date.now() - primeiraConversa.getTime()) / (1000 * 60 * 60 * 24));
    const msgPorDia = context.historico_conversa.total_mensagens / Math.max(diasDesde, 1);
    
    if (msgPorDia > 20) {
      context.historico_conversa.frequencia_interacao = 'muito_alta';
    } else if (msgPorDia > 10) {
      context.historico_conversa.frequencia_interacao = 'alta';
    } else if (msgPorDia > 5) {
      context.historico_conversa.frequencia_interacao = 'media';
    } else if (msgPorDia > 1) {
      context.historico_conversa.frequencia_interacao = 'baixa';
    } else {
      context.historico_conversa.frequencia_interacao = 'muito_baixa';
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Adiciona um tópico recente de conversa
   */
  addRecentTopic(userId, topico) {
    const context = this.getUserContext(userId);
    
    if (!context.historico_conversa.topicos_recentes.includes(topico)) {
      context.historico_conversa.topicos_recentes.push(topico);
      
      // Manter apenas os 10 tópicos mais recentes
      if (context.historico_conversa.topicos_recentes.length > 10) {
        context.historico_conversa.topicos_recentes = context.historico_conversa.topicos_recentes.slice(-10);
      }
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Atualiza o relacionamento com Nazuna
   */
  updateRelationship(userId, campo, valor) {
    const context = this.getUserContext(userId);
    
    if (context.relacionamento_nazuna.hasOwnProperty(campo)) {
      context.relacionamento_nazuna[campo] = valor;
      context.ultima_atualizacao = getBrazilDateTime();
      this.saveDatabase();
    }
  }

  /**
   * Adiciona uma memória especial
   */
  addSpecialMemory(userId, memoria) {
    const context = this.getUserContext(userId);
    
    const novaMemoria = {
      texto: memoria,
      data: getBrazilDateTime(),
      importancia: 'alta'
    };
    
    context.relacionamento_nazuna.memorias_especiais.push(novaMemoria);
    
    // Manter apenas as 30 memórias mais especiais
    if (context.relacionamento_nazuna.memorias_especiais.length > 30) {
      context.relacionamento_nazuna.memorias_especiais = 
        context.relacionamento_nazuna.memorias_especiais.slice(-30);
    }
    
    context.ultima_atualizacao = getBrazilDateTime();
    this.saveDatabase();
  }

  /**
   * Atualiza/edita uma informação existente do usuário
   */
  updateMemory(userId, tipo, valorAntigo, valorNovo) {
    const context = this.getUserContext(userId);
    let atualizado = false;
    
    const tipoNormalizado = tipo.toLowerCase().trim();
    
    switch (tipoNormalizado) {
      case 'gosto':
      case 'gostos':
        const indexGosto = context.preferencias.gostos.indexOf(valorAntigo);
        if (indexGosto !== -1) {
          context.preferencias.gostos[indexGosto] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'nao_gosto':
      case 'não_gosto':
      case 'nao_gostos':
        const indexNaoGosto = context.preferencias.nao_gostos.indexOf(valorAntigo);
        if (indexNaoGosto !== -1) {
          context.preferencias.nao_gostos[indexNaoGosto] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'hobby':
      case 'hobbies':
        const indexHobby = context.preferencias.hobbies.indexOf(valorAntigo);
        if (indexHobby !== -1) {
          context.preferencias.hobbies[indexHobby] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'assunto_favorito':
      case 'assuntos_favoritos':
        const indexAssunto = context.preferencias.assuntos_favoritos.indexOf(valorAntigo);
        if (indexAssunto !== -1) {
          context.preferencias.assuntos_favoritos[indexAssunto] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'nome':
        if (context.nome === valorAntigo) {
          context.nome = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'apelido':
      case 'apelidos':
        const indexApelido = context.apelidos.indexOf(valorAntigo);
        if (indexApelido !== -1) {
          context.apelidos[indexApelido] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'idade':
      case 'localizacao':
      case 'localização':
      case 'profissao':
      case 'profissão':
      case 'relacionamento':
        if (context.informacoes_pessoais[tipoNormalizado] === valorAntigo || 
            context.informacoes_pessoais[tipo] === valorAntigo) {
          const campo = context.informacoes_pessoais.hasOwnProperty(tipoNormalizado) ? 
                       tipoNormalizado : tipo;
          context.informacoes_pessoais[campo] = valorNovo;
          atualizado = true;
        }
        break;
        
      case 'nota_importante':
      case 'nota':
        const indexNota = context.notas_importantes.findIndex(n => n.texto === valorAntigo);
        if (indexNota !== -1) {
          context.notas_importantes[indexNota].texto = valorNovo;
          context.notas_importantes[indexNota].data = getBrazilDateTime();
          atualizado = true;
        }
        break;
        
      case 'memoria_especial':
      case 'memória':
        const indexMemoria = context.relacionamento_nazuna.memorias_especiais.findIndex(
          m => m.texto === valorAntigo
        );
        if (indexMemoria !== -1) {
          context.relacionamento_nazuna.memorias_especiais[indexMemoria].texto = valorNovo;
          context.relacionamento_nazuna.memorias_especiais[indexMemoria].data = getBrazilDateTime();
          atualizado = true;
        }
        break;
        
      default:
        // Tentar atualizar em outros campos personalizados
        if (context.informacoes_pessoais.outros && 
            context.informacoes_pessoais.outros[tipo] === valorAntigo) {
          context.informacoes_pessoais.outros[tipo] = valorNovo;
          atualizado = true;
        }
    }
    
    if (atualizado) {
      context.ultima_atualizacao = getBrazilDateTime();
      this.saveDatabase();
      return true;
    }
    
    return false;
  }

  /**
   * Remove/exclui uma informação do usuário
   */
  deleteMemory(userId, tipo, valor) {
    const context = this.getUserContext(userId);
    let removido = false;
    
    const tipoNormalizado = tipo.toLowerCase().trim();
    
    switch (tipoNormalizado) {
      case 'gosto':
      case 'gostos':
        const indexGosto = context.preferencias.gostos.indexOf(valor);
        if (indexGosto !== -1) {
          context.preferencias.gostos.splice(indexGosto, 1);
          removido = true;
        }
        break;
        
      case 'nao_gosto':
      case 'não_gosto':
      case 'nao_gostos':
        const indexNaoGosto = context.preferencias.nao_gostos.indexOf(valor);
        if (indexNaoGosto !== -1) {
          context.preferencias.nao_gostos.splice(indexNaoGosto, 1);
          removido = true;
        }
        break;
        
      case 'hobby':
      case 'hobbies':
        const indexHobby = context.preferencias.hobbies.indexOf(valor);
        if (indexHobby !== -1) {
          context.preferencias.hobbies.splice(indexHobby, 1);
          removido = true;
        }
        break;
        
      case 'assunto_favorito':
      case 'assuntos_favoritos':
        const indexAssunto = context.preferencias.assuntos_favoritos.indexOf(valor);
        if (indexAssunto !== -1) {
          context.preferencias.assuntos_favoritos.splice(indexAssunto, 1);
          removido = true;
        }
        break;
        
      case 'apelido':
      case 'apelidos':
        const indexApelido = context.apelidos.indexOf(valor);
        if (indexApelido !== -1) {
          context.apelidos.splice(indexApelido, 1);
          removido = true;
        }
        break;
        
      case 'idade':
      case 'localizacao':
      case 'localização':
      case 'profissao':
      case 'profissão':
      case 'relacionamento':
        const campo = context.informacoes_pessoais.hasOwnProperty(tipoNormalizado) ? 
                     tipoNormalizado : tipo;
        if (context.informacoes_pessoais[campo]) {
          context.informacoes_pessoais[campo] = null;
          removido = true;
        }
        break;
        
      case 'nome':
        if (context.nome) {
          context.nome = null;
          removido = true;
        }
        break;
        
      case 'nota_importante':
      case 'nota':
        const indexNota = context.notas_importantes.findIndex(n => n.texto === valor);
        if (indexNota !== -1) {
          context.notas_importantes.splice(indexNota, 1);
          removido = true;
        }
        break;
        
      case 'memoria_especial':
      case 'memória':
        const indexMemoria = context.relacionamento_nazuna.memorias_especiais.findIndex(
          m => m.texto === valor
        );
        if (indexMemoria !== -1) {
          context.relacionamento_nazuna.memorias_especiais.splice(indexMemoria, 1);
          removido = true;
        }
        break;
        
      default:
        // Tentar remover de campos personalizados
        if (context.informacoes_pessoais.outros && 
            context.informacoes_pessoais.outros[tipo]) {
          delete context.informacoes_pessoais.outros[tipo];
          removido = true;
        }
    }
    
    if (removido) {
      context.ultima_atualizacao = getBrazilDateTime();
      this.saveDatabase();
      return true;
    }
    
    return false;
  }

  /**
   * Obtém um resumo formatado do contexto do usuário
   */
  getUserContextSummary(userId) {
    const context = this.getUserContext(userId);
    
    const summary = {
      nome: context.nome || 'Desconhecido',
      apelidos: context.apelidos.join(', ') || 'Nenhum',
      gostos: context.preferencias.gostos.slice(-5).join(', ') || 'Não definido',
      nao_gostos: context.preferencias.nao_gostos.slice(-5).join(', ') || 'Não definido',
      hobbies: context.preferencias.hobbies.slice(-5).join(', ') || 'Não definido',
      assuntos_favoritos: context.preferencias.assuntos_favoritos.slice(-5).join(', ') || 'Não definido',
      total_conversas: context.historico_conversa.total_mensagens,
      frequencia: context.historico_conversa.frequencia_interacao,
      nivel_intimidade: context.relacionamento_nazuna.nivel_intimidade,
      topicos_recentes: context.historico_conversa.topicos_recentes.slice(-5).join(', ') || 'Nenhum',
      notas_importantes: context.notas_importantes.slice(-10).map(n => n.texto).join('\n- ') || 'Nenhuma',
      memorias_especiais: context.relacionamento_nazuna.memorias_especiais.slice(-5).map(m => m.texto).join('\n- ') || 'Nenhuma'
    };
    
    return summary;
  }

  /**
   * Limpa dados antigos (usuários inativos por mais de 90 dias)
   */
  cleanOldData(maxAge = 90 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;
    
    Object.keys(this.data).forEach(userId => {
      const context = this.data[userId];
      const lastUpdate = new Date(context.ultima_atualizacao).getTime();
      
      if (now - lastUpdate > maxAge) {
        delete this.data[userId];
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Limpou ${cleaned} contextos de usuários inativos`);
      this.saveDatabase();
    }
    
    return cleaned;
  }

  /**
   * Obtém estatísticas gerais do banco
   */
  getStats() {
    const totalUsers = Object.keys(this.data).length;
    const activeUsers = Object.values(this.data).filter(ctx => {
      const lastUpdate = new Date(ctx.ultima_atualizacao).getTime();
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return lastUpdate > dayAgo;
    }).length;
    
    const totalMessages = Object.values(this.data).reduce((sum, ctx) => 
      sum + ctx.historico_conversa.total_mensagens, 0);
    
    return {
      total_usuarios: totalUsers,
      usuarios_ativos_24h: activeUsers,
      total_mensagens: totalMessages,
      media_mensagens_por_usuario: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0
    };
  }
}

// Instância única (singleton)
const userContextDB = new UserContextDB();

export default userContextDB;
