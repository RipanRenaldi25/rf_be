"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const AuthorizationError_1 = require("../error/AuthorizationError");
exports.AuthMiddleware = {
    isAuth: (next) => (parent, body, context, info) => {
        if (!context.user) {
            throw new AuthorizationError_1.AuthorizationError("User not authenticated");
        }
        next(parent, body, context, info);
    },
};
