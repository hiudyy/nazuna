"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDaemon = startDaemon;
exports.bind = bind;
const url_1 = require("url");
const logger_1 = __importDefault(require("../../logger"));
const inline_scheduled_task_1 = require("../inline-scheduled-task");
async function startDaemon(message) {
    let script;
    try {
        script = await import(message.path);
    }
    catch {
        script = await import((0, url_1.fileURLToPath)(message.path));
    }
    const task = new inline_scheduled_task_1.InlineScheduledTask(message.cron, script.task, message.options);
    task.on('task:started', (context => sendEvent('task:started', context)));
    task.on('task:stopped', (context => sendEvent('task:stopped', context)));
    task.on('task:destroyed', (context => sendEvent('task:destroyed', context)));
    task.on('execution:started', (context => sendEvent('execution:started', context)));
    task.on('execution:finished', (context => sendEvent('execution:finished', context)));
    task.on('execution:failed', (context => sendEvent('execution:failed', context)));
    task.on('execution:missed', (context => sendEvent('execution:missed', context)));
    task.on('execution:overlap', (context => sendEvent('execution:overlap', context)));
    task.on('execution:maxReached', (context => sendEvent('execution:maxReached', context)));
    if (process.send)
        process.send({ event: 'daemon:started' });
    task.start();
    return task;
}
function sendEvent(event, context) {
    const message = { event: event, context: safelySerializeContext(context) };
    if (context.execution?.error) {
        message.jsonError = serializeError(context.execution?.error);
    }
    if (process.send)
        process.send(message);
}
function serializeError(err) {
    const plain = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...Object.getOwnPropertyNames(err)
            .filter(k => !['name', 'message', 'stack'].includes(k))
            .reduce((acc, k) => {
            acc[k] = err[k];
            return acc;
        }, {})
    };
    return JSON.stringify(plain);
}
function safelySerializeContext(context) {
    const safeContext = {
        date: context.date,
        dateLocalIso: context.dateLocalIso,
        triggeredAt: context.triggeredAt
    };
    if (context.task) {
        safeContext.task = {
            id: context.task.id,
            name: context.task.name,
            status: context.task.getStatus()
        };
    }
    if (context.execution) {
        safeContext.execution = {
            id: context.execution.id,
            reason: context.execution.reason,
            startedAt: context.execution.startedAt,
            finishedAt: context.execution.finishedAt,
            hasError: !!context.execution.error,
            result: context.execution.result
        };
    }
    return safeContext;
}
function bind() {
    let task;
    process.on('message', async (message) => {
        switch (message.command) {
            case 'task:start':
                task = await startDaemon(message);
                return task;
            case 'task:stop':
                if (task)
                    task.stop();
                return task;
            case 'task:destroy':
                if (task)
                    task.destroy();
                return task;
            case 'task:execute':
                try {
                    if (task)
                        await task.execute();
                }
                catch (error) {
                    logger_1.default.debug('Daemon task:execute falied:', error);
                }
                return task;
        }
    });
}
bind();
//# sourceMappingURL=daemon.js.map