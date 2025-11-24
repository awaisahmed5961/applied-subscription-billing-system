import { IsString, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DowngradeSubscriptionDto {
  @ApiProperty({ example: 'plan_core_20' })
  @IsString()
  newPlanId: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  newManHours: number;

  @ApiProperty({
    example: 'next_billing_period',
    enum: ['next_billing_period', 'immediate'],
  })
  @IsIn(['next_billing_period', 'immediate'])
  applyAt: 'next_billing_period' | 'immediate';
}
