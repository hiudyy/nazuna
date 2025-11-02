import { ScheduledTask, TaskFn, TaskOptions } from "./tasks/scheduled-task";
export declare function schedule(expression: string, func: TaskFn | string, options?: TaskOptions): ScheduledTask;
export declare function createTask(expression: string, func: TaskFn | string, options?: TaskOptions): ScheduledTask;
export declare function solvePath(filePath: string): string;
export declare function validate(expression: string): boolean;
export declare const getTasks: () => Map<string, ScheduledTask>;
export declare const getTask: (taskId: string) => ScheduledTask | undefined;
export { ScheduledTask } from './tasks/scheduled-task';
export type { TaskFn, TaskContext, TaskOptions } from './tasks/scheduled-task';
export interface NodeCron {
    schedule: typeof schedule;
    createTask: typeof createTask;
    validate: typeof validate;
    getTasks: typeof getTasks;
    getTask: typeof getTask;
}
export declare const nodeCron: NodeCron;
export default nodeCron;
