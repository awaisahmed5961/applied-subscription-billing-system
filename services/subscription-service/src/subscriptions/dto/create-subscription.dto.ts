import { IsString, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000002' })
  @IsString()
  planId: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  manHours: number;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @IsIn(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';
}
