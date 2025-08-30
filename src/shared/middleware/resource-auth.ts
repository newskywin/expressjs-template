import { Requester } from "@shared/interfaces";
import { Permission } from "@shared/model/permissions";
import { hasPermission } from "@modules/user/model/role-permissions";
import { Handler, NextFunction, Request, Response } from "express";

export interface ResourceOwnershipCheck {
  resourceIdParam?: string;
  resourceIdBody?: string;
  userIdField?: string;
  customCheck?: (req: Request, requester: Requester) => Promise<boolean> | boolean;
}

export const requireResourceOwnershipOrPermission = (
  permission: Permission,
  ownershipCheck: ResourceOwnershipCheck
): Handler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!res.locals.requester) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const requester = res.locals.requester as Requester;

    if (hasPermission(requester.role, permission)) {
      return next();
    }

    let isOwner = false;

    if (ownershipCheck.customCheck) {
      try {
        isOwner = await ownershipCheck.customCheck(req, requester);
      } catch (error) {
        return res.status(500).json({ error: 'Internal server error during ownership check' });
      }
    } else {
      const resourceUserId = ownershipCheck.resourceIdParam 
        ? req.params[ownershipCheck.resourceIdParam]
        : ownershipCheck.resourceIdBody 
        ? req.body[ownershipCheck.resourceIdBody]
        : null;

      if (!resourceUserId) {
        return res.status(400).json({ error: 'Resource identifier not found' });
      }

      isOwner = requester.sub === resourceUserId;
    }

    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Forbidden: You can only access your own resources or need administrative permissions',
        required: permission
      });
    }

    next();
  };
};

export const requireOwnership = (ownershipCheck: ResourceOwnershipCheck): Handler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!res.locals.requester) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const requester = res.locals.requester as Requester;
    let isOwner = false;

    if (ownershipCheck.customCheck) {
      try {
        isOwner = await ownershipCheck.customCheck(req, requester);
      } catch (error) {
        return res.status(500).json({ error: 'Internal server error during ownership check' });
      }
    } else {
      const resourceUserId = ownershipCheck.resourceIdParam 
        ? req.params[ownershipCheck.resourceIdParam]
        : ownershipCheck.resourceIdBody 
        ? req.body[ownershipCheck.resourceIdBody]
        : null;

      if (!resourceUserId) {
        return res.status(400).json({ error: 'Resource identifier not found' });
      }

      isOwner = requester.sub === resourceUserId;
    }

    if (!isOwner) {
      return res.status(403).json({ 
        error: 'Forbidden: You can only access your own resources'
      });
    }

    next();
  };
};
