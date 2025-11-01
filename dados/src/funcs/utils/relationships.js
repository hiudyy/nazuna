const { loadRelationships, saveRelationships } = require('../../utils/database');
const { getUserName, normalizar } = require('../../utils/helpers');

const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
const MARRIAGE_REQUIRED_MS = 48 * 60 * 60 * 1000;

const STATUS_ORDER = {
  brincadeira: 1,
  namoro: 2,
  casamento: 3
};

const TYPE_CONFIG = {
  brincadeira: {
    label: 'Brincadeira',
    emoji: '🎈',
    inviteLabel: 'uma brincadeira',
    successHeadline: '🎈 Pedido aceito!',
    successText: 'agora estão em uma brincadeira!'
  },
  namoro: {
    label: 'Namoro',
    emoji: '💞',
    inviteLabel: 'um namoro',
    successHeadline: '💞 Pedido aceito!',
    successText: 'agora estão namorando!'
  },
  casamento: {
    label: 'Casamento',
    emoji: '💍',
    inviteLabel: 'um casamento',
    successHeadline: '💍 Pedido aceito!',
    successText: 'agora estão oficialmente casados!'
  }
};

class RelationshipManager {
  constructor() {
    this.pendingRequests = new Map();
    const timer = setInterval(() => this._cleanup(), 60 * 1000);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  _normalizeId(id) {
    return typeof id === 'string' ? id.trim().toLowerCase() : '';
  }

  _normalizeType(type) {
    const normalized = normalizar(type || '');
    return ['brincadeira', 'namoro', 'casamento'].includes(normalized) ? normalized : null;
  }

  _getPairKey(a, b) {
    const first = this._normalizeId(a);
    const second = this._normalizeId(b);
    if (!first || !second || first === second) return null;
    return [first, second].sort().join('::');
  }

  _loadData() {
    const data = loadRelationships();
    if (!data || typeof data !== 'object') {
      return { pairs: {} };
    }
    if (!data.pairs || typeof data.pairs !== 'object') {
      data.pairs = {};
    }
    return data;
  }

  _saveData(data) {
    return saveRelationships(data);
  }

  _formatDuration(milliseconds) {
    if (!milliseconds || milliseconds <= 0) return '0s';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (!parts.length) parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  _formatDate(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }

  hasPendingRequest(groupId) {
    return this.pendingRequests.has(groupId);
  }

  createRequest(type, groupId, requesterId, targetId, context = {}) {
    const normalizedType = this._normalizeType(type);
    if (!normalizedType) {
      return { success: false, message: 'Tipo de pedido inválido.' };
    }

    const requester = this._normalizeId(requesterId);
    const target = this._normalizeId(targetId);
    if (!requester || !target) {
      return { success: false, message: 'Participantes inválidos.' };
    }
    if (requester === target) {
      return { success: false, message: 'Você não pode enviar um pedido para você mesmo.' };
    }

    if (this.pendingRequests.has(groupId)) {
      const pending = this.pendingRequests.get(groupId);
      const config = TYPE_CONFIG[pending.type];
      return {
        success: false,
        message: `Já existe um pedido de ${config?.label?.toLowerCase() || 'relacionamento'} aguardando resposta neste grupo.`
      };
    }

    const pairKey = this._getPairKey(requesterId, targetId);
    if (!pairKey) {
      return { success: false, message: 'Não foi possível registrar o pedido.' };
    }

    const data = this._loadData();
    const existingPair = data.pairs[pairKey];
    const validation = this._validateNewRequest(normalizedType, existingPair);
    if (!validation.allowed) {
      return { success: false, message: validation.message };
    }

    const now = Date.now();
    const request = {
      id: `${groupId}:${now}`,
      type: normalizedType,
      groupId,
      requester,
      target,
      requesterRaw: requesterId,
      targetRaw: targetId,
      createdAt: now,
      expiresAt: now + REQUEST_TIMEOUT_MS,
      context
    };

    this.pendingRequests.set(groupId, request);

    return {
      success: true,
      message: this._buildInvitationMessage(request),
      mentions: [requesterId, targetId],
      request
    };
  }

  _validateNewRequest(type, pair) {
    if (!pair) {
      if (type === 'casamento') {
        return {
          allowed: false,
          message: 'Vocês precisam estar namorando para casar.'
        };
      }
      return { allowed: true };
    }

    const currentStatus = pair.status;

    if (type === 'brincadeira') {
      if (currentStatus === 'brincadeira') {
        const since = pair.stages?.brincadeira?.since;
        const dateText = since ? this._formatDate(since) : 'recentemente';
        return {
          allowed: false,
          message: `Vocês já estão em brincadeira desde ${dateText}.`
        };
      }
      if (currentStatus === 'namoro') {
        return {
          allowed: false,
          message: 'Vocês já estão namorando.'
        };
      }
      if (currentStatus === 'casamento') {
        return {
          allowed: false,
          message: 'Vocês já são casados.'
        };
      }
      return { allowed: true };
    }

    if (type === 'namoro') {
      if (currentStatus === 'namoro') {
        return {
          allowed: false,
          message: 'Vocês já estão namorando.'
        };
      }
      if (currentStatus === 'casamento') {
        return {
          allowed: false,
          message: 'Vocês já são casados.'
        };
      }
      return { allowed: true };
    }

    if (type === 'casamento') {
      if (currentStatus === 'casamento') {
        return {
          allowed: false,
          message: 'Vocês já são casados.'
        };
      }
      const since = pair.stages?.namoro?.since;
      if (!since) {
        return {
          allowed: false,
          message: 'Vocês precisam estar namorando para casar.'
        };
      }
      const sinceTime = Date.parse(since);
      if (Number.isNaN(sinceTime)) {
        return {
          allowed: false,
          message: 'Não foi possível validar a data do namoro. Reinicie o namoro antes de casar.'
        };
      }
      const elapsed = Date.now() - sinceTime;
      if (elapsed < MARRIAGE_REQUIRED_MS) {
        return {
          allowed: false,
          message: `Vocês precisam namorar por mais ${this._formatDuration(MARRIAGE_REQUIRED_MS - elapsed)} antes de casar.`
        };
      }
      return { allowed: true };
    }

    return {
      allowed: false,
      message: 'Tipo de pedido inválido.'
    };
  }

  _buildInvitationMessage(request) {
    const config = TYPE_CONFIG[request.type];
    const requesterName = getUserName(request.requesterRaw);
    const targetName = getUserName(request.targetRaw);
    return `${config.emoji} *PEDIDO DE ${config.label.toUpperCase()}*

@${requesterName} convidou @${targetName} para ${config.inviteLabel}!

✅ Aceitar: "sim"
❌ Recusar: "não"

⏳ Expira em ${this._formatDuration(REQUEST_TIMEOUT_MS)}.`;
  }

  processResponse(groupId, responderId, rawResponse) {
    const pending = this.pendingRequests.get(groupId);
    if (!pending) return null;

    const responder = this._normalizeId(responderId);
    if (responder !== pending.target) {
      return { success: false, reason: 'not_target' };
    }

    const decision = this._normalizeDecision(rawResponse);
    if (!decision) {
      return {
        success: false,
        reason: 'invalid_response',
        message: '❌ Resposta inválida. Use "sim" para aceitar ou "não" para recusar.'
      };
    }

    this.pendingRequests.delete(groupId);

    if (decision === 'reject') {
      const config = TYPE_CONFIG[pending.type];
      const requesterName = getUserName(pending.requesterRaw);
      const targetName = getUserName(pending.targetRaw);
      return {
        success: true,
        message: `${config.emoji} Pedido de ${config.label.toLowerCase()} recusado.

@${targetName} não aceitou o pedido de @${requesterName}.`,
        mentions: [pending.requesterRaw, pending.targetRaw]
      };
    }

    return this._applyRequest(pending);
  }

  _normalizeDecision(rawResponse) {
    const normalized = normalizar((rawResponse || '').trim());
    if (!normalized) return null;
    const firstWord = normalized.split(/\s+/)[0];
    if (['s', 'sim', 'aceito', 'aceitar', 'yes', 'y', 'claro'].includes(firstWord)) {
      return 'accept';
    }
    if (['n', 'nao', 'não', 'no', 'recuso', 'recusar', 'rejeito', 'rejeitar'].includes(firstWord)) {
      return 'reject';
    }
    return null;
  }

  _applyRequest(request) {
    const data = this._loadData();
    const key = this._getPairKey(request.requesterRaw, request.targetRaw);
    if (!key) {
      return {
        success: false,
        message: '❌ Não consegui registrar o relacionamento. Tente novamente.'
      };
    }

    const now = Date.now();
    let pair = data.pairs[key];
    if (!pair || typeof pair !== 'object') {
      pair = {
        users: [this._normalizeId(request.requesterRaw), this._normalizeId(request.targetRaw)],
        status: null,
        stages: {},
        history: [],
        createdAt: new Date(now).toISOString()
      };
    }

    if (!Array.isArray(pair.history)) {
      pair.history = [];
    }

    if (!pair.stages || typeof pair.stages !== 'object') {
      pair.stages = {};
    }

    const stageEntry = {
      since: new Date(now).toISOString(),
      requestedBy: request.requesterRaw,
      acceptedBy: request.targetRaw,
      groupId: request.groupId,
      requestedAt: new Date(request.createdAt).toISOString(),
      acceptedAt: new Date(now).toISOString()
    };

    pair.history.push({
      type: request.type,
      requestedBy: request.requesterRaw,
      acceptedBy: request.targetRaw,
      requestedAt: stageEntry.requestedAt,
      acceptedAt: stageEntry.acceptedAt
    });

    if (request.type === 'brincadeira') {
      pair.status = 'brincadeira';
      if (!pair.stages.brincadeira) {
        pair.stages.brincadeira = stageEntry;
      }
      if (!pair.createdAt) {
        pair.createdAt = stageEntry.since;
      }
    } else if (request.type === 'namoro') {
      pair.status = 'namoro';
      pair.stages.namoro = stageEntry;
      if (!pair.stages.brincadeira) {
        pair.stages.brincadeira = stageEntry;
      }
    } else if (request.type === 'casamento') {
      pair.status = 'casamento';
      pair.stages.casamento = stageEntry;
      if (!pair.stages.namoro) {
        pair.stages.namoro = stageEntry;
      }
      if (!pair.stages.brincadeira) {
        pair.stages.brincadeira = stageEntry;
      }
    }

    pair.users = [this._normalizeId(request.requesterRaw), this._normalizeId(request.targetRaw)];
    pair.updatedAt = stageEntry.since;

    data.pairs[key] = pair;
    this._saveData(data);

    return {
      success: true,
      message: this._buildAcceptanceMessage(request, pair),
      mentions: [request.requesterRaw, request.targetRaw],
      pair
    };
  }

  _buildAcceptanceMessage(request, pair) {
    const config = TYPE_CONFIG[request.type];
    const requesterName = getUserName(request.requesterRaw);
    const targetName = getUserName(request.targetRaw);
    const stageInfo = pair.stages?.[request.type];
    const sinceText = stageInfo?.since ? this._formatDate(stageInfo.since) : null;

    const lines = [
      config.successHeadline,
      '',
      `${config.emoji} @${requesterName} e @${targetName} ${config.successText}`
    ];

    if (sinceText) {
      const duration = Date.parse(stageInfo.since);
      const elapsed = Number.isNaN(duration) ? null : this._formatDuration(Date.now() - duration);
      lines.push(`🗓️ Início: ${sinceText}${elapsed ? ` (${elapsed})` : ''}`);
    }

    if (request.type === 'casamento' && pair.stages?.namoro?.since) {
      const namoroSince = Date.parse(pair.stages.namoro.since);
      if (!Number.isNaN(namoroSince)) {
        lines.push(`💞 Namoro antes do casamento: ${this._formatDuration(Date.now() - namoroSince)}`);
      }
    }

    return lines.join('\n');
  }

  getRelationshipSummary(userA, userB) {
    const key = this._getPairKey(userA, userB);
    if (!key) {
      return {
        success: false,
        message: 'Não foi possível identificar essa dupla.'
      };
    }

    const data = this._loadData();
    const pair = data.pairs[key];
    if (!pair) {
      return {
        success: false,
        message: 'Nenhum relacionamento registrado entre essas pessoas.'
      };
    }

    const partnerA = getUserName(userA);
    const partnerB = getUserName(userB);
    const lines = [
      '💞 *RELACIONAMENTO*',
      '',
      `👥 Parceiros: @${partnerA} & @${partnerB}`
    ];

    if (pair.status && TYPE_CONFIG[pair.status]) {
      const statusConfig = TYPE_CONFIG[pair.status];
      lines.push(`${statusConfig.emoji} Status atual: ${statusConfig.label}`);
      const statusSince = pair.stages?.[pair.status]?.since;
      if (statusSince) {
        const formatted = this._formatDate(statusSince);
        const elapsed = Date.parse(statusSince);
        const duration = Number.isNaN(elapsed) ? null : this._formatDuration(Date.now() - elapsed);
        lines.push(`🗓️ Desde: ${formatted || 'data desconhecida'}${duration ? ` (${duration})` : ''}`);
      }
    } else {
      lines.push('Status atual: sem registro.');
    }

    const historicalStages = ['brincadeira', 'namoro', 'casamento']
      .filter(stage => pair.stages?.[stage]?.since)
      .map(stage => {
        const config = TYPE_CONFIG[stage];
        const since = pair.stages[stage].since;
        const formatted = this._formatDate(since);
        const elapsed = Date.parse(since);
        const duration = Number.isNaN(elapsed) ? null : this._formatDuration(Date.now() - elapsed);
        return `${config.emoji} ${config.label}: ${formatted || 'data desconhecida'}${duration ? ` (${duration})` : ''}`;
      });

    if (historicalStages.length) {
      lines.push('', '📚 Histórico:', ...historicalStages);
    }

    if (pair.status !== 'casamento' && pair.stages?.namoro?.since) {
      const namoroSince = Date.parse(pair.stages.namoro.since);
      if (!Number.isNaN(namoroSince)) {
        const elapsed = Date.now() - namoroSince;
        if (elapsed < MARRIAGE_REQUIRED_MS) {
          lines.push('', `⏳ Restam ${this._formatDuration(MARRIAGE_REQUIRED_MS - elapsed)} de namoro para liberar o casamento.`);
        }
      }
    }

    return {
      success: true,
      message: lines.join('\n'),
      mentions: [userA, userB]
    };
  }

  _cleanup() {
    const now = Date.now();
    for (const [groupId, request] of this.pendingRequests.entries()) {
      if (request.expiresAt && request.expiresAt <= now) {
        this.pendingRequests.delete(groupId);
      }
    }
  }
}

module.exports = new RelationshipManager();
