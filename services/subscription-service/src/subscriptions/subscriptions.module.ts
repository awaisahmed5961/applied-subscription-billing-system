import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { WebhooksController } from './webhooks.controller';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Subscription, Plan, User]), HttpModule],
  controllers: [SubscriptionsController, WebhooksController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
