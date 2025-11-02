export type TaskState = 'stopped' | 'idle' | 'running' | 'destroyed';
export declare class StateMachine {
    state: TaskState;
    constructor(initial?: TaskState);
    changeState(state: TaskState): void;
}
