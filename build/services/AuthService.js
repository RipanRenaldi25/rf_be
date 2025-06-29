"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = require("../prismaClient");
const AuthorizationError_1 = require("../utils/error/AuthorizationError");
const NotFoundError_1 = require("../utils/error/NotFoundError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.AuthService = {
    register: (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const userOnDatabase = yield prismaClient_1.prismaClient.user.findUnique({
            where: {
                email: payload.email,
            },
        });
        if (userOnDatabase) {
            throw new AuthorizationError_1.AuthorizationError("User exists on database");
        }
        const hashedPassword = yield bcrypt_1.default.hash(payload.password, 10);
        const newUser = yield prismaClient_1.prismaClient.user.create({
            data: Object.assign(Object.assign({}, payload), { password: hashedPassword }),
        });
        return { newUser };
    }),
    login: (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const userExistsOnDatabase = yield prismaClient_1.prismaClient.user.findUnique({
            where: {
                email: payload.email,
            },
        });
        if (!userExistsOnDatabase) {
            throw new NotFoundError_1.NotFoundError("User not found");
        }
        const isPasswordMatched = yield bcrypt_1.default.compare(payload.password, userExistsOnDatabase.password);
        if (!isPasswordMatched) {
            throw new AuthorizationError_1.AuthorizationError("email or password is not match");
        }
        const accessToken = jsonwebtoken_1.default.sign({
            id: userExistsOnDatabase.id,
            email: userExistsOnDatabase.email,
            name: userExistsOnDatabase.name,
        }, (_a = process.env.SECRET_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : "ACCESS_TOKEN_RAHASIA", { expiresIn: 3600 * 3 });
        const refreshToken = jsonwebtoken_1.default.sign({
            id: userExistsOnDatabase.id,
            email: userExistsOnDatabase.email,
            name: userExistsOnDatabase.name,
        }, (_b = process.env.SECRET_REFRESH_TOKEN) !== null && _b !== void 0 ? _b : "REFRESH_TOKEN_RAHASIA");
        return {
            accessToken,
            refreshToken,
        };
    }),
};
