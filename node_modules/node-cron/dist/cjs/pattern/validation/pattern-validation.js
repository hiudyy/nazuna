"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../convertion/index"));
const validationRegex = /^(?:\d+|\*|\*\/\d+)$/;
function isValidExpression(expression, min, max) {
    const options = expression;
    for (const option of options) {
        const optionAsInt = parseInt(option, 10);
        if ((!Number.isNaN(optionAsInt) &&
            (optionAsInt < min || optionAsInt > max)) ||
            !validationRegex.test(option))
            return false;
    }
    return true;
}
function isInvalidSecond(expression) {
    return !isValidExpression(expression, 0, 59);
}
function isInvalidMinute(expression) {
    return !isValidExpression(expression, 0, 59);
}
function isInvalidHour(expression) {
    return !isValidExpression(expression, 0, 23);
}
function isInvalidDayOfMonth(expression) {
    return !isValidExpression(expression, 1, 31);
}
function isInvalidMonth(expression) {
    return !isValidExpression(expression, 1, 12);
}
function isInvalidWeekDay(expression) {
    return !isValidExpression(expression, 0, 7);
}
function validateFields(patterns, executablePatterns) {
    if (isInvalidSecond(executablePatterns[0]))
        throw new Error(`${patterns[0]} is a invalid expression for second`);
    if (isInvalidMinute(executablePatterns[1]))
        throw new Error(`${patterns[1]} is a invalid expression for minute`);
    if (isInvalidHour(executablePatterns[2]))
        throw new Error(`${patterns[2]} is a invalid expression for hour`);
    if (isInvalidDayOfMonth(executablePatterns[3]))
        throw new Error(`${patterns[3]} is a invalid expression for day of month`);
    if (isInvalidMonth(executablePatterns[4]))
        throw new Error(`${patterns[4]} is a invalid expression for month`);
    if (isInvalidWeekDay(executablePatterns[5]))
        throw new Error(`${patterns[5]} is a invalid expression for week day`);
}
function validate(pattern) {
    if (typeof pattern !== 'string')
        throw new TypeError('pattern must be a string!');
    const patterns = pattern.split(' ');
    const executablePatterns = (0, index_1.default)(pattern);
    if (patterns.length === 5)
        patterns.unshift('0');
    validateFields(patterns, executablePatterns);
}
exports.default = validate;
//# sourceMappingURL=pattern-validation.js.map