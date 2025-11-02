"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
const create_id_1 = require("../../create-id");
const stream_1 = require("stream");
const state_machine_1 = require("../state-machine");
const localized_time_1 = require("../../time/localized-time");
const logger_1 = __importDefault(require("../../logger"));
const time_matcher_1 = require("../../time/time-matcher");
const daemonPath = (0, path_1.resolve)(__dirname, 'daemon.js');
class TaskEmitter extends stream_1.EventEmitter {
}
class BackgroundScheduledTask {
    emitter;
    id;
    name;
    cronExpression;
    taskPath;
    options;
    forkProcess;
    stateMachine;
    constructor(cronExpression, taskPath, options) {
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.id = (0, create_id_1.createID)('task');
        this.name = options?.name || this.id;
        this.emitter = new TaskEmitter();
        this.stateMachine = new state_machine_1.StateMachine('stopped');
        this.on('task:stopped', () => {
            this.forkProcess?.kill();
            this.forkProcess = undefined;
            this.stateMachine.changeState('stopped');
        });
        this.on('task:destroyed', () => {
            this.forkProcess?.kill();
            this.forkProcess = undefined;
            this.stateMachine.changeState('destroyed');
        });
    }
    getNextRun() {
        if (this.stateMachine.state !== 'stopped') {
            const timeMatcher = new time_matcher_1.TimeMatcher(this.cronExpression, this.options?.timezone);
            return timeMatcher.getNextMatch(new Date());
        }
        return null;
    }
    start() {
        return new Promise((resolve, reject) => {
            if (this.forkProcess) {
                return resolve(undefined);
            }
            const timeout = setTimeout(() => {
                reject(new Error('Start operation timed out'));
            }, 5000);
            try {
                this.forkProcess = (0, child_process_1.fork)(daemonPath);
                this.forkProcess.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(new Error(`Error on daemon: ${err.message}`));
                });
                this.forkProcess.on('exit', (code, signal) => {
                    if (code !== 0 && signal !== 'SIGTERM') {
                        const erro = new Error(`node-cron daemon exited with code ${code || signal}`);
                        logger_1.default.error(erro);
                        clearTimeout(timeout);
                        reject(erro);
                    }
                });
                this.forkProcess.on('message', (message) => {
                    if (message.jsonError) {
                        if (message.context?.execution) {
                            message.context.execution.error = deserializeError(message.jsonError);
                            delete message.jsonError;
                        }
                    }
                    if (message.context?.task?.state) {
                        this.stateMachine.changeState(message.context?.task?.state);
                    }
                    if (message.context) {
                        const execution = message.context?.execution;
                        delete execution?.hasError;
                        const context = this.createContext(new Date(message.context.date), execution);
                        this.emitter.emit(message.event, context);
                    }
                });
                this.once('task:started', () => {
                    this.stateMachine.changeState('idle');
                    clearTimeout(timeout);
                    resolve(undefined);
                });
                this.forkProcess.send({
                    command: 'task:start',
                    path: this.taskPath,
                    cron: this.cronExpression,
                    options: this.options
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.forkProcess) {
                return resolve(undefined);
            }
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error('Stop operation timed out'));
            }, 5000);
            const cleanupAndResolve = () => {
                clearTimeout(timeoutId);
                this.off('task:stopped', onStopped);
                this.forkProcess = undefined;
                resolve(undefined);
            };
            const onStopped = () => {
                cleanupAndResolve();
            };
            this.once('task:stopped', onStopped);
            this.forkProcess.send({
                command: 'task:stop'
            });
        });
    }
    getStatus() {
        return this.stateMachine.state;
    }
    destroy() {
        return new Promise((resolve, reject) => {
            if (!this.forkProcess) {
                return resolve(undefined);
            }
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error('Destroy operation timed out'));
            }, 5000);
            const onDestroy = () => {
                clearTimeout(timeoutId);
                this.off('task:destroyed', onDestroy);
                resolve(undefined);
            };
            this.once('task:destroyed', onDestroy);
            this.forkProcess.send({
                command: 'task:destroy'
            });
        });
    }
    execute() {
        return new Promise((resolve, reject) => {
            if (!this.forkProcess) {
                return reject(new Error('Cannot execute background task because it hasn\'t been started yet. Please initialize the task using the start() method before attempting to execute it.'));
            }
            const timeoutId = setTimeout(() => {
                cleanupListeners();
                reject(new Error('Execution timeout exceeded'));
            }, 5000);
            const cleanupListeners = () => {
                clearTimeout(timeoutId);
                this.off('execution:finished', onFinished);
                this.off('execution:failed', onFail);
            };
            const onFinished = (context) => {
                cleanupListeners();
                resolve(context.execution?.result);
            };
            const onFail = (context) => {
                cleanupListeners();
                reject(context.execution?.error || new Error('Execution failed without specific error'));
            };
            this.once('execution:finished', onFinished);
            this.once('execution:failed', onFail);
            this.forkProcess.send({
                command: 'task:execute'
            });
        });
    }
    on(event, fun) {
        this.emitter.on(event, fun);
    }
    off(event, fun) {
        this.emitter.off(event, fun);
    }
    once(event, fun) {
        this.emitter.once(event, fun);
    }
    createContext(executionDate, execution) {
        const localTime = new localized_time_1.LocalizedTime(executionDate, this.options?.timezone);
        const ctx = {
            date: localTime.toDate(),
            dateLocalIso: localTime.toISO(),
            triggeredAt: new Date(),
            task: this,
            execution: execution
        };
        return ctx;
    }
}
function deserializeError(str) {
    const data = JSON.parse(str);
    const Err = globalThis[data.name] || Error;
    const err = new Err(data.message);
    if (data.stack) {
        err.stack = data.stack;
    }
    Object.keys(data).forEach(key => {
        if (!['name', 'message', 'stack'].includes(key)) {
            err[key] = data[key];
        }
    });
    return err;
}
exports.default = BackgroundScheduledTask;
//# sourceMappingURL=background-scheduled-task.js.map