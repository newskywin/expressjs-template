import { ITokenIntrospect, Requester } from "@shared/interfaces";
import { TokenBlacklistService } from "@shared/components/token-blacklist";
import { ERR_TOKEN_INVALID } from "@shared/ultils/error";
import { Handler, NextFunction, Request, Response } from "express";

export function authMiddleware(introspector: ITokenIntrospect): Handler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw ERR_TOKEN_INVALID.withLog("Token is missing");
    }

    // 2. Check if token is blacklisted
    const blacklistService = new TokenBlacklistService();
    const isBlacklisted = await blacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw ERR_TOKEN_INVALID.withLog("Token has been revoked");
    }

    // 3. Introspect token
    const { payload, error, isOk } = await introspector.introspect(token);

    if (!isOk) {
      throw ERR_TOKEN_INVALID.withLog("Token parse failed").withLog(
        error?.message || ""
      );
    }

    const requester = payload as Requester;

    // 4. Set requester to res.locals
    res.locals["requester"] = requester;

    return next();
  };
}