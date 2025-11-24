import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { verifySignature } from './utils/signature.util';
  
  @Injectable()
  export class SignatureGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}
  
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const signature = request.headers['x-signature'] as string;
      const timestamp = request.headers['x-timestamp'] as string;
      const body = request.body;
  
      if (!signature || !timestamp) {
        throw new UnauthorizedException('Missing signature headers');
      }
  
      const secret = this.configService.get<string>('PAYMENT_SHARED_SECRET');
      if (!secret) {
        throw new Error('PAYMENT_SHARED_SECRET is missing in environment variables');
      }
      
      const valid = verifySignature(secret, signature, timestamp, body);
  
      if (!valid) {
        throw new UnauthorizedException('Invalid signature');
      }
  
      const now = Date.now();
      const requestTime = Number(timestamp);
  
      if (Number.isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
        throw new UnauthorizedException('Request timestamp too old');
      }
  
      return true;
    }
  }
  