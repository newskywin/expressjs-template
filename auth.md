# Authentication & Authorization Improvement Plan

## Current Architecture Analysis

Your current authentication/authorization system follows a clean modular architecture with:
- **User Module**: Handles authentication logic (login/register/profile)
- **JWT Token Service**: Token generation and verification
- **Middleware Layer**: Auth middleware and role-based access control
- **RPC Client**: Token introspection for microservices
- **Repository Pattern**: Clean data access layer

## Improvement Plan (Minimal Changes Required)

### 1. **Enhanced Security & Token Management**

#### 1.1 Refresh Token Implementation
**Files to modify/add:**
- `src/shared/interfaces/index.ts` - Add refresh token interfaces
- `src/shared/components/jwt.ts` - Extend JWT service
- `src/modules/user/service/index.ts` - Add refresh token logic
- `src/modules/user/controller/rest.ts` - Add refresh endpoint

**Changes:**
```typescript
// update to interfaces
interface ITokenProvider {
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
  generateRefreshToken(payload: TokenPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;
}

// Add refresh token endpoints
POST /v1/auth/refresh
POST /v1/auth/logout
```

#### 1.2 Token Blacklisting
**Files to modify:**
- `src/shared/components/redis.ts` - Leverage existing Redis
- `src/modules/user/service/index.ts` - Add logout logic
- `src/shared/middleware/auth.ts` - Check blacklist

**Implementation:**
- Use existing Redis for token blacklisting
- Add logout endpoint to blacklist tokens
- Minimal changes to auth middleware

### 2. **Enhanced Authorization (RBAC)**

#### 2.1 Permission-Based Access Control
**Files to add:**
- `src/shared/model/permissions.ts` - Define permissions
- `src/shared/middleware/require-permissions.ts` - Permission middleware
- `src/modules/user/model/role-permissions.ts` - Role-permission mapping

**Current Role System Enhancement:**
```typescript
// Extend existing UserRole enum
export enum Permission {
  USER_READ = "user:read",
  USER_WRITE = "user:write", 
  USER_DELETE = "user:delete",
  POST_READ = "post:read",
  POST_WRITE = "post:write",
  POST_DELETE = "post:delete",
  TOPIC_MANAGE = "topic:manage",
  ADMIN_PANEL = "admin:panel"
}

// Role-Permission mapping (keeps existing roles)
const ROLE_PERMISSIONS = {
  [UserRole.USER]: [Permission.USER_READ, Permission.POST_READ, Permission.POST_WRITE],
  [UserRole.ADMIN]: Object.values(Permission), // All permissions
};
```

#### 2.2 Resource-Level Authorization
**Files to modify:**
- `src/shared/middleware/resource-auth.ts` - New middleware
- Apply to existing controllers without changing core logic

### 3. **Account Security Enhancements**

#### 3.1 Account Lockout Protection
**Files to modify:**
- `src/modules/user/model/index.ts` - Add lockout fields to schema
- `src/modules/user/service/index.ts` - Add lockout logic
- Database migration for new fields

**Schema Addition:**
```typescript
// Add to existing User model
loginAttempts: z.number().default(0),
lockUntil: z.date().nullable().optional(),
lastLoginAt: z.date().nullable().optional(),
```

#### 3.2 Password Policy & Validation
**Files to modify:**
- `src/modules/user/model/index.ts` - Enhance password validation
- `src/modules/user/service/index.ts` - Add password history check

### 4. **Session Management**

#### 4.1 Multi-Device Session Tracking
**Files to add:**
- `src/modules/user/model/session.ts` - Session model
- `src/modules/user/repository/session-repo.ts` - Session repository
- `src/modules/user/service/session-service.ts` - Session management

**Implementation:**
- Track active sessions per user
- Allow users to view/revoke sessions
- Leverage existing Redis for session storage

### 5. **Audit & Monitoring**

#### 5.1 Authentication Audit Log
**Files to add:**
- `src/shared/model/audit-log.ts` - Audit log model
- `src/shared/components/audit-logger.ts` - Audit service
- `src/modules/user/service/audit-service.ts` - User-specific audits

**Integration:**
- Log authentication events
- Use existing event system for audit events
- Minimal changes to existing controllers

### 6. **API Rate Limiting**

#### 6.1 Authentication Rate Limiting
**Files to add:**
- `src/shared/middleware/rate-limit.ts` - Rate limiting middleware
- Use existing Redis for rate limit storage

**Implementation:**
```typescript
// Apply to auth endpoints
app.use('/v1/auth/login', rateLimitMiddleware({ max: 5, windowMs: 15 * 60 * 1000 }));
app.use('/v1/register', rateLimitMiddleware({ max: 3, windowMs: 60 * 60 * 1000 }));
```

### 7. **Two-Factor Authentication (2FA)**

#### 7.1 TOTP Implementation
**Files to add:**
- `src/modules/user/model/two-factor.ts` - 2FA model
- `src/modules/user/service/two-factor-service.ts` - 2FA logic
- `src/modules/user/controller/two-factor.ts` - 2FA endpoints

**Database Changes:**
```typescript
// Add to User model
isTwoFactorEnabled: z.boolean().default(false),
twoFactorSecret: z.string().nullable().optional(),
backupCodes: z.array(z.string()).optional(),
```

## Implementation Priority

### Phase 1 (High Priority - Security Critical)
1. **Refresh Token Implementation** - Immediate security improvement
2. **Token Blacklisting** - Prevent token replay attacks
3. **Account Lockout Protection** - Prevent brute force attacks
4. **Rate Limiting** - DDoS protection

### Phase 2 (Medium Priority - Enhanced Authorization)
1. **Permission-Based Access Control** - Fine-grained authorization
2. **Resource-Level Authorization** - Secure resource access
3. **Session Management** - Multi-device support

### Phase 3 (Lower Priority - Advanced Features)
1. **Two-Factor Authentication** - Additional security layer
2. **Audit Logging** - Compliance and monitoring
3. **Password Policy Enhancement** - Stronger password requirements

## Database Migration Strategy

### Required Schema Changes
```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN lock_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN is_two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL;

-- New tables
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

## Configuration Updates

### Environment Variables to Add
```env
# Token settings
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Security settings
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=15m
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# 2FA settings
TWO_FACTOR_ISSUER=YourAppName
TWO_FACTOR_BACKUP_CODES_COUNT=10
```

## Benefits of This Plan

### 1. **Minimal Code Changes**
- Leverages existing architecture patterns
- Uses existing Redis infrastructure
- Maintains current API structure
- No breaking changes to existing endpoints

### 2. **Follows Your Architecture**
- Maintains modular structure
- Uses existing repository pattern
- Leverages current middleware system
- Follows existing error handling patterns

### 3. **Incremental Implementation**
- Can be implemented in phases
- Each phase provides immediate value
- No need for major refactoring
- Backward compatible

### 4. **Enhanced Security**
- Addresses common security vulnerabilities
- Implements industry best practices
- Provides comprehensive audit trail
- Protects against common attacks

### 5. **Scalability**
- Uses existing Redis for distributed caching
- Maintains stateless architecture
- Supports microservices pattern
- Easy to scale horizontally

## Next Steps

1. **Review and approve this plan**
2. **Start with Phase 1 implementations**
3. **Create detailed task breakdown for each feature**
4. **Set up development timeline**
5. **Plan database migrations**
6. **Update API documentation**

This plan ensures your authentication and authorization system becomes enterprise-grade while maintaining your clean architecture and requiring minimal changes to your existing codebase.
