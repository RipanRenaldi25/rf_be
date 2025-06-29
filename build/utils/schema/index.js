"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayload = void 0;
const EntityError_1 = require("../error/EntityError");
const validatePayload = (schema, payload) => {
    const result = schema.validate(payload);
    console.log({ result });
    if (result.error) {
        throw new EntityError_1.EntityError(`Unprocessable entity: ${result.error.message}\n with Details: ${result.error.details}`);
    }
    return result.value;
};
exports.validatePayload = validatePayload;
