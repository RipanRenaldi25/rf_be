import joi from "joi";

export const registerSchema = joi.object({
  name: joi.string().required(),
  phone_number: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
  company_name: joi.string().required(),
});
