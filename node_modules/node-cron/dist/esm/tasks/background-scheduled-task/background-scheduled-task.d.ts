import { ChildProcess } from 'child_process';
import { ScheduledTask, TaskContext, TaskEvent, TaskOptions } from '../scheduled-task';
import { EventEmitter } from 'stream';
import { StateMachine } from '../state-machine';
declare class TaskEmitter extends EventEmitter {
}
declare class BackgroundScheduledTask implements ScheduledTask {
    emitter: TaskEmitter;
    id: string;
    name: string;
    cronExpression: any;
    taskPath: any;
    options?: any;
    forkProcess?: ChildProcess;
    stateMachine: StateMachine;
    constructor(cronExpression: string, taskPath: string, options?: TaskOptions);
    getNextRun(): Date | null;
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): string;
    destroy(): Promise<void>;
    execute(): Promise<any>;
    on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    private createContext;
}
export default BackgroundScheduledTask;
