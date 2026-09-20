import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number } | null;
      isAuthenticated: () => boolean;
    }
  }
}