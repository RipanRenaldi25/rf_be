import { ClientError } from "./ClientError";

export class EntityError extends ClientError {
  constructor(message: string) {
    super(message, 422);
  }
}
