import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key if available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DEFAULT_FROM_EMAIL = 'hello@savyfunds.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully');
} else {
  console.warn('SendGrid API key not found. Email functionality will be simulated.');
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Send an email using SendGrid
 * If SendGrid API key is not available, it will simulate sending an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Default from address
  const from = options.from || DEFAULT_FROM_EMAIL;
  
  // Prepare the message
  const msg = {
    to: options.to,
    from,
    subject: options.subject,
    text: options.text || '',
    html: options.html || '',
  };
  
  try {
    // Only attempt to send if we have an API key
    if (SENDGRID_API_KEY) {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${options.to}`);
    } else {
      // Simulate sending email in development
      console.log('SIMULATED EMAIL:');
      console.log(`To: ${options.to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content: ${options.text || options.html}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  const subject = 'Welcome to savyfunds!';
  const text = `
Hello ${username},

Welcome to savyfunds! We're excited to have you join our financial literacy platform.

Here's what you can do to get started:
1. Complete your profile with your financial goals and experience level
2. Explore our learning modules to improve your financial knowledge
3. Set up savings goals to track your progress

If you have any questions, just reply to this email.

Best regards,
The savyfunds Team
  `;
  
  const html = `
<div style="font-family: 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2f9e44;">Welcome to savyfunds!</h2>
  <p>Hello ${username},</p>
  <p>Welcome to savyfunds! We're excited to have you join our financial literacy platform.</p>
  <p>Here's what you can do to get started:</p>
  <ol>
    <li>Complete your profile with your financial goals and experience level</li>
    <li>Explore our learning modules to improve your financial knowledge</li>
    <li>Set up savings goals to track your progress</li>
  </ol>
  <p>If you have any questions, just reply to this email.</p>
  <p>Best regards,<br>The savyfunds Team</p>
</div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}