/**
 * Email Service Module
 * Day 19: Notifications Engine & Scheduled Reminders System
 * 
 * Mock Email API integration for sending emails
 * In production, replace with actual email service (SendGrid, AWS SES, Resend, etc.)
 * 
 * @module email
 */

/**
 * Email sending response
 */
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: Date;
}

/**
 * Email message payload
 */
export interface EmailMessage {
  to: string | string[]; // Email address(es)
  subject: string;
  html?: string; // HTML content
  text?: string; // Plain text content
  from?: string; // Sender email
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Sends an email (MOCK IMPLEMENTATION)
 * In production, integrate with SendGrid, AWS SES, or similar
 * 
 * @param payload - Email details
 * @returns Response with success status
 * 
 * @example
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Booking Confirmation',
 *   text: 'Your booking is confirmed!',
 *   html: '<p>Your booking is confirmed!</p>'
 * });
 */
export async function sendEmail(payload: EmailMessage): Promise<EmailResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock validation
  if (!payload.to || !payload.subject) {
    return {
      success: false,
      error: 'Missing required fields: to, subject',
      timestamp: new Date(),
    };
  }

  if (!payload.html && !payload.text) {
    return {
      success: false,
      error: 'Either html or text content is required',
      timestamp: new Date(),
    };
  }

  // Validate email addresses
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  for (const email of recipients) {
    if (!isValidEmail(email)) {
      return {
        success: false,
        error: `Invalid email address: ${email}`,
        timestamp: new Date(),
      };
    }
  }

  // Simulate random failures (3% failure rate)
  if (Math.random() < 0.03) {
    return {
      success: false,
      error: 'Email service temporarily unavailable',
      timestamp: new Date(),
    };
  }

  // Mock successful response
  const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('[Email MOCK] Email sent:', {
    messageId,
    to: payload.to,
    subject: payload.subject,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    messageId,
    timestamp: new Date(),
  };
}

/**
 * Sends bulk emails (batch sending)
 * 
 * @param messages - Array of emails to send
 * @returns Array of responses
 */
export async function sendBulkEmails(messages: EmailMessage[]): Promise<EmailResponse[]> {
  const responses: EmailResponse[] = [];

  for (const message of messages) {
    try {
      const response = await sendEmail(message);
      responses.push(response);

      // Rate limiting: wait 50ms between emails
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      responses.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  return responses;
}

/**
 * Validates email address format
 * 
 * @param email - Email address
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates HTML email template with styling
 * 
 * @param content - Email content (HTML)
 * @param title - Email title
 * @returns Styled HTML email
 */
export function createEmailTemplate(content: string, title: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4F46E5;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
    .button:hover {
      background-color: #4338CA;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>IRCA Hotel Booking</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent from IRCA Hotel Booking System</p>
      <p>If you have any questions, please contact us at bookings@ircahotel.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Converts plain text to simple HTML
 * Preserves line breaks and basic formatting
 * 
 * @param text - Plain text
 * @returns HTML content
 */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

/**
 * Configuration for Email API
 * In production, load from environment variables
 */
export const EMAIL_CONFIG = {
  API_URL: process.env.EMAIL_API_URL || 'https://api.sendgrid.com/v3',
  API_KEY: process.env.EMAIL_API_KEY || 'mock_api_key',
  FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@ircahotel.com',
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'IRCA Hotel Booking',
  MAX_RECIPIENTS: 1000,
  RATE_LIMIT_PER_SECOND: 20,
} as const;

/**
 * Example production integration with SendGrid (commented out)
 * Uncomment and configure when ready to use real email service
 */
/*
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(EMAIL_CONFIG.API_KEY);

export async function sendEmailProduction(
  payload: EmailMessage
): Promise<EmailResponse> {
  try {
    const msg = {
      to: payload.to,
      from: {
        email: payload.from || EMAIL_CONFIG.FROM_EMAIL,
        name: EMAIL_CONFIG.FROM_NAME,
      },
      subject: payload.subject,
      text: payload.text,
      html: payload.html || (payload.text ? textToHtml(payload.text) : undefined),
      cc: payload.cc,
      bcc: payload.bcc,
      attachments: payload.attachments,
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email service error',
      timestamp: new Date(),
    };
  }
}
*/

/**
 * Example production integration with AWS SES (commented out)
 */
/*
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function sendEmailWithSES(
  payload: EmailMessage
): Promise<EmailResponse> {
  try {
    const command = new SendEmailCommand({
      Source: payload.from || EMAIL_CONFIG.FROM_EMAIL,
      Destination: {
        ToAddresses: Array.isArray(payload.to) ? payload.to : [payload.to],
        CcAddresses: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : undefined,
        BccAddresses: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc]) : undefined,
      },
      Message: {
        Subject: {
          Data: payload.subject,
        },
        Body: {
          Html: payload.html ? { Data: payload.html } : undefined,
          Text: payload.text ? { Data: payload.text } : undefined,
        },
      },
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SES error',
      timestamp: new Date(),
    };
  }
}
*/
