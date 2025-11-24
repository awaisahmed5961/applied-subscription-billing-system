import { DynamicModule, Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenService } from "./token.service";
export interface AuthModuleOptions {
  jwtSecret: string;
  jwtExpiresIn?: string | number;
}

@Global()
@Module({})
export class AuthModule {
  static register(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: { expiresIn: (options.jwtExpiresIn ?? "1h") as number },
        }),
      ],
      providers: [JwtStrategy, JwtAuthGuard, TokenService],
      exports: [JwtModule, PassportModule, JwtAuthGuard, TokenService],
    };
  }
}
