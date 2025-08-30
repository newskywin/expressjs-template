# Enhanced Authorization (RBAC) Implementation Guide

## Overview

This document describes the implementation of Role-Based Access Control (RBAC) with permissions-based authorization in the Express.js application. The new system provides fine-grained control over user access to resources and operations.

## Architecture

### 1. Permission System

#### Permissions Model (`src/shared/model/permissions.ts`)
```typescript
export enum Permission {
  // User permissions
  USER_READ = "user:read",
  USER_WRITE = "user:write", 
  USER_DELETE = "user:delete",
  USER_ADMIN = "user:admin",
  
  // Post permissions
  POST_READ = "post:read",
  POST_WRITE = "post:write",
  POST_DELETE = "post:delete",
  POST_ADMIN = "post:admin",
  
  // Topic permissions
  TOPIC_READ = "topic:read",
  TOPIC_WRITE = "topic:write",
  TOPIC_DELETE = "topic:delete",
  TOPIC_ADMIN = "topic:admin",
  
  // Admin permissions
  ADMIN_PANEL = "admin:panel",
}
```

#### Role-Permission Mapping (`src/modules/user/model/role-permissions.ts`)
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.USER_READ,
    Permission.POST_READ,
    Permission.POST_WRITE,
    Permission.TOPIC_READ,
  ],
  [UserRole.ADMIN]: Object.values(Permission), // All permissions
};
```

### 2. Middleware System

#### Permission-Based Middleware (`src/shared/middleware/require-permissions.ts`)
- `requirePermission(permission)` - Requires a specific permission
- `requireAnyPermission(permissions[])` - Requires any of the specified permissions
- `requireAllPermissions(permissions[])` - Requires all of the specified permissions

#### Resource-Level Authorization (`src/shared/middleware/resource-auth.ts`)
- `requireResourceOwnershipOrPermission(permission, ownershipCheck)` - Allows access if user owns the resource OR has the required permission
- `requireOwnership(ownershipCheck)` - Strict ownership check

### 3. Enhanced MdlFactory Interface
```typescript
export interface MdlFactory {
  auth: Handler;
  optAuth: Handler;
  allowRoles: (roles: UserRole[]) => Handler; // Legacy support
  requirePermission: (permission: Permission) => Handler;
  requireAnyPermission: (permissions: Permission[]) => Handler;
  requireAllPermissions: (permissions: Permission[]) => Handler;
}
```

## Implementation Details

### User Module Authorization

#### Public Endpoints (No Authentication)
- `POST /v1/register` - User registration
- `POST /v1/authenticate` - User login

#### Authenticated Endpoints
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout user
- `GET /v1/profile` - Get user profile
- `PATCH /v1/profile` - Update user profile
- `GET /v1/auth/permissions` - Get user's permissions (NEW)

#### Admin-Only Endpoints
- `POST /v1/users` - Create new user (requires `USER_WRITE`)
- `GET /v1/users` - List all users (requires `USER_READ`)
- `GET /v1/users/:id` - Get user details (requires `USER_READ`)
- `PATCH /v1/users/:id` - Update any user (requires `USER_ADMIN`)
- `DELETE /v1/users/:id` - Delete user (requires `USER_DELETE`)

### Post Module Authorization

#### Public Endpoints
- `GET /v1/posts` - List posts (with optional authentication for personalization)
- `GET /v1/posts/:id` - Get post details (with optional authentication)

#### Authenticated Endpoints
- `POST /v1/posts` - Create post (requires `POST_WRITE`)

#### Owner or Admin Endpoints
- `PATCH /v1/posts/:id` - Update post (owner or `POST_ADMIN` permission)
- `DELETE /v1/posts/:id` - Delete post (owner or `POST_DELETE` permission)

### Topic Module Authorization

#### Public Endpoints
- `GET /v1/topics` - List topics
- `GET /v1/topics/:id` - Get topic details

#### Admin-Only Endpoints
- `POST /v1/topics` - Create topic (requires `TOPIC_WRITE`)
- `PATCH /v1/topics/:id` - Update topic (requires `TOPIC_WRITE`)
- `DELETE /v1/topics/:id` - Delete topic (requires `TOPIC_DELETE`)

## API Response Changes

### Enhanced Error Messages
The new permission system provides more descriptive error messages:

```json
{
  "error": "Forbidden: Insufficient permissions",
  "required": "user:admin"
}
```

### New Permissions Endpoint
`GET /v1/auth/permissions` returns:
```json
{
  "data": {
    "userId": "user-uuid",
    "role": "user",
    "permissions": [
      "user:read",
      "post:read", 
      "post:write",
      "topic:read"
    ]
  }
}
```

## Permission Matrix

| Resource | Operation | USER Permissions | ADMIN Permissions |
|----------|-----------|------------------|-------------------|
| **Users** | Read Own Profile | ✅ (via auth) | ✅ |
| | Update Own Profile | ✅ (via auth) | ✅ |
| | Read All Users | ❌ | ✅ (`USER_READ`) |
| | Create Users | ❌ | ✅ (`USER_WRITE`) |
| | Update Any User | ❌ | ✅ (`USER_ADMIN`) |
| | Delete Users | ❌ | ✅ (`USER_DELETE`) |
| **Posts** | Read Posts | ✅ (`POST_READ`) | ✅ |
| | Create Posts | ✅ (`POST_WRITE`) | ✅ |
| | Update Own Posts | ✅ (ownership) | ✅ |
| | Update Any Post | ❌ | ✅ (`POST_ADMIN`) |
| | Delete Own Posts | ✅ (ownership) | ✅ |
| | Delete Any Post | ❌ | ✅ (`POST_DELETE`) |
| **Topics** | Read Topics | ✅ (`TOPIC_READ`) | ✅ |
| | Create Topics | ❌ | ✅ (`TOPIC_WRITE`) |
| | Update Topics | ❌ | ✅ (`TOPIC_WRITE`) |
| | Delete Topics | ❌ | ✅ (`TOPIC_DELETE`) |

## Backward Compatibility

The implementation maintains backward compatibility with the existing role-based system:
- Old `allowRoles([UserRole.ADMIN])` middleware still works
- All existing endpoints function as before
- New permission-based middleware provides additional granular control

## Usage Examples

### Using Permission Middleware
```typescript
// Require specific permission
router.post('/users', 
  mdlFactory.auth, 
  mdlFactory.requirePermission(Permission.USER_WRITE), 
  controller.createUser
);

// Require any of multiple permissions
router.get('/admin-data', 
  mdlFactory.auth,
  mdlFactory.requireAnyPermission([Permission.USER_ADMIN, Permission.ADMIN_PANEL]),
  controller.getAdminData
);

// Resource ownership or admin permission
router.patch('/posts/:id',
  mdlFactory.auth,
  requireResourceOwnershipOrPermission(Permission.POST_ADMIN, {
    customCheck: checkPostOwnership
  }),
  controller.updatePost
);
```

### Checking Permissions Programmatically
```typescript
import { hasPermission, getUserPermissions } from '@modules/user/model/role-permissions';

// Check if user has specific permission
const canDeleteUsers = hasPermission(userRole, Permission.USER_DELETE);

// Get all permissions for a role
const permissions = getUserPermissions(UserRole.USER);
```

## Benefits

1. **Fine-Grained Control**: Permissions provide more granular access control than simple roles
2. **Resource-Level Security**: Users can manage their own resources while admins have broader access
3. **Extensibility**: Easy to add new permissions and resources
4. **Clear Authorization**: Descriptive error messages help with debugging
5. **Maintainability**: Centralized permission definitions and role mappings
6. **Backward Compatibility**: Existing code continues to work unchanged

## Future Enhancements

1. **Dynamic Permissions**: Store permissions in database for runtime configuration
2. **Permission Inheritance**: Create permission hierarchies 
3. **API Rate Limiting**: Different limits based on user permissions
4. **Audit Logging**: Track permission-based actions
5. **UI Integration**: Frontend permission checking utilities

## Testing the Implementation

You can test the new RBAC system using these endpoints:

1. **Get User Permissions**: `GET /v1/auth/permissions` (requires auth)
2. **Test Admin Operations**: Try accessing admin-only endpoints as a regular user
3. **Test Resource Ownership**: Try updating/deleting posts as owner vs. non-owner
4. **Test Permission Errors**: Check that error messages are descriptive

The enhanced authorization system provides a solid foundation for secure, scalable access control while maintaining compatibility with the existing codebase.
