"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRegistry = void 0;
const tasks = new Map();
class TaskRegistry {
    add(task) {
        if (this.has(task.id)) {
            throw Error(`task ${task.id} already registred!`);
        }
        tasks.set(task.id, task);
        task.on('task:destroyed', () => {
            this.remove(task);
        });
    }
    get(taskId) {
        return tasks.get(taskId);
    }
    remove(task) {
        if (this.has(task.id)) {
            task?.destroy();
            tasks.delete(task.id);
        }
    }
    all() {
        return tasks;
    }
    has(taskId) {
        return tasks.has(taskId);
    }
    killAll() {
        tasks.forEach(id => this.remove(id));
    }
}
exports.TaskRegistry = TaskRegistry;
//# sourceMappingURL=task-registry.js.map