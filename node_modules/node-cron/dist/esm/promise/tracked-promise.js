"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackedPromise = void 0;
class TrackedPromise {
    promise;
    error;
    state;
    value;
    constructor(executor) {
        this.state = 'pending';
        this.promise = new Promise((resolve, reject) => {
            executor((value) => {
                this.state = 'fulfilled';
                this.value = value;
                resolve(value);
            }, (error) => {
                this.state = 'rejected';
                this.error = error;
                reject(error);
            });
        });
    }
    getPromise() {
        return this.promise;
    }
    getState() {
        return this.state;
    }
    isPending() {
        return this.state === 'pending';
    }
    isFulfilled() {
        return this.state === 'fulfilled';
    }
    isRejected() {
        return this.state === 'rejected';
    }
    getValue() {
        return this.value;
    }
    getError() {
        return this.error;
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.promise.catch(onrejected);
    }
    finally(onfinally) {
        return this.promise.finally(onfinally);
    }
}
exports.TrackedPromise = TrackedPromise;
//# sourceMappingURL=tracked-promise.js.map