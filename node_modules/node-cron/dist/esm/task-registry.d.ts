import { ScheduledTask } from "./tasks/scheduled-task";
declare const tasks: Map<string, ScheduledTask>;
export declare class TaskRegistry {
    add(task: ScheduledTask): void;
    get(taskId: string): ScheduledTask | undefined;
    remove(task: ScheduledTask): void;
    all(): typeof tasks;
    has(taskId: string): boolean;
    killAll(): void;
}
export {};
