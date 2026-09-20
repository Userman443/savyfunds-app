import { Request } from 'express';
import { db } from './db.js';
import { loginAttempts, accountLockouts, users, type InsertLoginAttempt, type InsertAccountLockout } from '../shared/schema.js';
import { eq, and, gte, desc, count } from 'drizzle-orm';
import { logAuthEvent } from './audit-logger.js';

/**
 * Account Lockout Service
 * Handles failed login tracking and automatic account locking for security
 */

// Configuration
const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,           // Number of failed attempts before lockout
  LOCKOUT_DURATION_MINUTES: 30,    // How long account stays locked
  ATTEMPT_WINDOW_MINUTES: 15,      // Time window to count failed attempts
  PROGRESSIVE_LOCKOUT: true,        // Increase lockout time for repeat offenses
};

/**
 * Record a login attempt (successful or failed)
 */
export async function recordLoginAttempt(
  email: string,
  successful: boolean,
  req: Request
): Promise<void> {
  const attemptData: InsertLoginAttempt = {
    email: email.toLowerCase(),
    ipAddress: getClientIp(req),
    userAgent: req.get('User-Agent') || null,
    successful,
  };

  await db.insert(loginAttempts).values(attemptData);

  // If login failed, check if account should be locked
  if (!successful) {
    await checkAndLockAccount(email, req);
  }
}

/**
 * Check if an account should be locked based on failed attempts
 */
export async function checkAndLockAccount(email: string, req: Request): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();
  
  // Get recent failed attempts within the time window
  const timeWindow = new Date(Date.now() - (LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000));
  
  const recentFailures = await db
    .select({ count: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, normalizedEmail),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.failedAt, timeWindow)
      )
    );

  const failureCount = recentFailures[0]?.count || 0;

  if (failureCount >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    await lockAccount(normalizedEmail, failureCount, req);
    return true;
  }

  return false;
}

/**
 * Lock an account due to failed login attempts
 */
export async function lockAccount(
  email: string,
  attemptCount: number,
  req: Request
): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  // Check if account is already locked
  const existingLockout = await getActiveLockout(normalizedEmail);
  if (existingLockout) {
    return; // Already locked
  }

  // Get user ID if exists
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Calculate lockout duration (progressive lockout for repeat offenders)
  const lockoutDuration = calculateLockoutDuration(normalizedEmail);

  const lockoutData: InsertAccountLockout = {
    userId: user[0]?.id || null,
    email: normalizedEmail,
    lockReason: 'failed_login_attempts',
    attemptCount,
    isActive: true,
  };

  await db.insert(accountLockouts).values(lockoutData);

  // Log the lockout event
  await logAuthEvent('account_locked', normalizedEmail, req, {
    userId: user[0]?.id,
    success: false,
    details: {
      attemptCount,
      lockoutDurationMinutes: lockoutDuration,
      reason: 'Too many failed login attempts',
    },
  });
}

/**
 * Check if an account is currently locked
 */
export async function isAccountLocked(email: string): Promise<{
  isLocked: boolean;
  lockout?: any;
  remainingTime?: number;
}> {
  const normalizedEmail = email.toLowerCase();
  const activeLockout = await getActiveLockout(normalizedEmail);

  if (!activeLockout) {
    return { isLocked: false };
  }

  if (!activeLockout.lockedAt) {
    return { isLocked: false };
  }

  const lockoutEnd = new Date(
    activeLockout.lockedAt.getTime() + 
    (LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000)
  );

  const now = new Date();
  
  if (now >= lockoutEnd) {
    // Lockout has expired, unlock the account
    await unlockAccount(normalizedEmail);
    return { isLocked: false };
  }

  const remainingTime = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (1000 * 60));

  return {
    isLocked: true,
    lockout: activeLockout,
    remainingTime,
  };
}

/**
 * Get active lockout for an email
 */
async function getActiveLockout(email: string) {
  const lockouts = await db
    .select()
    .from(accountLockouts)
    .where(
      and(
        eq(accountLockouts.email, email.toLowerCase()),
        eq(accountLockouts.isActive, true)
      )
    )
    .orderBy(desc(accountLockouts.lockedAt))
    .limit(1);

  return lockouts[0] || null;
}

/**
 * Unlock an account (automatic or manual)
 */
export async function unlockAccount(email: string, reason: string = 'expired'): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  await db
    .update(accountLockouts)
    .set({
      isActive: false,
      unlockedAt: new Date(),
    })
    .where(
      and(
        eq(accountLockouts.email, normalizedEmail),
        eq(accountLockouts.isActive, true)
      )
    );
}

/**
 * Calculate progressive lockout duration
 */
async function calculateLockoutDuration(email: string): Promise<number> {
  if (!LOCKOUT_CONFIG.PROGRESSIVE_LOCKOUT) {
    return LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES;
  }

  // Count previous lockouts in the last 24 hours
  const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));
  
  const recentLockouts = await db
    .select({ count: count() })
    .from(accountLockouts)
    .where(
      and(
        eq(accountLockouts.email, email.toLowerCase()),
        gte(accountLockouts.lockedAt, last24Hours)
      )
    );

  const lockoutCount = recentLockouts[0]?.count || 0;

  // Progressive lockout: 30min, 1hr, 2hr, 4hr, 8hr
  const multiplier = Math.min(Math.pow(2, lockoutCount), 16);
  return LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * multiplier;
}

/**
 * Get recent failed attempts for monitoring
 */
export async function getRecentFailedAttempts(
  minutes: number = 60,
  limit: number = 100
) {
  const timeWindow = new Date(Date.now() - (minutes * 60 * 1000));
  
  return await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.successful, false),
        gte(loginAttempts.failedAt, timeWindow)
      )
    )
    .orderBy(desc(loginAttempts.failedAt))
    .limit(limit);
}

/**
 * Get lockout statistics for security monitoring
 */
export async function getLockoutStats(hours: number = 24) {
  const timeWindow = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  const stats = await db
    .select({
      totalLockouts: count(),
    })
    .from(accountLockouts)
    .where(gte(accountLockouts.lockedAt, timeWindow));

  const uniqueEmails = await db
    .selectDistinct({ email: accountLockouts.email })
    .from(accountLockouts)
    .where(gte(accountLockouts.lockedAt, timeWindow));

  return {
    totalLockouts: stats[0]?.totalLockouts || 0,
    uniqueAccounts: uniqueEmails.length,
    timeWindowHours: hours,
  };
}

/**
 * Reset failed attempts for an email (after successful login)
 */
export async function resetFailedAttempts(email: string): Promise<void> {
  // We don't delete the attempts for audit purposes, but we can mark successful login
  // The time-based window will naturally exclude old attempts
}

/**
 * Manually unlock account (admin function)
 */
export async function manualUnlockAccount(email: string, adminUserId: number): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();
  
  const result = await db
    .update(accountLockouts)
    .set({
      isActive: false,
      unlockedAt: new Date(),
      lockReason: `manually_unlocked_by_admin_${adminUserId}`,
    })
    .where(
      and(
        eq(accountLockouts.email, normalizedEmail),
        eq(accountLockouts.isActive, true)
      )
    );

  return true;
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Middleware to check account lockout before login attempts
 */
export function accountLockoutMiddleware() {
  return async (req: Request, res: any, next: any) => {
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const { email } = req.body;
      
      if (email) {
        const lockStatus = await isAccountLocked(email);
        
        if (lockStatus.isLocked) {
          return res.status(423).json({
            error: 'Account temporarily locked due to too many failed login attempts',
            remainingTime: lockStatus.remainingTime || 30,
            retryAfter: (lockStatus.remainingTime || 30) * 60, // seconds
          });
        }
      }
    }
    
    next();
  };
}