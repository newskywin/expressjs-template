import { UserRole } from "@shared/interfaces";
import { Permission } from "@shared/model/permissions";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.USER_READ,
    Permission.POST_READ,
    Permission.POST_WRITE,
    Permission.TOPIC_READ,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(userRole: UserRole, requiredPermission: Permission): boolean {
  const permissions = getUserPermissions(userRole);
  return permissions.includes(requiredPermission);
}

export function hasAnyPermission(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  const permissions = getUserPermissions(userRole);
  return requiredPermissions.some(permission => permissions.includes(permission));
}

export function hasAllPermissions(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  const permissions = getUserPermissions(userRole);
  return requiredPermissions.every(permission => permissions.includes(permission));
}
