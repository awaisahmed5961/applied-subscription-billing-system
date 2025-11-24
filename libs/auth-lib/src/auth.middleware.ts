import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TokenService, AuthTokenPayload } from "@project/auth-lib";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || typeof authHeader !== "string") {
      return next();
    }

    const parts = authHeader.split(" ");
    const token =
      parts.length === 2 && parts[0] === "Bearer" ? parts[1] : authHeader;

    if (!token) {
      return next();
    }

    try {
      const decoded: AuthTokenPayload = this.tokenService.verifyToken(token);

      (req as any).user = decoded;
    } catch (err) {
      console.log("verify error:", err);
    }

    next();
  }
}
