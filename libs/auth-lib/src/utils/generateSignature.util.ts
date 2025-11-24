import * as crypto from 'crypto';

export function signPayload(
  secret: string,
  payload: any,
  timestamp: string,
): string {
  const bodyString = JSON.stringify(payload);

  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${bodyString}`)
    .digest('hex');
}