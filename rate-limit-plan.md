# API Rate Limiting Implementation Plan

## Overview
Implement rate limiting middleware to protect authentication endpoints and other critical APIs from abuse, brute force attacks, and DDoS attempts. This plan follows the existing architecture patterns and minimizes code changes.

## Current Architecture Analysis

### Existing Components We Can Leverage
- **Redis**: Already configured in `src/shared/components/redis.ts`
- **Middleware Pattern**: Existing middleware in `src/shared/middleware/`
- **Express App**: Configured in `src/app.ts`
- **Configuration**: Existing config in `src/shared/components/config.ts`

## Implementation Strategy

### 1. Rate Limiting Middleware

#### 1.1 Core Middleware
**File to create:** `src/shared/middleware/rate-limit.ts`

**Features:**
- Sliding window rate limiting using Redis
- Configurable limits per endpoint
- IP-based and user-based rate limiting
- Graceful error responses
- Support for different time windows

#### 1.2 Rate Limiting Types
1. **IP-based Rate Limiting**: For unauthenticated endpoints
2. **User-based Rate Limiting**: For authenticated endpoints
3. **Global Rate Limiting**: For overall API protection

### 2. Configuration

#### 2.1 Environment Variables
Add to existing environment configuration:
```env
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_DEFAULT_MAX=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_REGISTER_WINDOW_MS=3600000  # 1 hour
```

#### 2.2 Configuration Interface
Extend existing `appConfig` in `src/shared/components/config.ts`:
```typescript
export const appConfig = {
  // ... existing config
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true' || true,
    default: {
      windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS || '900000'),
      max: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '100'),
    },
    auth: {
      login: {
        windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
      },
      register: {
        windowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS || '3600000'),
        max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '3'),
      },
    },
  },
};
```

### 3. Implementation Details

#### 3.1 Rate Limit Storage Strategy
- Use existing Redis instance for storing rate limit counters
- Key pattern: `rate_limit:{type}:{identifier}:{endpoint}`
- TTL-based expiration for automatic cleanup

#### 3.2 Rate Limit Algorithm
- **Sliding Window Counter**: More accurate than fixed window
- Store timestamps in Redis sorted sets
- Clean up old entries automatically

#### 3.3 Response Headers
Standard rate limiting headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

### 4. Middleware Integration

#### 4.2 Middleware Factory Integration
Follow your existing pattern by adding rate limiting to the `setupMiddlewares` function:
```typescript
// In src/shared/middleware/index.ts
export const setupMiddlewares = (
  introspector: ITokenIntrospect
): MdlFactory => {
  const auth = authMiddleware(introspector);
  const rateLimit = createRateLimitMiddleware; // New addition

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
    rateLimit, // Add to factory
  };
};
```

#### 4.3 Application Integration in index.ts
Apply rate limiting after Redis initialization but before route setup:
```typescript
// In src/index.ts
async function bootServer(port: number) {
  try {
    await RedisClient.init(appConfig.redis.url as string);
    const eventPublisher = await EventPublisherFactory.createPublisher();

    const introspector = new TokenIntrospectRPCClient(appConfig.rpc.introspectUrl);
    const MdlFactory = setupMiddlewares(introspector);

    // Apply global rate limiting
    if (appConfig.rateLimit.enabled) {
      app.use(MdlFactory.rateLimit(appConfig.rateLimit.default));
    }

    const serviceCtx: ServiceContext = {
      mdlFactory: MdlFactory,
      eventPublisher: eventPublisher,
    };

    // ... rest of setup
  }
}
```

### 5. Error Handling

#### 5.1 Rate Limit Exceeded Response
Follow existing error response pattern from `src/shared/ultils/reponses.ts`:
```typescript
{
  status: 'error',
  message: 'Too many requests',
  code: 'RATE_LIMIT_EXCEEDED',
  data: {
    retryAfter: 900, // seconds
    limit: 5,
    windowMs: 900000
  }
}
```

#### 5.2 Redis Connection Errors
Graceful degradation when Redis is unavailable:
- Log error to existing logger
- Allow requests to proceed (fail open)
- Optional: Fall back to in-memory rate limiting

### 6. Monitoring and Logging

#### 6.1 Rate Limit Events
Log rate limit violations using existing logger (`src/shared/ultils/logger.ts`):
```typescript
logger.warn('Rate limit exceeded', {
  ip: clientIp,
  userId: userId,
  endpoint: req.path,
  limit: options.max,
  windowMs: options.windowMs
});
```

#### 6.2 Metrics Collection
Track rate limiting metrics:
- Total requests blocked
- Top offending IPs
- Most hit-limited endpoints

## Files to Create/Modify

### Files to Create/Modify

### New Files
1. `src/shared/middleware/rate-limit.ts` - Main rate limiting middleware
2. `src/shared/interfaces/rate-limit.ts` - Rate limiting interfaces and types

### Files to Modify
1. `src/shared/components/config.ts` - Add rate limiting configuration to `appConfig`
2. `src/index.ts` - Apply global rate limiting middleware after Redis init
3. `src/shared/middleware/index.ts` - Add rate limit to `MdlFactory` export
4. `src/shared/interfaces/index.ts` - Export rate limiting interfaces
5. `src/modules/user/controller/rest.ts` - Apply specific rate limits to auth endpoints

### Files That Remain Unchanged
- `src/app.ts` - No changes needed as rate limiting is applied in `index.ts`
- `src/shared/components/redis.ts` - Already provides the Redis client we need
- `src/shared/ultils/error.ts` - May add rate limit error types if needed
- All repository and service files - No changes needed

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create rate limiting middleware with Redis backend
2. Add configuration support
3. Implement basic IP-based rate limiting

### Phase 2: Authentication Protection
1. Apply rate limiting to auth endpoints
2. Implement user-based rate limiting
3. Add proper error responses

### Phase 3: Enhanced Features
1. Add monitoring and logging
2. Implement graceful degradation
3. Add admin endpoints for rate limit management

## Benefits

### Security Benefits
- **Brute Force Protection**: Limits login attempts
- **DDoS Mitigation**: Prevents overwhelming the server
- **Resource Protection**: Limits abuse of expensive operations

### Architecture Benefits
- **Minimal Changes**: Uses existing infrastructure
- **Consistent Patterns**: Follows existing middleware pattern
- **Scalable**: Uses distributed Redis storage
- **Configurable**: Environment-based configuration

### Operational Benefits
- **Monitoring**: Clear logging and metrics
- **Debugging**: Rate limit headers for troubleshooting
- **Flexibility**: Per-endpoint configuration

## Testing Strategy

### Unit Tests
- Test rate limiting logic
- Test configuration parsing
- Test error handling

### Integration Tests
- Test with Redis backend
- Test middleware integration
- Test error scenarios

### Load Tests
- Verify rate limiting under load
- Test Redis performance
- Validate memory usage

## Deployment Considerations

### Redis Configuration
- Ensure Redis has sufficient memory for rate limit data
- Consider Redis persistence settings
- Monitor Redis performance

### Environment Variables
- Update deployment configurations
- Document new environment variables
- Set appropriate defaults

### Monitoring
- Set up alerts for high rate limit violations
- Monitor Redis memory usage
- Track rate limiting effectiveness

## Future Enhancements

### Advanced Features
- **Whitelisting**: Allow certain IPs to bypass limits
- **Dynamic Limits**: Adjust limits based on system load
- **Distributed Rate Limiting**: Multi-instance coordination

### Admin Features
- **Rate Limit Dashboard**: View current rate limits
- **Manual Override**: Temporarily adjust limits
- **Blacklist Management**: Block specific IPs/users

This plan ensures minimal disruption to your existing codebase while providing comprehensive rate limiting protection for your Express.js application.
