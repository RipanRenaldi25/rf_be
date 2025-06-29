import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";
import { typeDefs } from "./typeDefs";
import { resolver } from "./resolvers";
import { AuthorizationError } from "./utils/error/AuthorizationError";
import jwt from "jsonwebtoken";
import { prismaClient } from "./prismaClient";
import { handleError } from "./utils/error/HandleError";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
dotenv.config();

const init = async () => {
  const apolloInstance = new ApolloServer({
    typeDefs,
    resolvers: resolver,
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: "my-graph-id@my-graph-variant",
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],
  });
  const app = express();
  app.use(cors());

  await apolloInstance.start();
  app.use(
    "/graphql",
    express.json(),
    cors(),
    expressMiddleware(apolloInstance, {
      context: async ({ req }) => {
        const token = req.headers.authorization;
        let user = null;

        if (token) {
          try {
            const bearerToken = token.split(" ")[1];
            const decodedUser = jwt.verify(
              bearerToken,
              process.env.SECRET_ACCESS_TOKEN ?? "ACCESS_TOKEN_RAHASIA"
            ) as any;

            user = await prismaClient.user.findUnique({
              where: {
                id: decodedUser.id,
              },
            });
            console.log({ user });
          } catch (err: any) {
            console.error("Invalid token:", err.message);
            handleError(err);
          }
        }

        return { user };
      },
    })
  );

  app.listen(process.env.PORT ? +process.env.PORT : 3000, () => {
    console.log({ portEnv: process.env.PORT, env: process.env.NODE_ENV });
    console.log(`server running on port ${process.env.PORT ?? 3000}`);
  });
};

init().catch((err) => console.log(err));
