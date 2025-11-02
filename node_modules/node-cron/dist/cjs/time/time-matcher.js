"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeMatcher = void 0;
const index_1 = __importDefault(require("../pattern/convertion/index"));
const week_day_names_conversion_1 = __importDefault(require("../pattern/convertion/week-day-names-conversion"));
const localized_time_1 = require("./localized-time");
const matcher_walker_1 = require("./matcher-walker");
function matchValue(allowedValues, value) {
    return allowedValues.indexOf(value) !== -1;
}
class TimeMatcher {
    timezone;
    pattern;
    expressions;
    constructor(pattern, timezone) {
        this.timezone = timezone;
        this.pattern = pattern;
        this.expressions = (0, index_1.default)(pattern);
    }
    match(date) {
        const localizedTime = new localized_time_1.LocalizedTime(date, this.timezone);
        const parts = localizedTime.getParts();
        const runOnSecond = matchValue(this.expressions[0], parts.second);
        const runOnMinute = matchValue(this.expressions[1], parts.minute);
        const runOnHour = matchValue(this.expressions[2], parts.hour);
        const runOnDay = matchValue(this.expressions[3], parts.day);
        const runOnMonth = matchValue(this.expressions[4], parts.month);
        const runOnWeekDay = matchValue(this.expressions[5], parseInt((0, week_day_names_conversion_1.default)(parts.weekday)));
        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }
    getNextMatch(date) {
        const walker = new matcher_walker_1.MatcherWalker(this.pattern, date, this.timezone);
        const next = walker.matchNext();
        return next.toDate();
    }
}
exports.TimeMatcher = TimeMatcher;
//# sourceMappingURL=time-matcher.js.map