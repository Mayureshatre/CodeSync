import { describe, it, expect } from 'vitest';
import { sanitizeErrorMessage } from '../../worker/src/utils';

describe('Worker Utils - sanitizeErrorMessage', () => {
  it('returns empty string for nullish or empty inputs', () => {
    expect(sanitizeErrorMessage('')).toBe('');
    expect(sanitizeErrorMessage(null)).toBe('');
    expect(sanitizeErrorMessage(undefined)).toBe('');
  });

  it('redacts Redis authentication credentials in redis:// and rediss:// URLs', () => {
    const rawError1 = 'Connection failed: redis://default:secretPassword123@redis.voroa.internal:6379/0';
    expect(sanitizeErrorMessage(rawError1)).toBe('Connection failed: redis://***@redis.voroa.internal:6379/0');

    const rawError2 = 'ECONNREFUSED rediss://:mypassword@cluster.upstash.io:6380';
    expect(sanitizeErrorMessage(rawError2)).toBe('ECONNREFUSED redis://***@cluster.upstash.io:6380');
  });

  it('redacts multiple redis URLs in the same error message', () => {
    const multiUrl = 'Primary redis://user:pass1@host1:6379 failed, fallback rediss://user:pass2@host2:6379 also failed';
    expect(sanitizeErrorMessage(multiUrl)).toBe('Primary redis://***@host1:6379 failed, fallback redis://***@host2:6379 also failed');
  });

  it('redacts AUTH commands in error strings', () => {
    const rawError = 'ERR [AUTH superSecretToken]: WRONGPASS invalid username-password pair';
    expect(sanitizeErrorMessage(rawError)).toBe('ERR [AUTH ***]: WRONGPASS invalid username-password pair');

    const rawError2 = 'AUTH mySecretPassword123';
    expect(sanitizeErrorMessage(rawError2)).toBe('AUTH ***');
  });

  it('redacts password, token, or secret query parameters in URLs', () => {
    const rawError = 'Error connecting to https://api.service.com?password=mysecret&format=json';
    expect(sanitizeErrorMessage(rawError)).toBe('Error connecting to https://api.service.com?password=***&format=json');

    const tokenError = 'Failed request with token=ghp_ABC123XYZ and secret=s3cr3t';
    expect(sanitizeErrorMessage(tokenError)).toBe('Failed request with token=*** and secret=***');
  });

  it('preserves clean error messages without sensitive patterns', () => {
    const cleanError = 'Connection refused on 127.0.0.1:6379';
    expect(sanitizeErrorMessage(cleanError)).toBe('Connection refused on 127.0.0.1:6379');

    const genericError = 'ETIMEDOUT: connect ETIMEDOUT 10.0.0.1:6379';
    expect(sanitizeErrorMessage(genericError)).toBe('ETIMEDOUT: connect ETIMEDOUT 10.0.0.1:6379');
  });

  it('handles Error object instances directly and redacts their message', () => {
    const err = new Error('redis://alice:supersecret@myredis:6379');
    expect(sanitizeErrorMessage(err)).toBe('redis://***@myredis:6379');
  });

  it('handles non-string types safely', () => {
    expect(sanitizeErrorMessage(12345)).toBe('12345');
    expect(sanitizeErrorMessage({ message: 'redis://:p@h:6379' })).toBe('redis://***@h:6379');
  });
});
