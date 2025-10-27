/**
 * WhatsApp Service Module
 * Day 19: Notifications Engine & Scheduled Reminders System
 * 
 * Mock WhatsApp API integration for sending messages
 * In production, replace with actual WhatsApp Business API (Twilio, MessageBird, etc.)
 * 
 * @module whatsapp
 */

/**
 * WhatsApp message sending response
 */
export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: Date;
}

/**
 * WhatsApp message payload
 */
export interface WhatsAppMessage {
  to: string; // Phone number with country code
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Sends a WhatsApp message (MOCK IMPLEMENTATION)
 * In production, integrate with WhatsApp Business API
 * 
 * @param payload - Message details
 * @returns Response with success status
 * 
 * @example
 * const result = await sendWhatsAppMessage({
 *   to: '+1234567890',
 *   message: 'Your booking is confirmed!'
 * });
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessage
): Promise<WhatsAppResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock validation
  if (!payload.to || !payload.message) {
    return {
      success: false,
      error: 'Missing required fields: to, message',
      timestamp: new Date(),
    };
  }

  // Validate phone number format (simple check)
  if (!payload.to.match(/^\+?[1-9]\d{1,14}$/)) {
    return {
      success: false,
      error: 'Invalid phone number format. Use international format with country code.',
      timestamp: new Date(),
    };
  }

  // Simulate random failures (5% failure rate)
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: 'WhatsApp API temporarily unavailable',
      timestamp: new Date(),
    };
  }

  // Mock successful response
  const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('[WhatsApp MOCK] Message sent:', {
    messageId,
    to: payload.to,
    message: payload.message.substring(0, 50) + '...',
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    messageId,
    timestamp: new Date(),
  };
}

/**
 * Sends bulk WhatsApp messages (batch sending)
 * 
 * @param messages - Array of messages to send
 * @returns Array of responses
 */
export async function sendBulkWhatsAppMessages(
  messages: WhatsAppMessage[]
): Promise<WhatsAppResponse[]> {
  const responses: WhatsAppResponse[] = [];

  for (const message of messages) {
    try {
      const response = await sendWhatsAppMessage(message);
      responses.push(response);

      // Rate limiting: wait 100ms between messages
      await new Promise((resolve) => setTimeout(resolve, 100));
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
 * Validates WhatsApp message content
 * Checks length, forbidden characters, etc.
 * 
 * @param message - Message content
 * @returns Validation result
 */
export function validateWhatsAppMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 4096) {
    return { valid: false, error: 'Message exceeds 4096 character limit' };
  }

  return { valid: true };
}

/**
 * Formats phone number for WhatsApp API
 * Ensures international format with + and country code
 * 
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '');

  // Add + if not present
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  return formatted;
}

/**
 * Configuration for WhatsApp API
 * In production, load from environment variables
 */
export const WHATSAPP_CONFIG = {
  API_URL: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1',
  API_KEY: process.env.WHATSAPP_API_KEY || 'mock_api_key',
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_phone_id',
  MAX_MESSAGE_LENGTH: 4096,
  RATE_LIMIT_PER_SECOND: 10,
} as const;

/**
 * Example production integration (commented out)
 * Uncomment and configure when ready to use real WhatsApp API
 */
/*
import axios from 'axios';

export async function sendWhatsAppMessageProduction(
  payload: WhatsAppMessage
): Promise<WhatsAppResponse> {
  try {
    const response = await axios.post(
      `${WHATSAPP_CONFIG.API_URL}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formatPhoneNumber(payload.to),
        type: 'text',
        text: {
          body: payload.message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp API error',
      timestamp: new Date(),
    };
  }
}
*/
