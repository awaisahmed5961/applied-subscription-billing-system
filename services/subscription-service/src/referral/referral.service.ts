import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  async validateReferralCode(code: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { code },
    });

    if (!referral) {
      throw new NotFoundException('Invalid referral code');
    }

    const now = new Date();

    if (!referral.isActive) {
      throw new BadRequestException('Referral code is inactive');
    }

    if (now < referral.startsAt) {
      throw new BadRequestException('Referral code is not active yet');
    }

    if (now > referral.endsAt) {
      throw new BadRequestException('Referral code has expired');
    }

    if (
      typeof referral.maxUses === 'number' &&
      referral.maxUses >= 0 &&
      referral.usedCount >= referral.maxUses
    ) {
      throw new BadRequestException('Referral code usage limit reached');
    }

    return referral;
  }

  /**
   * Mark referral as used
   */
  async markUsed(referral: Referral): Promise<Referral> {
    referral.usedCount += 1;
    return this.referralRepository.save(referral);
  }
}
