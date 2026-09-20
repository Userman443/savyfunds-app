import { randomBytes } from "crypto";
import { storage } from "./storage";
import nodemailer from "nodemailer";

// Set up a transporter for emails
let transporter: nodemailer.Transporter;

// Create a nodemailer transport
if (process.env.MAILERSEND_API_KEY) {
  // Use MailerSend API if available
  transporter = nodemailer.createTransport({
    host: "smtp.mailersend.net",
    port: 587,
    secure: false,
    auth: {
      user: "MS_YQZgTp@savyfunds.com",
      pass: process.env.MAILERSEND_API_KEY
    }
  });
  console.log("MailerSend transport configured successfully");
} else {
  // Development/testing fallback - logs to console instead of sending emails
  console.warn("MailerSend API key not found - using development email transport");
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true
  });
}

/**
 * Whether a real email transport is configured (MailerSend SMTP).
 * When false, the app skips email verification instead of blocking users
 * on emails that can never be delivered.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.MAILERSEND_API_KEY;
}

/**
 * Generate a random token for email verification
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Send a verification email to a user
 */
export async function sendVerificationEmail(userId: number, email: string, username: string): Promise<boolean> {
  try {
    // Generate a verification token and set expiry (24 hours from now)
    const token = generateVerificationToken();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Save the token to the user's account
    await storage.updateVerificationToken(userId, token, expiry);
    
    // Create the verification link
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    
    // Email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2C6E49;">Welcome to SavyFunds!</h1>
        <p>Hi ${username},</p>
        <p>Thank you for creating a SavyFunds account. To complete your registration and access all features, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2C6E49; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create a SavyFunds account, you can safely ignore this email.</p>
        <p>Best regards,<br>The SavyFunds Team</p>
      </div>
    `;
    
    const textContent = `
      Welcome to SavyFunds!
      
      Hi ${username},
      
      Thank you for creating a SavyFunds account. To complete your registration and access all features, please verify your email address by visiting the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create a SavyFunds account, you can safely ignore this email.
      
      Best regards,
      The SavyFunds Team
    `;
    
    try {
      // Send email using MailerSend via nodemailer
      const info = await transporter.sendMail({
        from: '"SavyFunds" <noreply@savyfunds.com>',
        to: email,
        subject: "Verify Your SavyFunds Account Email",
        text: textContent,
        html: htmlContent
      });
      
      if (process.env.NODE_ENV !== "production") {
        if (info.message) {
          // Log preview for development streamTransport
          console.log("Email verification preview:");
          console.log(info.message.toString());
        } else {
          console.log(`Verification email sent to ${email} via MailerSend`);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Failed to send verification email via MailerSend:", error);
      
      // In development, just log success even if email sending fails
      if (process.env.NODE_ENV !== "production") {
        console.log("DEV MODE: Simulating email sent successfully");
        console.log(`Verification URL: ${verificationLink}`);
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error("Failed to generate verification email:", error);
    return false;
  }
}

/**
 * Resend a verification email
 */
export async function resendVerificationEmail(userId: number): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`Cannot resend verification email: User ${userId} not found or has no email`);
      return false;
    }
    
    console.log(`Resending verification email to user ${user.username} (${user.email})`);
    return await sendVerificationEmail(userId, user.email, user.username);
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return false;
  }
}