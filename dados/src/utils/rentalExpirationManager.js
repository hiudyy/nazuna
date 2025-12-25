import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RentalExpirationManager {
  constructor(nazu, config = {}) {
    this.nazu = nazu;
    this.ownerNumber = config.ownerNumber || null;
    this.ownerName = config.ownerName || 'Dono do Bot';
    this.config = {
      checkInterval: config.checkInterval || '0 */6 * * *', // Every 6 hours
      warningDays: config.warningDays || 3,
      finalWarningDays: config.finalWarningDays || 1,
      cleanupDelayHours: config.cleanupDelayHours || 24,
      enableNotifications: config.enableNotifications !== false,
      enableAutoCleanup: config.enableAutoCleanup !== false,
      logFile: config.logFile || path.join(__dirname, '../logs/rental_expiration.log'),
      ...config
    };
    
    this.isRunning = false;
    this.lastCheckTime = null;
    this.stats = {
      totalChecks: 0,
      warningsSent: 0,
      finalWarningsSent: 0,
      expiredProcessed: 0,
      errors: 0
    };
  }

  async initialize() {
    try {
      // Ensure logs directory exists
      const logDir = path.dirname(this.config.logFile);
      await fs.mkdir(logDir, { recursive: true });
      
      // Start the scheduler
      this.startScheduler();
      
      // Log initialization
      await this.log('RentalExpirationManager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize RentalExpirationManager:', error);
      return false;
    }
  }

  startScheduler() {
    if (this.isRunning) {
      console.warn('⚠️ RentalExpirationManager is already running');
      return;
    }

    this.cronJob = cron.schedule(this.config.checkInterval, async () => {
      await this.checkExpiredRentals();
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.cronJob.start();
    this.isRunning = true;
    
    this.log('Scheduler started with interval: ' + this.config.checkInterval);
  }

  stopScheduler() {
    if (!this.isRunning) {
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    this.isRunning = false;
    this.log('Scheduler stopped');
  }

  async checkExpiredRentals() {
    try {
      const startTime = Date.now();
      await this.log('Starting rental expiration check...');
      
      this.stats.totalChecks++;
      this.lastCheckTime = new Date();

      // Load rental data
      const rentalData = await this.loadRentalData();
      if (!rentalData || !rentalData.groups) {
        await this.log('No rental data found or groups not initialized');
        return;
      }

      const now = new Date();
      let processedCount = 0;
      let warningCount = 0;
      let finalWarningCount = 0;
      let expiredCount = 0;

      for (const [groupId, groupInfo] of Object.entries(rentalData.groups)) {
        try {
          // Skip permanent rentals
          if (groupInfo.permanent) continue;

          const expiresAt = new Date(groupInfo.expiresAt);
          const timeUntilExpiry = expiresAt - now;
          const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

          // Process different notification levels
          if (daysUntilExpiry <= 0) {
            // Rental has expired
            await this.processExpiredRental(groupId, groupInfo, rentalData);
            expiredCount++;
          } else if (daysUntilExpiry <= this.config.finalWarningDays) {
            // Final warning
            if (groupInfo.lastNotified !== 'final') {
              await this.sendExpirationNotification(groupId, 'final', daysUntilExpiry);
              groupInfo.lastNotified = 'final';
              finalWarningCount++;
            }
          } else if (daysUntilExpiry <= this.config.warningDays) {
            // Initial warning
            if (groupInfo.lastNotified !== 'warning') {
              await this.sendExpirationNotification(groupId, 'warning', daysUntilExpiry);
              groupInfo.lastNotified = 'warning';
              warningCount++;
            }
          }

          processedCount++;
        } catch (error) {
          console.error(`❌ Error processing group ${groupId}:`, error);
          await this.log(`Error processing group ${groupId}: ${error.message}`);
          this.stats.errors++;
        }
      }

      // Save updated rental data
      await this.saveRentalData(rentalData);

      // Update stats
      this.stats.warningsSent += warningCount;
      this.stats.finalWarningsSent += finalWarningCount;
      this.stats.expiredProcessed += expiredCount;

      const duration = Date.now() - startTime;
      await this.log(`Rental check completed. Processed: ${processedCount}, Warnings: ${warningCount}, Final Warnings: ${finalWarningCount}, Expired: ${expiredCount}. Duration: ${duration}ms`);

    } catch (error) {
      console.error('❌ Critical error in rental expiration check:', error);
      await this.log(`Critical error in rental check: ${error.message}`);
      this.stats.errors++;
    }
  }

  async processExpiredRental(groupId, groupInfo, rentalData) {
    try {
      const groupMetadata = await this.nazu.groupMetadata(groupId).catch(() => null);
      
      if (!groupMetadata) {
        await this.log(`Group ${groupId} not found, removing from rental data`);
        delete rentalData.groups[groupId];
        return;
      }

      // Send expiration notification to group
      if (this.config.enableNotifications) {
        await this.sendExpirationNotification(groupId, 'expired', 0);
      }

      // Auto-cleanup after delay
      if (this.config.enableAutoCleanup) {
        setTimeout(async () => {
          await this.performAutoCleanup(groupId, groupMetadata);
        }, this.config.cleanupDelayHours * 60 * 60 * 1000);
      }

      await this.log(`Rental expired for group: ${groupMetadata.subject} (${groupId})`);
    } catch (error) {
      console.error(`❌ Error processing expired rental for group ${groupId}:`, error);
      await this.log(`Error processing expired rental for group ${groupId}: ${error.message}`);
    }
  }

  async sendExpirationNotification(groupId, type, daysUntilExpiry) {
    try {
      const groupMetadata = await this.nazu.groupMetadata(groupId).catch(() => null);
      if (!groupMetadata) return;

      const ownerInfo = await this.getOwnerInfo();
      const message = this.buildExpirationMessage(type, daysUntilExpiry, groupMetadata, ownerInfo);

      // Send to group
      await this.nazu.sendMessage(groupId, {
        text: message
      }).catch(error => {
        console.error(`❌ Failed to send message to group ${groupId}:`, error);
      });

      // Also send to group admins
      const participants = groupMetadata.participants || [];
      const admins = participants.filter(p => p.admin === true);
      
      for (const admin of admins) {
        await this.nazu.sendMessage(admin.id, {
          text: message
        }).catch(error => {
          console.error(`❌ Failed to send message to admin ${admin.id}:`, error);
        });
      }

      await this.log(`Sent ${type} notification to group: ${groupMetadata.subject} (${groupId})`);
    } catch (error) {
      console.error(`❌ Error sending ${type} notification to group ${groupId}:`, error);
      await this.log(`Error sending ${type} notification to group ${groupId}: ${error.message}`);
    }
  }

  buildExpirationMessage(type, daysUntilExpiry, groupMetadata, ownerInfo) {
    const groupName = groupMetadata.subject;
    const ownerName = ownerInfo.name;
    const ownerNumber = ownerInfo.number;
    
    let header, message, instructions, footer;

    switch (type) {
      case 'warning':
        header = '⚠️ AVISO IMPORTANTE';
        message = `O aluguel do grupo *${groupName}* está prestes a expirar em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? 's' : ''}!`;
        instructions = `Para renovar, entre em contato com o dono do bot ou use um código de aluguel válido.`;
        break;
      
      case 'final':
        header = '🚨 ÚLTIMO AVISO';
        message = `O aluguel do grupo *${groupName}* expira amanhã!`;
        instructions = `Ação necessária: Renove o aluguel imediatamente para evitar que o bot saia do grupo.`;
        break;
      
      case 'expired':
        header = '❌ ALUGUEL EXPIRADO';
        message = `O aluguel do grupo *${groupName}* expirou e o bot está configurado para sair em breve.`;
        instructions = `Para continuar usando o bot, renove o aluguel entrando em contato com o dono.`;
        break;
      
      default:
        header = '📢 INFORMAÇÃO';
        message = `Atualização sobre o status do aluguel do grupo *${groupName}*`;
        instructions = 'Verifique as informações abaixo.';
    }

    footer = `
📞 **Contato para renovação:**
• Dono: ${ownerName}
• Número: ${ownerNumber}
• Resposta: ${ownerNumber}@s.whatsapp.net

💡 **Dicas:**
• Renove com antecedência para evitar interrupções
• Use códigos de aluguel válidos quando disponíveis
• Entre em contato diretamente para renovações personalizadas`;

    return `
╭─❗ ${header} ❗─╮
${message}

${instructions}

${footer}

🤖 *Este é uma notificação automática do sistema de aluguel.*`;
  }

  async performAutoCleanup(groupId, groupMetadata) {
    try {
      // Send final goodbye message
      const goodbyeMessage = `
👋 **ATÉ LOGO, ${groupMetadata.subject.toUpperCase()}!**

O aluguel deste grupo expirou e o bot está saindo agora. Para voltar a usar o bot:

📞 **Entre em contato com o dono:**
• Nome: ${await this.getOwnerName()}
• Número: ${await this.getOwnerNumber()}
• Resposta: ${await this.getOwnerContact()}

🎯 **Como renovar:**
1. Entre em contato com o dono via WhatsApp
2. Solicite um novo código de aluguel
3. Use o código no grupo para reativar
4. Pronto! O bot voltará ao grupo

🤖 *Obrigado por usar nossos serviços! Até breve!*`;

      await this.nazu.sendMessage(groupId, {
        text: goodbyeMessage
      });

      // Leave the group
      await this.nazu.groupLeave(groupId);
      
      // Remove from rental data
      const rentalData = await this.loadRentalData();
      if (rentalData.groups && rentalData.groups[groupId]) {
        delete rentalData.groups[groupId];
        await this.saveRentalData(rentalData);
      }

      await this.log(`Bot left group ${groupId} after rental expiration`);
    } catch (error) {
      console.error(`❌ Error during auto-cleanup for group ${groupId}:`, error);
      await this.log(`Error during auto-cleanup for group ${groupId}: ${error.message}`);
    }
  }

  async getOwnerInfo() {
    try {
      // Use owner number from config or fallback to environment variable
      const name = this.ownerName || process.env.OWNER_NAME || 'Dono do Bot';
      const number = this.ownerNumber || process.env.OWNER_NUMBER || '5511999999999';
      let contact = `${number}@s.whatsapp.net`;

      // If nazu and helpers available, try to normalize contact to LID
      if (this.nazu && typeof this.nazu.onWhatsApp === 'function') {
        try {
          const cleanNumber = number.toString().replace(/\D/g, '');
          const [res] = await this.nazu.onWhatsApp(cleanNumber);
          if (res && res.jid) {
            contact = res.jid;
          }
        } catch (e) {
          console.warn('Não foi possível obter JID do dono:', e.message);
        }
      }

      return {
        name,
        number,
        contact
      };
    } catch (error) {
      console.error('❌ Error getting owner info:', error);
      return {
        name: this.ownerName || 'Dono do Bot',
        number: this.ownerNumber || '5511999999999',
        contact: `${this.ownerNumber || '5511999999999'}@s.whatsapp.net`
      };
    }
  }

  async getOwnerName() {
    const ownerInfo = await this.getOwnerInfo();
    return ownerInfo.name;
  }

  async getOwnerNumber() {
    const ownerInfo = await this.getOwnerInfo();
    return ownerInfo.number;
  }

  async getOwnerContact() {
    const ownerInfo = await this.getOwnerInfo();
    return ownerInfo.contact;
  }

  async loadRentalData() {
    try {
      const DONO_DIR = path.join(__dirname, '../../database/dono');
      const ALUGUEIS_FILE = path.join(DONO_DIR, 'alugueis.json');
      
      // Check if file exists
      try {
        await fs.access(ALUGUEIS_FILE);
      } catch {
        // Create default structure if file doesn't exist
        const defaultData = {
          globalMode: false,
          groups: {}
        };
        await fs.writeFile(ALUGUEIS_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
      }

      const data = await fs.readFile(ALUGUEIS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error loading rental data:', error);
      return { globalMode: false, groups: {} };
    }
  }

  async saveRentalData(data) {
    try {
      const DONO_DIR = path.join(__dirname, '../../database/dono');
      const ALUGUEIS_FILE = path.join(DONO_DIR, 'alugueis.json');
      
      await fs.writeFile(ALUGUEIS_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error saving rental data:', error);
      return false;
    }
  }

  async log(message) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      
      await fs.appendFile(this.config.logFile, logEntry, 'utf8');
    } catch (error) {
      console.error('❌ Error writing to log file:', error);
    }
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      config: this.config
    };
  }

  async resetStats() {
    this.stats = {
      totalChecks: 0,
      warningsSent: 0,
      finalWarningsSent: 0,
      expiredProcessed: 0,
      errors: 0
    };
    await this.log('Statistics reset');
    return true;
  }
}

export default RentalExpirationManager;