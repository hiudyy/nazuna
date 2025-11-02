type DateParts = {
    day: number;
    month: number;
    year: number;
    hour: number;
    minute: number;
    second: number;
    milisecond: number;
    weekday: string;
    gmt: string;
};
export declare class LocalizedTime {
    timestamp: number;
    parts: DateParts;
    timezone?: string | undefined;
    constructor(date: Date, timezone?: string);
    toDate(): Date;
    toISO(): string;
    getParts(): DateParts;
    set(field: string, value: number): void;
}
export {};
