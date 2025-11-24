import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role?: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: AuthTokenPayload): string {
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): AuthTokenPayload {
    return this.jwtService.verify<AuthTokenPayload>(token);
  }
}
