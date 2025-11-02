import { LocalizedTime } from './localized-time';
import { TimeMatcher } from './time-matcher';
export declare class MatcherWalker {
    cronExpression: string;
    baseDate: Date;
    pattern: any;
    expressions: number[][];
    timeMatcher: TimeMatcher;
    timezone?: string;
    constructor(cronExpression: string, baseDate: Date, timezone?: string);
    isMatching(): boolean;
    matchNext(): LocalizedTime;
}
