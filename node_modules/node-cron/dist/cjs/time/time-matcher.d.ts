export declare class TimeMatcher {
    timezone?: string;
    pattern: string;
    expressions: any[];
    constructor(pattern: string, timezone?: string);
    match(date: Date): boolean;
    getNextMatch(date: Date): Date;
}
