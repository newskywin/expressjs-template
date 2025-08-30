import { ITokenIntrospect, MdlFactory } from "@shared/interfaces";
import { authMiddleware } from "./auth";
import { NextFunction, Request, Response } from "express";
import { allowRoles } from "./allow-roles";
import { requirePermission, requireAnyPermission, requireAllPermissions } from "./require-permissions";
export const setupMiddlewares = (
  introspector: ITokenIntrospect
): MdlFactory => {
  const auth = authMiddleware(introspector);

  //optional authen
  const optAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await auth(req, res, next);
    } catch (e) {
      next();
    }
  };

  return {
    auth,
    optAuth,
    allowRoles,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
  };
};