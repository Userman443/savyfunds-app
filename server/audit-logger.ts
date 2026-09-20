import { Request } from 'express';
import { db } from './db.js';
import { auditLogs, type InsertAuditLog } from '../shared/schema.js';

/**
 * Audit Logger Service
 * Comprehensive security and action logging for compliance and monitoring
 */

interface AuditContext {
  userId?: number;
  email?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  req?: Request;
  sessionId?: string;
}

/**
 * Log a security or business action to the audit trail
 */
export async function logAuditEvent(context: AuditContext): Promise<void> {
  try {
    const auditData: InsertAuditLog = {
      userId: context.userId || null,
      email: context.email || null,
      action: context.action,
      resource: context.resource || null,
      resourceId: context.resourceId || null,
      details: context.details || null,
      ipAddress: context.req ? getClientIp(context.req) : null,
      userAgent: context.req?.get('User-Agent') || null,
      sessionId: context.sessionId || context.req?.sessionID || null,
      success: context.success ?? true,
      errorMessage: context.errorMessage || null,
    };

    await db.insert(auditLogs).values(auditData);
  } catch (error) {
    // Never let audit logging break the main application flow
    console.error('Audit logging failed:', error);
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'login' | 'logout' | 'register' | 'failed_login' | 'account_locked',
  email: string,
  req: Request,
  options: {
    userId?: number;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  } = {}
): Promise<void> {
  await logAuditEvent({
    userId: options.userId,
    email,
    action,
    resource: 'authentication',
    success: options.success,
    errorMessage: options.errorMessage,
    details: options.details,
    req,
  });
}

/**
 * Log user data modifications
 */
export async function logUserDataEvent(
  action: 'create' | 'update' | 'delete' | 'view',
  resource: 'user' | 'profile' | 'goal' | 'password',
  userId: number,
  resourceId: string,
  req: Request,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `${resource}_${action}`,
    resource,
    resourceId,
    details,
    req,
  });
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  action: 'password_change' | 'email_verification' | 'suspicious_activity' | 'rate_limit_exceeded',
  userId: number,
  req: Request,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    action,
    resource: 'security',
    details,
    req,
  });
}

/**
 * Log API access events
 */
export async function logApiEvent(
  action: string,
  endpoint: string,
  req: Request,
  options: {
    userId?: number;
    success?: boolean;
    errorMessage?: string;
    responseTime?: number;
  } = {}
): Promise<void> {
  await logAuditEvent({
    userId: options.userId,
    action,
    resource: 'api',
    resourceId: endpoint,
    details: {
      method: req.method,
      endpoint,
      responseTime: options.responseTime,
    },
    success: options.success,
    errorMessage: options.errorMessage,
    req,
  });
}

/**
 * Log financial data access
 */
export async function logFinancialEvent(
  action: 'view' | 'create' | 'update' | 'delete',
  resource: 'goal' | 'budget' | 'transaction',
  userId: number,
  resourceId: string,
  req: Request,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `financial_${action}`,
    resource: `financial_${resource}`,
    resourceId,
    details,
    req,
  });
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string | null {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    null
  );
}

/**
 * Middleware to automatically log API requests
 */
export function auditMiddleware() {
  return async (req: Request, res: any, next: any) => {
    const startTime = Date.now();
    
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseLogged = false;

    res.json = function(body: any) {
      if (!responseLogged) {
        responseLogged = true;
        const responseTime = Date.now() - startTime;
        
        // Log API access
        logApiEvent(
          'api_request',
          req.path,
          req,
          {
            userId: (req.session as any)?.userId,
            success: res.statusCode < 400,
            errorMessage: res.statusCode >= 400 ? body?.error : undefined,
            responseTime,
          }
        );
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Get audit logs for a specific user (admin only)
 */
export async function getUserAuditLogs(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit)
    .offset(offset);
}

/**
 * Get security events within date range
 */
export async function getSecurityEvents(
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  return await db
    .select()
    .from(auditLogs)
    .where(
      and(
        gte(auditLogs.timestamp, startDate),
        lte(auditLogs.timestamp, endDate),
        or(
          eq(auditLogs.resource, 'security'),
          eq(auditLogs.resource, 'authentication')
        )
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

// Additional imports needed
import { eq, desc, and, gte, lte, or } from 'drizzle-orm';