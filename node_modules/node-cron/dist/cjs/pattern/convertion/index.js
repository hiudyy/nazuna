"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const month_names_conversion_1 = __importDefault(require("./month-names-conversion"));
const week_day_names_conversion_1 = __importDefault(require("./week-day-names-conversion"));
const asterisk_to_range_conversion_1 = __importDefault(require("./asterisk-to-range-conversion"));
const range_conversion_1 = __importDefault(require("./range-conversion"));
exports.default = (() => {
    function appendSeccondExpression(expressions) {
        if (expressions.length === 5) {
            return ['0'].concat(expressions);
        }
        return expressions;
    }
    function removeSpaces(str) {
        return str.replace(/\s{2,}/g, ' ').trim();
    }
    function normalizeIntegers(expressions) {
        for (let i = 0; i < expressions.length; i++) {
            const numbers = expressions[i].split(',');
            for (let j = 0; j < numbers.length; j++) {
                numbers[j] = parseInt(numbers[j]);
            }
            expressions[i] = numbers;
        }
        return expressions;
    }
    function interprete(expression) {
        let expressions = removeSpaces(`${expression}`).split(' ');
        expressions = appendSeccondExpression(expressions);
        expressions[4] = (0, month_names_conversion_1.default)(expressions[4]);
        expressions[5] = (0, week_day_names_conversion_1.default)(expressions[5]);
        expressions = (0, asterisk_to_range_conversion_1.default)(expressions);
        expressions = (0, range_conversion_1.default)(expressions);
        expressions = normalizeIntegers(expressions);
        return expressions;
    }
    return interprete;
})();
//# sourceMappingURL=index.js.map