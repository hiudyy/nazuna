"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineScheduledTask = void 0;
const events_1 = __importDefault(require("events"));
const runner_1 = require("../scheduler/runner");
const time_matcher_1 = require("../time/time-matcher");
const create_id_1 = require("../create-id");
const state_machine_1 = require("./state-machine");
const logger_1 = __importDefault(require("../logger"));
const localized_time_1 = require("../time/localized-time");
class TaskEmitter extends events_1.default {
}
class InlineScheduledTask {
    emitter;
    cronExpression;
    timeMatcher;
    runner;
    id;
    name;
    stateMachine;
    timezone;
    constructor(cronExpression, taskFn, options) {
        this.emitter = new TaskEmitter();
        this.cronExpression = cronExpression;
        this.id = (0, create_id_1.createID)('task', 12);
        this.name = options?.name || this.id;
        this.timezone = options?.timezone;
        this.timeMatcher = new time_matcher_1.TimeMatcher(cronExpression, options?.timezone);
        this.stateMachine = new state_machine_1.StateMachine();
        const runnerOptions = {
            timezone: options?.timezone,
            noOverlap: options?.noOverlap,
            maxExecutions: options?.maxExecutions,
            maxRandomDelay: options?.maxRandomDelay,
            beforeRun: (date, execution) => {
                if (execution.reason === 'scheduled') {
                    this.changeState('running');
                }
                this.emitter.emit('execution:started', this.createContext(date, execution));
                return true;
            },
            onFinished: (date, execution) => {
                if (execution.reason === 'scheduled') {
                    this.changeState('idle');
                }
                this.emitter.emit('execution:finished', this.createContext(date, execution));
                return true;
            },
            onError: (date, error, execution) => {
                logger_1.default.error(error);
                this.emitter.emit('execution:failed', this.createContext(date, execution));
                this.changeState('idle');
            },
            onOverlap: (date) => {
                this.emitter.emit('execution:overlap', this.createContext(date));
            },
            onMissedExecution: (date) => {
                this.emitter.emit('execution:missed', this.createContext(date));
            },
            onMaxExecutions: (date) => {
                this.emitter.emit('execution:maxReached', this.createContext(date));
                this.destroy();
            }
        };
        this.runner = new runner_1.Runner(this.timeMatcher, (date, execution) => {
            return taskFn(this.createContext(date, execution));
        }, runnerOptions);
    }
    getNextRun() {
        if (this.stateMachine.state !== 'stopped') {
            return this.runner.nextRun();
        }
        return null;
    }
    changeState(state) {
        if (this.runner.isStarted()) {
            this.stateMachine.changeState(state);
        }
    }
    start() {
        if (this.runner.isStopped()) {
            this.runner.start();
            this.stateMachine.changeState('idle');
            this.emitter.emit('task:started', this.createContext(new Date()));
        }
    }
    stop() {
        if (this.runner.isStarted()) {
            this.runner.stop();
            this.stateMachine.changeState('stopped');
            this.emitter.emit('task:stopped', this.createContext(new Date()));
        }
    }
    getStatus() {
        return this.stateMachine.state;
    }
    destroy() {
        if (this.stateMachine.state === 'destroyed')
            return;
        this.stop();
        this.stateMachine.changeState('destroyed');
        this.emitter.emit('task:destroyed', this.createContext(new Date()));
    }
    execute() {
        return new Promise((resolve, reject) => {
            const onFail = (context) => {
                this.off('execution:finished', onFail);
                reject(context.execution?.error);
            };
            const onFinished = (context) => {
                this.off('execution:failed', onFail);
                resolve(context.execution?.result);
            };
            this.once('execution:finished', onFinished);
            this.once('execution:failed', onFail);
            this.runner.execute();
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
        const localTime = new localized_time_1.LocalizedTime(executionDate, this.timezone);
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
exports.InlineScheduledTask = InlineScheduledTask;
//# sourceMappingURL=inline-scheduled-task.js.map