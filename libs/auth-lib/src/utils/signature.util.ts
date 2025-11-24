import * as crypto from 'crypto';

export function verifySignature(
  secret: string,
  signature: string,
  timestamp: string,
  payload: any,
): boolean {
  const bodyString = JSON.stringify(payload);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${bodyString}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}
