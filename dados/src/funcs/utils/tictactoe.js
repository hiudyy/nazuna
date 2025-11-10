// --- CONFIGURAÇÃO ---
const CONFIG = {
    INVITATION_TIMEOUT_MS: 15 * 60 * 1000,
    GAME_TIMEOUT_MS: 30 * 60 * 1000,
    MOVE_TIMEOUT_MS: 5 * 60 * 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    BOARD_SIZE: 9,
    SYMBOLS: { X: '❌', O: '⭕' },
    EMPTY_CELLS: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
};

// Função helper para extrair nome de usuário
const getUserName = (userId) => {
  if (!userId || typeof userId !== 'string') return 'unknown';
  if (userId.includes('@lid')) {
    return userId.split('@')[0];
  } else if (userId.includes('@s.whatsapp.net')) {
    return userId.split('@')[0];
  }
  return userId.split('@')[0] || userId;
};

// --- LÓGICA DO JOGO (MOTOR) ---
class TicTacToe {
    constructor(player1, player2) {
        this.board = [...CONFIG.EMPTY_CELLS];
        this.players = { X: player1, O: player2 };
        this.currentTurn = 'X';
        this.moves = 0;
        this.startTime = Date.now();
        this.lastMoveTime = Date.now();
        this.winner = null;
    }

    makeMove(player, position) {
        if (player !== this.players[this.currentTurn]) {
            return { success: false, reason: 'not_your_turn' };
        }
        const index = parseInt(position) - 1;
        if (isNaN(index) || index < 0 || index >= CONFIG.BOARD_SIZE) {
            return { success: false, reason: 'invalid_position' };
        }
        if (!CONFIG.EMPTY_CELLS.includes(this.board[index])) {
            return { success: false, reason: 'position_taken' };
        }

        this.board[index] = CONFIG.SYMBOLS[this.currentTurn];
        this.moves++;
        this.lastMoveTime = Date.now();

        if (this._checkWin()) {
            this.winner = this.players[this.currentTurn];
            return { success: true, status: 'win', winner: this.winner };
        }
        if (this.moves === CONFIG.BOARD_SIZE) {
            return { success: true, status: 'draw' };
        }

        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        return { success: true, status: 'continue', nextPlayer: this.players[this.currentTurn] };
    }

    renderBoard() {
        return `${this.board[0]}  ${this.board[1]}  ${this.board[2]}\n` +
               `${this.board[3]}  ${this.board[4]}  ${this.board[5]}\n` +
               `${this.board[6]}  ${this.board[7]}  ${this.board[8]}`;
    }

    _checkWin() {
        const patterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        const symbol = CONFIG.SYMBOLS[this.currentTurn];
        return patterns.some(p => p.every(i => this.board[i] === symbol));
    }
}


// --- GERENCIADOR DE JOGOS (CONTROLADOR) ---
class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.pendingInvitations = new Map();
        setInterval(() => this._cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    invitePlayer(groupId, inviter, invitee) {
        if (!groupId || !inviter || !invitee || inviter === invitee) {
            return this._formatResponse(false, '❌ Dados inválidos para o convite');
        }
        if (this.activeGames.has(groupId) || this.pendingInvitations.has(groupId)) {
            return this._formatResponse(false, '❌ Já existe um jogo ou convite em andamento!');
        }
        
        this.pendingInvitations.set(groupId, { inviter, invitee, timestamp: Date.now() });
        const message = `🎮 *CONVITE JOGO DA VELHA*\n\n` +
                        `@${getUserName(inviter)} convidou @${getUserName(invitee)}!\n\n` +
                        `✅ Aceitar: "sim", "s"\n` +
                        `❌ Recusar: "não", "n"\n\n` +
                        `⏳ Expira em 15 minutos.`;
        return this._formatResponse(true, message, { mentions: [inviter, invitee] });
    }

    processInvitationResponse(groupId, invitee, response) {
        const invitation = this.pendingInvitations.get(groupId);
        if (!invitation || invitation.invitee !== invitee) {
            return this._formatResponse(false, '❌ Nenhum convite pendente para você.');
        }

        const normalizedResponse = response.toLowerCase().trim();
        const isAccepted = ['s', 'sim', 'y', 'yes'].includes(normalizedResponse);
        const isRejected = ['n', 'não', 'nao', 'no'].includes(normalizedResponse);
        
        if (!isAccepted && !isRejected) {
            return this._formatResponse(false, '❌ Resposta inválida. Use "sim" ou "não".');
        }

        this.pendingInvitations.delete(groupId);

        if (isRejected) {
            return this._formatResponse(true, '❌ Convite recusado. Jogo cancelado.', { mentions: [invitation.inviter, invitee] });
        }

        const game = new TicTacToe(invitation.inviter, invitation.invitee);
        this.activeGames.set(groupId, game);
        
        const message = `🎮 *JOGO DA VELHA - INICIADO!*\n\n` +
                        `👥 Jogadores:\n` +
                        `➤ ${CONFIG.SYMBOLS.X}: @${getUserName(invitation.inviter)}\n` +
                        `➤ ${CONFIG.SYMBOLS.O}: @${getUserName(invitation.invitee)}\n\n` +
                        `${game.renderBoard()}\n\n` +
                        `💡 Vez de @${getUserName(invitation.inviter)} (1-9).`;
        return this._formatResponse(true, message, { mentions: [invitation.inviter, invitee] });
    }

    makeMove(groupId, player, position) {
        const game = this.activeGames.get(groupId);
        if (!game) {
            return this._formatResponse(false, '❌ Nenhum jogo em andamento!');
        }

        // Verificação de timeout de inatividade
        if (Date.now() - game.lastMoveTime > CONFIG.MOVE_TIMEOUT_MS) {
            this.activeGames.delete(groupId);
            return this._formatResponse(false, '❌ Jogo encerrado por inatividade (5 minutos sem jogada).', { mentions: Object.values(game.players) });
        }
        
        const result = game.makeMove(player, position);

        if (!result.success) {
            const errorMessages = {
                'not_your_turn': '❌ Não é sua vez!',
                'invalid_position': '❌ Posição inválida! Use 1-9.',
                'position_taken': '❌ Posição já ocupada!'
            };
            return this._formatResponse(false, errorMessages[result.reason] || '❌ Erro desconhecido.');
        }

        if (result.status === 'win') {
            this.activeGames.delete(groupId);
            const message = `🎮 *JOGO DA VELHA - FIM*\n\n` +
                            `🎉 @${result.winner.split('@')[0]} venceu! 🏆\n\n` +
                            `${game.renderBoard()}`;
            return this._formatResponse(true, message, { finished: true, winner: result.winner, mentions: [result.winner] });
        }

        if (result.status === 'draw') {
            this.activeGames.delete(groupId);
            const message = `🎮 *JOGO DA VELHA - FIM*\n\n` +
                            `🤝 Empate!\n\n` +
                            `${game.renderBoard()}`;
            return this._formatResponse(true, message, { finished: true, draw: true, mentions: Object.values(game.players) });
        }

        if (result.status === 'continue') {
            const message = `🎮 *JOGO DA VELHA*\n\n` +
                            `👉 Vez de @${getUserName(result.nextPlayer)}\n\n` +
                            `${game.renderBoard()}\n\n` +
                            `💡 Digite um número de 1 a 9.`;
            return this._formatResponse(true, message, { finished: false, mentions: [result.nextPlayer] });
        }
    }

    endGame(groupId) {
        if (!this.activeGames.has(groupId)) {
            return this._formatResponse(false, '❌ Nenhum jogo em andamento!');
        }
        const players = Object.values(this.activeGames.get(groupId).players);
        this.activeGames.delete(groupId);
        return this._formatResponse(true, '🎮 Jogo encerrado manualmente!', { mentions: players });
    }
    
    hasActiveGame = (groupId) => this.activeGames.has(groupId);
    hasPendingInvitation = (groupId) => this.pendingInvitations.has(groupId);
    
    _formatResponse(success, message, extras = {}) {
        return { success, message, ...extras };
    }

    _cleanup() {
        const now = Date.now();
        for (const [groupId, game] of this.activeGames.entries()) {
            if (now - game.startTime > CONFIG.GAME_TIMEOUT_MS) {
                this.activeGames.delete(groupId);
                console.log(`[TTT Cleanup] Jogo expirado removido do grupo ${groupId}`);
            }
        }
        for (const [groupId, invitation] of this.pendingInvitations.entries()) {
            if (now - invitation.timestamp > CONFIG.INVITATION_TIMEOUT_MS) {
                this.pendingInvitations.delete(groupId);
                console.log(`[TTT Cleanup] Convite expirado removido do grupo ${groupId}`);
            }
        }
    }
}

// --- EXPORTAÇÃO DIRETA DAS FUNÇÕES ---
const manager = new GameManager();

const invitePlayer = (...args) => manager.invitePlayer(...args);
const processInvitationResponse = (...args) => manager.processInvitationResponse(...args);
const makeMove = (...args) => manager.makeMove(...args);
const endGame = (...args) => manager.endGame(...args);
const hasActiveGame = (...args) => manager.hasActiveGame(...args);
const hasPendingInvitation = (...args) => manager.hasPendingInvitation(...args);

export {
  invitePlayer,
  processInvitationResponse,
  makeMove,
  endGame,
  hasActiveGame,
  hasPendingInvitation
};