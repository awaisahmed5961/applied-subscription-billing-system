import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
@Module({
  controllers: [ReferralController],
  imports: [TypeOrmModule.forFeature([Referral])],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
