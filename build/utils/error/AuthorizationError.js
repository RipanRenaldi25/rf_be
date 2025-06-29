"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = void 0;
const ClientError_1 = require("./ClientError");
class AuthorizationError extends ClientError_1.ClientError {
    constructor(message) {
        super(message, 401);
    }
}
exports.AuthorizationError = AuthorizationError;
