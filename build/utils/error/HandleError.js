"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const graphql_1 = require("graphql");
const ClientError_1 = require("./ClientError");
const handleError = (error) => {
    if (error instanceof ClientError_1.ClientError) {
        throw new graphql_1.GraphQLError(error.message, {
            extensions: {
                http: {
                    status: error.statusCode,
                },
            },
        });
    }
    throw new graphql_1.GraphQLError(error.message, {
        extensions: {
            http: {
                status: 500,
            },
        },
    });
};
exports.handleError = handleError;
