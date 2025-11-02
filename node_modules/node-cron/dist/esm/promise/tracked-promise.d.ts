type PromiseState = 'pending' | 'fulfilled' | 'rejected';
export declare class TrackedPromise<T> {
    promise: Promise<T>;
    error: any;
    state: PromiseState;
    value?: T;
    constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void);
    getPromise(): Promise<T>;
    getState(): PromiseState;
    isPending(): boolean;
    isFulfilled(): boolean;
    isRejected(): boolean;
    getValue(): T | undefined;
    getError(): any;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}
export {};
