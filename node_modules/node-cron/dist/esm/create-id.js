"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createID = createID;
const node_crypto_1 = __importDefault(require("node:crypto"));
function createID(prefix = '', length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = node_crypto_1.default.randomBytes(length);
    const id = Array.from(values, v => charset[v % charset.length]).join('');
    return prefix ? `${prefix}-${id}` : id;
}
//# sourceMappingURL=create-id.js.map