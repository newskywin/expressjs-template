export enum Permission {
  USER_READ = "user:read",
  USER_WRITE = "user:write",
  USER_DELETE = "user:delete",
  USER_ADMIN = "user:admin",
  
  POST_READ = "post:read",
  POST_WRITE = "post:write",
  POST_DELETE = "post:delete",
  POST_ADMIN = "post:admin",
  
  TOPIC_READ = "topic:read",
  TOPIC_WRITE = "topic:write",
  TOPIC_DELETE = "topic:delete",
  TOPIC_ADMIN = "topic:admin",
  
  ADMIN_PANEL = "admin:panel",
}

export type PermissionSet = Set<Permission>;
