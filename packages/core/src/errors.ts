export class DomainError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message, 'FORBIDDEN_ERROR', 403);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'NOT_FOUND_ERROR', 404);
  }
}

export function sanitizeErrorMessage(message: unknown): string {
  if (message == null) return '';
  let str: string;
  if (typeof message === 'string') {
    str = message;
  } else if (message instanceof Error) {
    str = message.message;
  } else if (typeof message === 'object' && message !== null && 'message' in message && typeof (message as any).message === 'string') {
    str = (message as any).message;
  } else {
    str = String(message);
  }
  return str
    .replace(/rediss?:\/\/[^\/\s?#]+@/gi, 'redis://***@')
    .replace(/AUTH\s+[^\]\s):]+/gi, 'AUTH ***')
    .replace(/(password|token|secret)=([^\s&]+)/gi, '$1=***');
}
