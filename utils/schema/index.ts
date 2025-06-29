import Joi from "joi";
import { EntityError } from "../error/EntityError";

export const validatePayload = (schema: Joi.Schema, payload: any) => {
  const result = schema.validate(payload);
  console.log({ result });

  if (result.error) {
    throw new EntityError(
      `Unprocessable entity: ${result.error.message}\n with Details: ${result.error.details}`
    );
  }
  return result.value;
};
