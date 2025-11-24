import { IsString, IsEnum, IsInt, IsNumber, IsOptional, IsArray } from 'class-validator';
import { BillingCycle } from '../entities/plan.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the plan', example: 'Pro' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Number of man-hours included in the plan', example: 20 })
  @IsInt()
  manHours: number;

  @ApiProperty({ description: 'Price per man-hour in USD', example: 1.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  pricePerManHour: number;

  @ApiProperty({
    description: 'Billing cycle of the plan',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional({ description: 'Optional discount for the plan (%)', example: 15 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  discount?: number;

  @ApiPropertyOptional({
    description: 'Optional list of features included in the plan',
    example: ['AI Workflow Assist', 'Priority Support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
