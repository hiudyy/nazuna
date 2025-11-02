export type TaskContext = {
    date: Date;
    dateLocalIso: string;
    task?: ScheduledTask;
    execution?: Execution;
    triggeredAt: Date;
};
export type TaskEvent = 'task:started' | 'task:stopped' | 'task:destroyed' | 'execution:started' | 'execution:finished' | 'execution:failed' | 'execution:missed' | 'execution:overlap' | 'execution:maxReached';
export type TaskOptions = {
    timezone?: string;
    name?: string;
    noOverlap?: boolean;
    maxExecutions?: number;
    maxRandomDelay?: number;
};
export type Execution = {
    id: string;
    reason: 'invoked' | 'scheduled';
    startedAt?: Date;
    finishedAt?: Date;
    error?: Error;
    result?: any;
};
export type TaskFn = (context: TaskContext) => any | Promise<any>;
export interface ScheduledTask {
    id: string;
    name?: string;
    start(): void | Promise<void>;
    stop(): void | Promise<void>;
    getStatus(): string | Promise<string>;
    destroy(): void | Promise<void>;
    execute(): Promise<any>;
    getNextRun(): Date | null;
    on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
    once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void;
}
