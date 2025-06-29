import { AuthorizationError } from "../error/AuthorizationError";

export const AuthMiddleware = {
  isAuth: (next: any) => (parent: any, body: any, context: any, info: any) => {
    if (!context.user) {
      throw new AuthorizationError("User not authenticated");
    }
    next(parent, body, context, info);
  },
};
