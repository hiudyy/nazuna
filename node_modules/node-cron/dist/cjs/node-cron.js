"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeCron = exports.getTask = exports.getTasks = void 0;
exports.schedule = schedule;
exports.createTask = createTask;
exports.solvePath = solvePath;
exports.validate = validate;
const inline_scheduled_task_1 = require("./tasks/inline-scheduled-task");
const task_registry_1 = require("./task-registry");
const pattern_validation_1 = __importDefault(require("./pattern/validation/pattern-validation"));
const background_scheduled_task_1 = __importDefault(require("./tasks/background-scheduled-task/background-scheduled-task"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const registry = new task_registry_1.TaskRegistry();
function schedule(expression, func, options) {
    const task = createTask(expression, func, options);
    task.start();
    return task;
}
function createTask(expression, func, options) {
    let task;
    if (func instanceof Function) {
        task = new inline_scheduled_task_1.InlineScheduledTask(expression, func, options);
    }
    else {
        const taskPath = solvePath(func);
        task = new background_scheduled_task_1.default(expression, taskPath, options);
    }
    registry.add(task);
    return task;
}
function solvePath(filePath) {
    if (path_1.default.isAbsolute(filePath))
        return (0, url_1.pathToFileURL)(filePath).href;
    if (filePath.startsWith('file://'))
        return filePath;
    const stackLines = new Error().stack?.split('\n');
    if (stackLines) {
        stackLines?.shift();
        const callerLine = stackLines?.find((line) => { return line.indexOf(__filename) === -1; });
        const match = callerLine?.match(/(file:\/\/)?(((\/?)(\w:))?([/\\].+)):\d+:\d+/);
        if (match) {
            const dir = `${match[5] ?? ""}${path_1.default.dirname(match[6])}`;
            return (0, url_1.pathToFileURL)(path_1.default.resolve(dir, filePath)).href;
        }
    }
    throw new Error(`Could not locate task file ${filePath}`);
}
function validate(expression) {
    try {
        (0, pattern_validation_1.default)(expression);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.getTasks = registry.all;
exports.getTask = registry.get;
exports.nodeCron = {
    schedule,
    createTask,
    validate,
    getTasks: exports.getTasks,
    getTask: exports.getTask,
};
exports.default = exports.nodeCron;
//# sourceMappingURL=node-cron.js.map