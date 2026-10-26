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
    .replace(/rediss?:\/\/[^\s@]+@/gi, 'redis://***@')
    .replace(/AUTH\s+[^\]\s):]+/gi, 'AUTH ***')
    .replace(/(password|token|secret)=([^\s&]+)/gi, '$1=***');
}
