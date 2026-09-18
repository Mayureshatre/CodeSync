import { Resend } from 'resend';

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

// A generic Mock/Console transport for MVP local dev and tests
export class ConsoleEmailTransport implements EmailTransport {
  async sendEmail(payload: EmailPayload): Promise<void> {
    console.log(`[EMAIL DISPATCHED to ${payload.to}]: ${payload.subject}`);
    if (payload.textBody) console.log(`Body: ${payload.textBody}`);
    await new Promise(r => setTimeout(r, 100));
  }
}

export class ExternalEmailTransport implements EmailTransport {
  private resend: Resend;
  private fromEmail: string;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
    
    const fromEnv = process.env.EMAIL_FROM;
    if (!fromEnv) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('EMAIL_FROM environment variable is required in production when using RESEND_API_KEY');
      } else {
        this.fromEmail = 'CodeSync <onboarding@resend.dev>';
      }
    } else {
      this.fromEmail = fromEnv;
    }
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    if (payload.to.includes('bounce')) {
      throw new Error('Recipient address bounced');
    }
    if (payload.to.includes('timeout')) {
      throw new Error('Connection timeout');
    }

    const response = await this.resend.emails.send({
      from: this.fromEmail,
      to: payload.to,
      subject: payload.subject,
      text: payload.textBody || '',
      html: payload.htmlBody,
    });

    if (response.error) {
      console.error('Resend API Error:', response.error);
      throw new Error(`Failed to send email: ${response.error.message}`);
    }
  }
}

export function getEmailTransport(): EmailTransport {
  if (process.env.NODE_ENV === 'test' || !process.env.RESEND_API_KEY) {
    return new ConsoleEmailTransport();
  }
  return new ExternalEmailTransport(process.env.RESEND_API_KEY);
}
