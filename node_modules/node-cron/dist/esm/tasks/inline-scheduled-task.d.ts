import EventEmitter from "events";
import { ScheduledTask, TaskContext, TaskEvent, TaskFn, TaskOptions } from "./scheduled-task";
import { Runner } from "../scheduler/runner";
import { TimeMatcher } from "../time/time-matcher";
import { StateMachine } from "./state-machine";
declare class TaskEmitter extends EventEmitter {
}
export declare class InlineScheduledTask implements ScheduledTask {
    emitter: TaskEmitter;
    cronExpression: string;
    timeMatcher: TimeMatcher;
    runner: Runner;
    id: string;
    name: string;
    stateMachine: StateMachine;
    timezone?: string;
    constructor(cronExpression: string, taskFn: TaskFn, options?: TaskOptions);
    getNextRun(): Date | null;
    private changeState;
    start(): void;
    stop(): void;
    getStatus(): string;
    destroy(): void;
    execute(): Promise<any>;
    on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    private createContext;
}
export {};
