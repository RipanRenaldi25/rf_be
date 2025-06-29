"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityError = void 0;
const ClientError_1 = require("./ClientError");
class EntityError extends ClientError_1.ClientError {
    constructor(message) {
        super(message, 422);
    }
}
exports.EntityError = EntityError;
