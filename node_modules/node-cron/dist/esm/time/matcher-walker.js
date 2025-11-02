"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatcherWalker = void 0;
const convertion_1 = __importDefault(require("../pattern/convertion"));
const localized_time_1 = require("./localized-time");
const time_matcher_1 = require("./time-matcher");
const week_day_names_conversion_1 = __importDefault(require("../pattern/convertion/week-day-names-conversion"));
class MatcherWalker {
    cronExpression;
    baseDate;
    pattern;
    expressions;
    timeMatcher;
    timezone;
    constructor(cronExpression, baseDate, timezone) {
        this.cronExpression = cronExpression;
        this.baseDate = baseDate;
        this.timeMatcher = new time_matcher_1.TimeMatcher(cronExpression, timezone);
        this.timezone = timezone;
        this.expressions = (0, convertion_1.default)(cronExpression);
    }
    isMatching() {
        return this.timeMatcher.match(this.baseDate);
    }
    matchNext() {
        const findNextDateIgnoringWeekday = () => {
            const baseDate = new Date(this.baseDate.getTime());
            baseDate.setMilliseconds(0);
            const localTime = new localized_time_1.LocalizedTime(baseDate, this.timezone);
            const dateParts = localTime.getParts();
            const date = new localized_time_1.LocalizedTime(localTime.toDate(), this.timezone);
            const seconds = this.expressions[0];
            const nextSecond = availableValue(seconds, dateParts.second);
            if (nextSecond) {
                date.set('second', nextSecond);
                if (this.timeMatcher.match(date.toDate())) {
                    return date;
                }
            }
            date.set('second', seconds[0]);
            const minutes = this.expressions[1];
            const nextMinute = availableValue(minutes, dateParts.minute);
            if (nextMinute) {
                date.set('minute', nextMinute);
                if (this.timeMatcher.match(date.toDate())) {
                    return date;
                }
            }
            date.set('minute', minutes[0]);
            const hours = this.expressions[2];
            const nextHour = availableValue(hours, dateParts.hour);
            if (nextHour) {
                date.set('hour', nextHour);
                if (this.timeMatcher.match(date.toDate())) {
                    return date;
                }
            }
            date.set('hour', hours[0]);
            const days = this.expressions[3];
            const nextDay = availableValue(days, dateParts.day);
            if (nextDay) {
                date.set('day', nextDay);
                if (this.timeMatcher.match(date.toDate())) {
                    return date;
                }
            }
            date.set('day', days[0]);
            const months = this.expressions[4];
            const nextMonth = availableValue(months, dateParts.month);
            if (nextMonth) {
                date.set('month', nextMonth);
                if (this.timeMatcher.match(date.toDate())) {
                    return date;
                }
            }
            date.set('year', date.getParts().year + 1);
            date.set('month', months[0]);
            return date;
        };
        const date = findNextDateIgnoringWeekday();
        const weekdays = this.expressions[5];
        let currentWeekday = parseInt((0, week_day_names_conversion_1.default)(date.getParts().weekday));
        while (!(weekdays.indexOf(currentWeekday) > -1)) {
            date.set('year', date.getParts().year + 1);
            currentWeekday = parseInt((0, week_day_names_conversion_1.default)(date.getParts().weekday));
        }
        return date;
    }
}
exports.MatcherWalker = MatcherWalker;
function availableValue(values, currentValue) {
    const availableValues = values.sort((a, b) => a - b).filter(s => s > currentValue);
    if (availableValues.length > 0)
        return availableValues[0];
    return false;
}
//# sourceMappingURL=matcher-walker.js.map