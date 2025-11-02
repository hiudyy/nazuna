"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const create_id_1 = require("../create-id");
const logger_1 = __importDefault(require("../logger"));
const tracked_promise_1 = require("../promise/tracked-promise");
function emptyOnFn() { }
;
function emptyHookFn() { return true; }
;
function defaultOnError(date, error) {
    logger_1.default.error('Task failed with error!', error);
}
class Runner {
    timeMatcher;
    onMatch;
    noOverlap;
    maxExecutions;
    maxRandomDelay;
    runCount;
    running;
    heartBeatTimeout;
    onMissedExecution;
    onOverlap;
    onError;
    beforeRun;
    onFinished;
    onMaxExecutions;
    constructor(timeMatcher, onMatch, options) {
        this.timeMatcher = timeMatcher;
        this.onMatch = onMatch;
        this.noOverlap = options == undefined || options.noOverlap === undefined ? false : options.noOverlap;
        this.maxExecutions = options?.maxExecutions;
        this.maxRandomDelay = options?.maxRandomDelay || 0;
        this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
        this.onOverlap = options?.onOverlap || emptyOnFn;
        this.onError = options?.onError || defaultOnError;
        this.onFinished = options?.onFinished || emptyHookFn;
        this.beforeRun = options?.beforeRun || emptyHookFn;
        this.onMaxExecutions = options?.onMaxExecutions || emptyOnFn;
        this.runCount = 0;
        this.running = false;
    }
    start() {
        this.running = true;
        let lastExecution;
        let expectedNextExecution;
        const scheduleNextHeartBeat = (currentDate) => {
            if (this.running) {
                clearTimeout(this.heartBeatTimeout);
                this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
            }
        };
        const runTask = (date) => {
            return new Promise(async (resolve) => {
                const execution = {
                    id: (0, create_id_1.createID)('exec'),
                    reason: 'scheduled'
                };
                const shouldExecute = await this.beforeRun(date, execution);
                const randomDelay = Math.floor(Math.random() * this.maxRandomDelay);
                if (shouldExecute) {
                    setTimeout(async () => {
                        try {
                            this.runCount++;
                            execution.startedAt = new Date();
                            const result = await this.onMatch(date, execution);
                            execution.finishedAt = new Date();
                            execution.result = result;
                            this.onFinished(date, execution);
                            if (this.maxExecutions && this.runCount >= this.maxExecutions) {
                                this.onMaxExecutions(date);
                                this.stop();
                            }
                        }
                        catch (error) {
                            execution.finishedAt = new Date();
                            execution.error = error;
                            this.onError(date, error, execution);
                        }
                        resolve(true);
                    }, randomDelay);
                }
            });
        };
        const checkAndRun = (date) => {
            return new tracked_promise_1.TrackedPromise(async (resolve, reject) => {
                try {
                    if (this.timeMatcher.match(date)) {
                        await runTask(date);
                    }
                    resolve(true);
                }
                catch (err) {
                    reject(err);
                }
            });
        };
        const heartBeat = async () => {
            const currentDate = nowWithoutMs();
            if (expectedNextExecution && expectedNextExecution.getTime() < currentDate.getTime()) {
                while (expectedNextExecution.getTime() < currentDate.getTime()) {
                    logger_1.default.warn(`missed execution at ${expectedNextExecution}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
                    expectedNextExecution = this.timeMatcher.getNextMatch(expectedNextExecution);
                    runAsync(this.onMissedExecution, expectedNextExecution, defaultOnError);
                }
            }
            if (lastExecution && lastExecution.getState() === 'pending') {
                runAsync(this.onOverlap, currentDate, defaultOnError);
                if (this.noOverlap) {
                    logger_1.default.warn('task still running, new execution blocked by overlap prevention!');
                    expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
                    scheduleNextHeartBeat(currentDate);
                    return;
                }
            }
            lastExecution = checkAndRun(currentDate);
            expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
            scheduleNextHeartBeat(currentDate);
        };
        this.heartBeatTimeout = setTimeout(() => {
            heartBeat();
        }, getDelay(this.timeMatcher, nowWithoutMs()));
    }
    nextRun() {
        return this.timeMatcher.getNextMatch(new Date());
    }
    stop() {
        this.running = false;
        if (this.heartBeatTimeout) {
            clearTimeout(this.heartBeatTimeout);
            this.heartBeatTimeout = undefined;
        }
    }
    isStarted() {
        return !!this.heartBeatTimeout && this.running;
    }
    isStopped() {
        return !this.isStarted();
    }
    async execute() {
        const date = new Date();
        const execution = {
            id: (0, create_id_1.createID)('exec'),
            reason: 'invoked'
        };
        try {
            const shouldExecute = await this.beforeRun(date, execution);
            if (shouldExecute) {
                this.runCount++;
                execution.startedAt = new Date();
                const result = await this.onMatch(date, execution);
                execution.finishedAt = new Date();
                execution.result = result;
                this.onFinished(date, execution);
            }
        }
        catch (error) {
            execution.finishedAt = new Date();
            execution.error = error;
            this.onError(date, error, execution);
        }
    }
}
exports.Runner = Runner;
async function runAsync(fn, date, onError) {
    try {
        await fn(date);
    }
    catch (error) {
        onError(date, error);
    }
}
function getDelay(timeMatcher, currentDate) {
    const maxDelay = 86400000;
    const nextRun = timeMatcher.getNextMatch(currentDate);
    const now = new Date();
    const delay = nextRun.getTime() - now.getTime();
    if (delay > maxDelay) {
        return maxDelay;
    }
    return Math.max(0, delay);
}
function nowWithoutMs() {
    const date = new Date();
    date.setMilliseconds(0);
    return date;
}
//# sourceMappingURL=runner.js.map