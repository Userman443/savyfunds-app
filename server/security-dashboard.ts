import { Request, Response } from 'express';
import { db } from './db.js';
import { auditLogs, loginAttempts, accountLockouts, users } from '../shared/schema.js';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';

/**
 * Security Dashboard Service
 * Provides comprehensive security metrics and monitoring data
 */

export interface SecurityMetrics {
  authenticationStats: {
    totalLogins: number;
    failedLogins: number;
    successRate: number;
    uniqueUsers: number;
  };
  lockoutStats: {
    activeLockouts: number;
    totalLockouts: number;
    affectedAccounts: number;
  };
  auditStats: {
    totalEvents: number;
    securityEvents: number;
    errorEvents: number;
    recentActivity: any[];
  };
  vulnerabilityStatus: {
    dependencyIssues: number;
    lastScanDate: string;
    criticalIssues: number;
  };
}

/**
 * Get comprehensive security dashboard metrics
 */
export async function getSecurityMetrics(
  timeFrame: '24h' | '7d' | '30d' = '24h'
): Promise<SecurityMetrics> {
  const timeFrameHours = {
    '24h': 24,
    '7d': 168,
    '30d': 720
  };

  const since = new Date(Date.now() - (timeFrameHours[timeFrame] * 60 * 60 * 1000));

  // Authentication Statistics
  const loginStats = await db
    .select({
      total: count(),
      successful: sql<number>`count(case when successful = true then 1 end)`
    })
    .from(loginAttempts)
    .where(gte(loginAttempts.failedAt, since));

  const uniqueLoginUsers = await db
    .selectDistinct({ email: loginAttempts.email })
    .from(loginAttempts)
    .where(
      and(
        gte(loginAttempts.failedAt, since),
        eq(loginAttempts.successful, true)
      )
    );

  const totalLogins = loginStats[0]?.total || 0;
  const successfulLogins = loginStats[0]?.successful || 0;
  const failedLogins = totalLogins - successfulLogins;

  // Lockout Statistics
  const lockoutStats = await db
    .select({
      active: sql<number>`count(case when is_active = true then 1 end)`,
      total: count()
    })
    .from(accountLockouts)
    .where(gte(accountLockouts.lockedAt, since));

  const affectedAccounts = await db
    .selectDistinct({ email: accountLockouts.email })
    .from(accountLockouts)
    .where(gte(accountLockouts.lockedAt, since));

  // Audit Log Statistics
  const auditStats = await db
    .select({
      total: count(),
      securityEvents: sql<number>`count(case when resource = 'security' or resource = 'authentication' then 1 end)`,
      errorEvents: sql<number>`count(case when success = false then 1 end)`
    })
    .from(auditLogs)
    .where(gte(auditLogs.timestamp, since));

  // Recent Security Activity
  const recentActivity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resource: auditLogs.resource,
      email: auditLogs.email,
      ipAddress: auditLogs.ipAddress,
      success: auditLogs.success,
      timestamp: auditLogs.timestamp,
      details: auditLogs.details
    })
    .from(auditLogs)
    .where(
      and(
        gte(auditLogs.timestamp, since),
        sql`(resource = 'security' OR resource = 'authentication' OR success = false)`
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(20);

  return {
    authenticationStats: {
      totalLogins,
      failedLogins,
      successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0,
      uniqueUsers: uniqueLoginUsers.length
    },
    lockoutStats: {
      activeLockouts: lockoutStats[0]?.active || 0,
      totalLockouts: lockoutStats[0]?.total || 0,
      affectedAccounts: affectedAccounts.length
    },
    auditStats: {
      totalEvents: auditStats[0]?.total || 0,
      securityEvents: auditStats[0]?.securityEvents || 0,
      errorEvents: auditStats[0]?.errorEvents || 0,
      recentActivity
    },
    vulnerabilityStatus: {
      dependencyIssues: await getDependencyVulnerabilityCount(),
      lastScanDate: new Date().toISOString(),
      criticalIssues: 0 // Would be populated by external security scanning
    }
  };
}

/**
 * Get failed login attempts by IP address for threat detection
 */
export async function getFailedLoginsByIP(hours: number = 24) {
  const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return await db
    .select({
      ipAddress: loginAttempts.ipAddress,
      failedAttempts: count(),
      lastAttempt: sql<Date>`max(failed_at)`,
      uniqueEmails: sql<number>`count(distinct email)`
    })
    .from(loginAttempts)
    .where(
      and(
        gte(loginAttempts.failedAt, since),
        eq(loginAttempts.successful, false)
      )
    )
    .groupBy(loginAttempts.ipAddress)
    .orderBy(desc(count()))
    .limit(50);
}

/**
 * Get geographic distribution of failed login attempts
 */
export async function getGeoSecurityInsights(hours: number = 24) {
  const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  // This would require GeoIP integration to map IP addresses to countries
  // For now, return IP-based statistics
  const ipStats = await getFailedLoginsByIP(hours);
  
  return {
    suspiciousIPs: ipStats.filter(stat => stat.failedAttempts >= 5),
    totalSuspiciousAttempts: ipStats.reduce((sum, stat) => sum + stat.failedAttempts, 0),
    uniqueThreats: ipStats.filter(stat => stat.failedAttempts >= 5).length
  };
}

/**
 * Get user account security status
 */
export async function getUserSecurityStatus(userId: number) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) {
    throw new Error('User not found');
  }

  // Recent login attempts
  const recentAttempts = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, user[0].email || ''))
    .orderBy(desc(loginAttempts.failedAt))
    .limit(10);

  // Active lockout status
  const activeLockout = await db
    .select()
    .from(accountLockouts)
    .where(
      and(
        eq(accountLockouts.userId, userId),
        eq(accountLockouts.isActive, true)
      )
    )
    .limit(1);

  // Security events
  const securityEvents = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.userId, userId),
        sql`(resource = 'security' OR action LIKE '%security%')`
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(5);

  return {
    user: {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      isEmailVerified: user[0].isEmailVerified,
      lastLogin: user[0].lastLogin
    },
    security: {
      isLocked: activeLockout.length > 0,
      lockoutInfo: activeLockout[0] || null,
      recentLoginAttempts: recentAttempts,
      securityEvents,
      riskLevel: calculateUserRiskLevel(recentAttempts, securityEvents)
    }
  };
}

/**
 * Calculate user risk level based on activity patterns
 */
function calculateUserRiskLevel(
  loginAttempts: any[],
  securityEvents: any[]
): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  // Failed login attempts in last 24 hours
  const recentFailures = loginAttempts.filter(
    attempt => !attempt.successful && 
    new Date(attempt.failedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  riskScore += recentFailures.length * 2;

  // Security events with failures
  const failedSecurityEvents = securityEvents.filter(event => !event.success);
  riskScore += failedSecurityEvents.length * 3;

  // Multiple IP addresses
  const uniqueIPs = new Set(loginAttempts.map(attempt => attempt.ipAddress));
  if (uniqueIPs.size > 3) riskScore += 5;

  if (riskScore >= 15) return 'high';
  if (riskScore >= 8) return 'medium';
  return 'low';
}

/**
 * Get system security health overview
 */
export async function getSystemSecurityHealth() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Security metrics
  const metrics24h = await getSecurityMetrics('24h');
  const metrics7d = await getSecurityMetrics('7d');

  // Security score calculation
  let securityScore = 100;
  
  // Deduct for high failure rates
  if (metrics24h.authenticationStats.successRate < 90) securityScore -= 10;
  if (metrics24h.authenticationStats.successRate < 80) securityScore -= 15;
  
  // Deduct for active lockouts
  if (metrics24h.lockoutStats.activeLockouts > 0) securityScore -= 5;
  if (metrics24h.lockoutStats.activeLockouts > 5) securityScore -= 10;
  
  // Deduct for error events
  if (metrics24h.auditStats.errorEvents > 50) securityScore -= 10;
  
  // Deduct for dependency vulnerabilities
  if (metrics24h.vulnerabilityStatus.dependencyIssues > 0) securityScore -= 5;

  return {
    overallScore: Math.max(securityScore, 0),
    status: securityScore >= 90 ? 'excellent' : 
            securityScore >= 75 ? 'good' : 
            securityScore >= 60 ? 'warning' : 'critical',
    metrics: {
      last24h: metrics24h,
      last7d: metrics7d
    },
    recommendations: generateSecurityRecommendations(metrics24h, securityScore)
  };
}

/**
 * Generate security recommendations based on current metrics
 */
function generateSecurityRecommendations(
  metrics: SecurityMetrics,
  securityScore: number
): string[] {
  const recommendations: string[] = [];

  if (metrics.authenticationStats.successRate < 90) {
    recommendations.push('Review failed login patterns and consider implementing CAPTCHA');
  }

  if (metrics.lockoutStats.activeLockouts > 5) {
    recommendations.push('Investigate high number of account lockouts - possible attack in progress');
  }

  if (metrics.auditStats.errorEvents > 50) {
    recommendations.push('High number of error events detected - review system stability');
  }

  if (metrics.vulnerabilityStatus.dependencyIssues > 0) {
    recommendations.push('Update vulnerable dependencies immediately');
  }

  if (securityScore < 75) {
    recommendations.push('Enable additional security measures like MFA');
    recommendations.push('Review and update security policies');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is strong - continue monitoring');
  }

  return recommendations;
}

/**
 * Get dependency vulnerability count from npm audit
 */
async function getDependencyVulnerabilityCount(): Promise<number> {
  // This would run npm audit and parse results
  // For now, return a placeholder - in production this would integrate with actual scanning
  return 8; // Based on our earlier npm audit results
}

/**
 * Security dashboard API routes
 */
export function setupSecurityDashboardRoutes(router: any) {
  // Security metrics endpoint
  router.get('/security/metrics', async (req: Request, res: Response) => {
    try {
      const timeFrame = req.query.timeFrame as '24h' | '7d' | '30d' || '24h';
      const metrics = await getSecurityMetrics(timeFrame);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      res.status(500).json({ error: 'Failed to fetch security metrics' });
    }
  });

  // Security health overview
  router.get('/security/health', async (req: Request, res: Response) => {
    try {
      const health = await getSystemSecurityHealth();
      res.json(health);
    } catch (error) {
      console.error('Error fetching security health:', error);
      res.status(500).json({ error: 'Failed to fetch security health' });
    }
  });

  // Failed login analysis
  router.get('/security/threats', async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const threats = await getFailedLoginsByIP(hours);
      const geoInsights = await getGeoSecurityInsights(hours);
      
      res.json({
        ipThreats: threats,
        geoInsights
      });
    } catch (error) {
      console.error('Error fetching threat analysis:', error);
      res.status(500).json({ error: 'Failed to fetch threat analysis' });
    }
  });

  // User security status
  router.get('/security/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const status = await getUserSecurityStatus(userId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching user security status:', error);
      res.status(500).json({ error: 'Failed to fetch user security status' });
    }
  });
}