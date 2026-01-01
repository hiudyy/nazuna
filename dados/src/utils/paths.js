import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_DIR = path.join(__dirname, '..');
const ROOT_DIR = path.join(SRC_DIR, '..');

// Detecta se é sub-bot e ajusta os caminhos de database
const BASE_DATABASE_DIR = process.env.DATABASE_PATH || path.join(ROOT_DIR, 'database');
const DATABASE_DIR = BASE_DATABASE_DIR;
const GRUPOS_DIR = path.join(DATABASE_DIR, 'grupos');
const USERS_DIR = path.join(DATABASE_DIR, 'users');
const DONO_DIR = path.join(DATABASE_DIR, 'dono');
const PARCERIAS_DIR = path.join(DATABASE_DIR, 'parcerias');
const TMP_DIR = path.join(DATABASE_DIR, 'tmp');

const LEVELING_FILE = path.join(DATABASE_DIR, 'leveling.json');
const CUSTOM_AUTORESPONSES_FILE = path.join(DATABASE_DIR, 'customAutoResponses.json');
const DIVULGACAO_FILE = path.join(DONO_DIR, 'divulgacao.json');
const NO_PREFIX_COMMANDS_FILE = path.join(DATABASE_DIR, 'noPrefixCommands.json');
const COMMAND_ALIASES_FILE = path.join(DATABASE_DIR, 'commandAliases.json');
const GLOBAL_BLACKLIST_FILE = path.join(DONO_DIR, 'globalBlacklist.json');
const MENU_DESIGN_FILE = path.join(DONO_DIR, 'menuDesign.json');
const ECONOMY_FILE = path.join(DATABASE_DIR, 'economy.json');
const MSGPREFIX_FILE = path.join(DONO_DIR, 'msgprefix.json');
const MSGBOTON_FILE = path.join(DONO_DIR, 'msgboton.json');
const CUSTOM_REACTS_FILE = path.join(DATABASE_DIR, 'customReacts.json');
const REMINDERS_FILE = path.join(DATABASE_DIR, 'reminders.json');
const CMD_NOT_FOUND_FILE = path.join(DONO_DIR, 'cmdNotFound.json');
const CUSTOM_COMMANDS_FILE = path.join(DONO_DIR, 'customCommands.json');
const ANTIFLOOD_FILE = path.join(DATABASE_DIR, 'antiflood.json');
const ANTIPV_FILE = path.join(DATABASE_DIR, 'antipv.json');
const GLOBAL_BLOCKS_FILE = path.join(DATABASE_DIR, 'globalBlocks.json');
const CMD_LIMIT_FILE = path.join(DATABASE_DIR, 'cmdlimit.json');
const CMD_USER_LIMITS_FILE = path.join(DATABASE_DIR, 'cmduserlimits.json');
const ANTISPAM_FILE = path.join(DATABASE_DIR, 'antispam.json');
const BOT_STATE_FILE = path.join(DATABASE_DIR, 'botState.json');
const AUTO_HORARIOS_FILE = path.join(DATABASE_DIR, 'autohorarios.json');
const AUTO_MENSAGENS_FILE = path.join(DATABASE_DIR, 'automensagens.json');
const MODO_LITE_FILE = path.join(DATABASE_DIR, 'modolite.json');
const JID_LID_CACHE_FILE = path.join(DATABASE_DIR, 'jid_lid_cache.json');
const SUBDONOS_FILE = path.join(DONO_DIR, 'subdonos.json');
const ALUGUEIS_FILE = path.join(DONO_DIR, 'alugueis.json');
const CODIGOS_ALUGUEL_FILE = path.join(DONO_DIR, 'codigos_aluguel.json');
const RELATIONSHIPS_FILE = path.join(DATABASE_DIR, 'relationships.json');
const MASS_MENTION_LIMIT_FILE = path.join(DATABASE_DIR, 'massMentionLimit.json');
const MASS_MENTION_CONFIG_FILE = path.join(DONO_DIR, 'massMentionConfig.json');
const GROUP_CUSTOMIZATION_FILE = path.join(DONO_DIR, 'groupCustomization.json');
const MENU_AUDIO_FILE = path.join(DONO_DIR, 'menuAudio.json');
const MENU_LERMAIS_FILE = path.join(DONO_DIR, 'menuLerMais.json');

// Detecta se é sub-bot e ajusta o caminho do config
const CONFIG_FILE = process.env.CONFIG_PATH || path.join(SRC_DIR, 'config.json');

const PACKAGE_JSON_PATH = path.join(ROOT_DIR, '..', 'package.json');

export {
  ROOT_DIR, 
  SRC_DIR,
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
  CUSTOM_COMMANDS_FILE,
  ANTIFLOOD_FILE,
  ANTIPV_FILE,
  GLOBAL_BLOCKS_FILE,
  CMD_LIMIT_FILE,
  CMD_USER_LIMITS_FILE,
  ANTISPAM_FILE,
  BOT_STATE_FILE,
  AUTO_HORARIOS_FILE,
  AUTO_MENSAGENS_FILE,
  MODO_LITE_FILE,
  JID_LID_CACHE_FILE,
  SUBDONOS_FILE,
  ALUGUEIS_FILE,
  CODIGOS_ALUGUEL_FILE,
  RELATIONSHIPS_FILE,
  MASS_MENTION_LIMIT_FILE,
  MASS_MENTION_CONFIG_FILE,
  GROUP_CUSTOMIZATION_FILE,
  MENU_AUDIO_FILE,
  MENU_LERMAIS_FILE,
  CONFIG_FILE,
  PACKAGE_JSON_PATH
};
