import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { AuthService } from "../services/authService";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  ipAddress?: string;
  userAgent?: string;
};

const authService = new AuthService();

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get JWT token from Authorization header
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await authService.verifyToken(token);
      const dbUser = await db.getUserById(payload.userId);
      if (dbUser) {
        user = dbUser;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Get IP address
  const ipAddress =
    (opts.req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    opts.req.socket.remoteAddress ||
    undefined;

  // Get user agent
  const userAgent = opts.req.headers['user-agent'] || undefined;

  return {
    req: opts.req,
    res: opts.res,
    user,
    ipAddress,
    userAgent,
  };
}
