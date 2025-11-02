declare const logger: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string | Error, err?: Error): void;
    debug(message: string | Error, err?: Error): void;
};
export default logger;
