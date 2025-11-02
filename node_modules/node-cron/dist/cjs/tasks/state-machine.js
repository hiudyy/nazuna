"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = void 0;
const allowedTransitions = {
    'stopped': ['stopped', 'idle', 'destroyed'],
    'idle': ['idle', 'running', 'stopped', 'destroyed'],
    'running': ['running', 'idle', 'stopped', 'destroyed'],
    'destroyed': ['destroyed']
};
class StateMachine {
    state;
    constructor(initial = 'stopped') {
        this.state = initial;
    }
    changeState(state) {
        if (allowedTransitions[this.state].includes(state)) {
            this.state = state;
        }
        else {
            throw new Error(`invalid transition from ${this.state} to ${state}`);
        }
    }
}
exports.StateMachine = StateMachine;
//# sourceMappingURL=state-machine.js.map