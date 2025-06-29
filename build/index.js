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
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const typeDefs_1 = require("./typeDefs");
const resolvers_1 = require("./resolvers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("./prismaClient");
const HandleError_1 = require("./utils/error/HandleError");
dotenv_1.default.config();
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const apolloInstance = new server_1.ApolloServer({
        typeDefs: typeDefs_1.typeDefs,
        resolvers: resolvers_1.resolver,
    });
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    yield apolloInstance.start();
    app.use("/graphql", express_1.default.json(), (0, cors_1.default)(), (0, express4_1.expressMiddleware)(apolloInstance, {
        context: (_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
            var _b;
            const token = req.headers.authorization;
            let user = null;
            if (token) {
                try {
                    const bearerToken = token.split(" ")[1];
                    const decodedUser = jsonwebtoken_1.default.verify(bearerToken, (_b = process.env.SECRET_ACCESS_TOKEN) !== null && _b !== void 0 ? _b : "ACCESS_TOKEN_RAHASIA");
                    user = yield prismaClient_1.prismaClient.user.findUnique({
                        where: {
                            id: decodedUser.id,
                        },
                    });
                    console.log({ user });
                }
                catch (err) {
                    console.error("Invalid token:", err.message);
                    (0, HandleError_1.handleError)(err);
                }
            }
            return { user };
        }),
    }));
    app.listen(process.env.PORT_APP ? +process.env.PORT_APP : 3000, () => {
        var _a;
        console.log(`server running on port ${(_a = process.env.PORT_APP) !== null && _a !== void 0 ? _a : 3000}`);
        console.log({ portEnv: process.env.PORT_APP });
    });
});
init().catch((err) => console.log(err));
