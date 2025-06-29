import { GraphQLError } from "graphql";
import { ClientError } from "./ClientError";

export const handleError = (error: any) => {
  if (error instanceof ClientError) {
    throw new GraphQLError(error.message, {
      extensions: {
        http: {
          status: error.statusCode,
        },
      },
    });
  }
  throw new GraphQLError(error.message, {
    extensions: {
      http: {
        status: 500,
      },
    },
  });
};
