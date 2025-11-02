"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levelColors = {
    INFO: '\x1b[36m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    DEBUG: '\x1b[35m',
};
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
function log(level, message, extra) {
    const timestamp = new Date().toISOString();
    const color = levelColors[level] ?? '';
    const prefix = `[${timestamp}] [PID: ${process.pid}] ${GREEN}[NODE-CRON]${GREEN} ${color}[${level}]${RESET}`;
    const output = `${prefix} ${message}`;
    switch (level) {
        case 'ERROR':
            console.error(output, extra ?? '');
            break;
        case 'DEBUG':
            console.debug(output, extra ?? '');
            break;
        case 'WARN':
            console.warn(output);
            break;
        case 'INFO':
        default:
            console.info(output);
            break;
    }
}
const logger = {
    info(message) {
        log('INFO', message);
    },
    warn(message) {
        log('WARN', message);
    },
    error(message, err) {
        if (message instanceof Error) {
            log('ERROR', message.message, message);
        }
        else {
            log('ERROR', message, err);
        }
    },
    debug(message, err) {
        if (message instanceof Error) {
            log('DEBUG', message.message, message);
        }
        else {
            log('DEBUG', message, err);
        }
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map