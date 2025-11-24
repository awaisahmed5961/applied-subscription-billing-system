import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    example: 'period_end',
    enum: ['period_end', 'immediate'],
  })
  @IsOptional()
  @IsIn(['period_end', 'immediate'])
  cancelAt?: 'period_end' | 'immediate';
}
