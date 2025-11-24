import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AuthModule } from '@project/auth-lib';
import { ReferralModule } from './referral/referral.module';
export interface AuthModuleOptions {
  jwtSecret: string;
  jwtExpiresIn?: string | number;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: parseInt(config.get('DATABASE_PORT', '5432')),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: false,
        logging: true,
      }),
    }),
    AuthModule.register({
      jwtSecret: new ConfigService().get<string>('JWT_SECRET') ?? 'dev-secret',
      jwtExpiresIn: new ConfigService().get<string>('JWT_EXPIRES_IN') ?? '1h',
    }),
    UsersModule,
    PlansModule,
    SubscriptionsModule,
    ReferralModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
