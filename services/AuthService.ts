import bcrypt from "bcrypt";
import { prismaClient } from "../prismaClient";
import { GraphQLError } from "graphql";
import { AuthorizationError } from "../utils/error/AuthorizationError";
import { IUser } from "../lib/types";
import { NotFoundError } from "../utils/error/NotFoundError";
import jwt from "jsonwebtoken";

export const AuthService = {
  register: async (payload: {
    name: string;
    phone_number: string;
    email: string;
    password: string;
    company_name: string;
  }) => {
    const userOnDatabase = await prismaClient.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (userOnDatabase) {
      throw new AuthorizationError("User exists on database");
    }
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const newUser = await prismaClient.user.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });
    return { newUser };
  },

  login: async (payload: Pick<IUser, "email" | "password">) => {
    const userExistsOnDatabase = await prismaClient.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (!userExistsOnDatabase) {
      throw new NotFoundError("User not found");
    }
    const isPasswordMatched = await bcrypt.compare(
      payload.password,
      userExistsOnDatabase.password
    );
    if (!isPasswordMatched) {
      throw new AuthorizationError("email or password is not match");
    }

    const accessToken = jwt.sign(
      {
        id: userExistsOnDatabase.id,
        email: userExistsOnDatabase.email,
        name: userExistsOnDatabase.name,
      },
      process.env.SECRET_ACCESS_TOKEN ?? "ACCESS_TOKEN_RAHASIA",
      { expiresIn: 3600 * 3 }
    );
    const refreshToken = jwt.sign(
      {
        id: userExistsOnDatabase.id,
        email: userExistsOnDatabase.email,
        name: userExistsOnDatabase.name,
      },
      process.env.SECRET_REFRESH_TOKEN ?? "REFRESH_TOKEN_RAHASIA"
    );
    return {
      accessToken,
      refreshToken,
    };
  },
};
