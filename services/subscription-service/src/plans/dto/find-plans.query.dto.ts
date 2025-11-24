import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BillingCycle } from '../entities/plan.entity';

export class FindPlansQueryDto {
  @ApiPropertyOptional({
    enum: BillingCycle,
    description: 'Filter plans by billing cycle (monthly, yearly, custom, free)',
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;
}
