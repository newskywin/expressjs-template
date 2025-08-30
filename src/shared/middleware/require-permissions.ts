import { Requester } from "@shared/interfaces";
import { Permission } from "@shared/model/permissions";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@modules/user/model/role-permissions";
import { Handler, NextFunction, Request, Response } from "express";

export const requirePermission = (permission: Permission): Handler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!res.locals.requester) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const requester = res.locals.requester as Requester;

    if (!hasPermission(requester.role, permission)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: permission 
      });
    }

    next();
  };
};

export const requireAnyPermission = (permissions: Permission[]): Handler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!res.locals.requester) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const requester = res.locals.requester as Requester;

    if (!hasAnyPermission(requester.role, permissions)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: `Any of: ${permissions.join(', ')}` 
      });
    }

    next();
  };
};

export const requireAllPermissions = (permissions: Permission[]): Handler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!res.locals.requester) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const requester = res.locals.requester as Requester;

    if (!hasAllPermissions(requester.role, permissions)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: `All of: ${permissions.join(', ')}` 
      });
    }

    next();
  };
};
