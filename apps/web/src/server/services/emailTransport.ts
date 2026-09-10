// Abstract interface for email sending
export interface EmailPayload {
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
}

export interface EmailTransport {
  sendEmail(payload: EmailPayload): Promise<void>;
}

// A generic Mock/Console transport for MVP local dev
export class ConsoleEmailTransport implements EmailTransport {
  async sendEmail(payload: EmailPayload): Promise<void> {
    console.log(`[EMAIL DISPATCHED to ${payload.to}]: ${payload.subject}`);
    // Simulate slight network delay
    await new Promise(r => setTimeout(r, 100));
  }
}

export class ExternalEmailTransport implements EmailTransport {
  constructor(private apiKey: string) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    // Simulated external provider integration (e.g., SendGrid, Resend)
    // For M8 MVP, we just throw if the API key is totally invalid (for tests), 
    // or simulate success.
    if (!this.apiKey) {
      throw new Error('Email provider API key is missing');
    }
    
    if (payload.to.includes('bounce')) {
      // Simulate a permanent failure for testing
      throw new Error('Recipient address bounced');
    }

    if (payload.to.includes('timeout')) {
      // Simulate a transient error
      throw new Error('Connection timeout');
    }

    // In a real implementation:
    // await fetch('https://api.resend.com/emails', { ... })
  }
}

export function getEmailTransport(): EmailTransport {
  // Use console transport in test environments or if API key is not set
  if (process.env.NODE_ENV === 'test' || !process.env.EMAIL_API_KEY) {
    return new ConsoleEmailTransport();
  }

  return new ExternalEmailTransport(process.env.EMAIL_API_KEY);
}
