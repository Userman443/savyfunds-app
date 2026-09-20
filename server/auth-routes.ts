import express, { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import { insertUserSchema, passwordSchema } from "@shared/schema";
import { sendVerificationEmail, resendVerificationEmail, isEmailConfigured } from "./email-service";
import { verifyReCaptchaToken } from "./recaptcha";
import { logAuthEvent, logUserDataEvent, logSecurityEvent } from "./audit-logger";
import { recordLoginAttempt, isAccountLocked, accountLockoutMiddleware, resetFailedAttempts } from "./account-lockout";

const router = express.Router();
const scryptAsync = promisify(scrypt);

// Registration form schema with reCAPTCHA
const registerSchema = insertUserSchema.extend({
  recaptchaToken: z.string().optional(),
});

/**
 * Hash a password using scrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a password with a stored hashed password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Check if the user's email is verified
 */
export function isEmailVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // No email service configured: verification emails can't be delivered,
  // so don't gate features on verification.
  if (!isEmailConfigured()) {
    return next();
  }

  storage.getUser(req.session.userId)
    .then(user => {
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "User not found" });
      }

      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          error: "Email not verified", 
          message: "Please verify your email address to access this feature" 
        });
      }

      next();
    })
    .catch(err => {
      console.error("Error checking email verification:", err);
      res.status(500).json({ error: "Server error" });
    });
}

// Apply account lockout middleware
router.use(accountLockoutMiddleware());

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      await logAuthEvent('register', req.body.email || 'unknown', req, {
        success: false,
        errorMessage: 'Validation failed',
        details: { errors: validationResult.error.errors }
      });
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      });
    }

    const { username, email, password, displayName, recaptchaToken } = validationResult.data;

    // Verify reCAPTCHA token if enabled
    if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
      // Make sure recaptchaToken is a string (not undefined)
      const tokenToVerify = recaptchaToken || "";
      const recaptchaValid = await verifyReCaptchaToken(tokenToVerify, "register");
      if (!recaptchaValid) {
        return res.status(400).json({ error: "reCAPTCHA verification failed" });
      }
    }

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      await logAuthEvent('register', email || username, req, {
        success: false,
        errorMessage: 'Username already exists',
        details: { username }
      });
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        await logAuthEvent('register', email, req, {
          success: false,
          errorMessage: 'Email already registered',
          details: { email }
        });
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // Create the user with default values
    const hashedPassword = await hashPassword(password);
    const newUser = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      // No email service configured: mark verified so the account is usable
      // (verification emails can't be delivered without a mail provider).
      isEmailVerified: !isEmailConfigured(),
      verificationToken: null,
      verificationTokenExpiry: null,
      ipAddress: req.ip || null,
      lastLogin: new Date(),
    });

    // Start a session for the new user
    req.session.userId = newUser.id;

    // Send verification email if email provided (optional - don't block registration if it fails)
    let emailSent = false;
    if (email) {
      try {
        emailSent = await sendVerificationEmail(newUser.id, email, username);
        console.log(`Verification email sent to ${email}`);
      } catch (error) {
        console.warn(`Failed to send verification email to ${email}:`, error);
        // Don't block registration if email fails
      }
    }

    // Log successful registration
    await logAuthEvent('register', email || username, req, {
      userId: newUser.id,
      success: true,
      details: { 
        username,
        emailProvided: !!email,
        emailSent
      }
    });

    // Log user creation
    await logUserDataEvent('create', 'user', newUser.id, newUser.id.toString(), req, {
      username,
      email,
      registrationMethod: 'email_password'
    });

    // Return user data (excluding password)
    const { password: _, ...userData } = newUser;
    res.status(201).json({ 
      user: userData,
      emailSent,
      message: emailSent 
        ? "Registration successful. Please check your email to verify your account." 
        : "Registration successful."
    });
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logAuthEvent('register', req.body?.email || 'unknown', req, {
      success: false,
      errorMessage,
      details: { error: String(error) }
    });
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Verify email
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    // Find user by verification token
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({ error: "Verification token has expired" });
    }

    // Mark email as verified
    await storage.verifyUserEmail(user.id);

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// Resend verification email
router.post("/resend-verification", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    if (!user.email) {
      return res.status(400).json({ error: "No email address associated with this account" });
    }

    const emailSent = await resendVerificationEmail(userId);

    if (emailSent) {
      res.json({ success: true, message: "Verification email sent" });
    } else {
      res.status(500).json({ error: "Failed to send verification email" });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      await logAuthEvent('failed_login', username || 'unknown', req, {
        success: false,
        errorMessage: 'Missing credentials',
        details: { reason: 'missing_credentials' }
      });
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      // Record failed login attempt
      await recordLoginAttempt(username, false, req);
      await logAuthEvent('failed_login', username, req, {
        success: false,
        errorMessage: 'Invalid credentials',
        details: { reason: 'user_not_found' }
      });
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check if account is locked before attempting login
    const lockStatus = await isAccountLocked(user.email || username);
    if (lockStatus.isLocked) {
      await logAuthEvent('failed_login', user.email || username, req, {
        userId: user.id,
        success: false,
        errorMessage: 'Account locked',
        details: { 
          reason: 'account_locked',
          remainingTime: lockStatus.remainingTime 
        }
      });
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts',
        remainingTime: lockStatus.remainingTime,
        retryAfter: (lockStatus.remainingTime || 30) * 60
      });
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      // Record failed login attempt
      await recordLoginAttempt(user.email || username, false, req);
      await logAuthEvent('failed_login', user.email || username, req, {
        userId: user.id,
        success: false,
        errorMessage: 'Invalid password',
        details: { reason: 'invalid_password' }
      });
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Successful login - reset failed attempts and record success
    await recordLoginAttempt(user.email || username, true, req);
    await resetFailedAttempts(user.email || username);
    
    // Record login
    await storage.updateUserLogin(user.id, req.ip || undefined);

    // Create session
    req.session.userId = user.id;

    // Log successful login
    await logAuthEvent('login', user.email || username, req, {
      userId: user.id,
      success: true,
      details: { 
        username: user.username,
        loginMethod: 'password'
      }
    });

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json({ user: userData });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logAuthEvent('failed_login', req.body?.username || 'unknown', req, {
      success: false,
      errorMessage,
      details: { error: String(error) }
    });
    res.status(500).json({ error: "Failed to log in" });
  }
});

// Logout
router.post("/logout", isAuthenticated, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  
  try {
    // Get user info for logging before destroying session
    const user = await storage.getUser(userId);
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to log out" });
      }
      
      // Log successful logout
      logAuthEvent('logout', user?.email || user?.username || 'unknown', req, {
        userId,
        success: true,
        details: { 
          username: user?.username,
          logoutMethod: 'manual'
        }
      });
      
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to log out" });
  }
});

// Get current user
router.get("/me", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

export default router;