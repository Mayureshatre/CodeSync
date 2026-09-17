import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEmailTransport, ExternalEmailTransport, ConsoleEmailTransport } from '../../apps/web/src/server/services/emailTransport';

describe('Email Transport Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses ConsoleEmailTransport when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    process.env.RESEND_API_KEY = 'mock-key';
    const transport = getEmailTransport();
    expect(transport).toBeInstanceOf(ConsoleEmailTransport);
  });

  it('uses ConsoleEmailTransport when RESEND_API_KEY is missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.RESEND_API_KEY;
    const transport = getEmailTransport();
    expect(transport).toBeInstanceOf(ConsoleEmailTransport);
  });

  it('throws an error in production if EMAIL_FROM is missing and API key is present', () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 'mock-key';
    delete process.env.EMAIL_FROM;

    expect(() => getEmailTransport()).toThrow('EMAIL_FROM environment variable is required in production when using RESEND_API_KEY');
  });

  it('uses ExternalEmailTransport in production if EMAIL_FROM and API key are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 'mock-key';
    process.env.EMAIL_FROM = 'Test <test@example.com>';

    const transport = getEmailTransport();
    expect(transport).toBeInstanceOf(ExternalEmailTransport);
    expect((transport as any).fromEmail).toBe('Test <test@example.com>');
  });

  it('falls back to onboarding@resend.dev in non-production if EMAIL_FROM is missing', () => {
    process.env.NODE_ENV = 'development';
    process.env.RESEND_API_KEY = 'mock-key';
    delete process.env.EMAIL_FROM;

    const transport = getEmailTransport();
    expect(transport).toBeInstanceOf(ExternalEmailTransport);
    expect((transport as any).fromEmail).toBe('CodeSync <onboarding@resend.dev>');
  });
});
