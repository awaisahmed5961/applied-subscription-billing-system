import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '../entities/plan.entity';

export class PlanResponseDto {
  @ApiProperty({
    description: 'Unique ID of the plan',
    example: 'e2b1d12a-6a5d-4e14-9ab0-a3bc123f9f61',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the plan',
    example: 'Pro',
  })
  name: string;

  @ApiProperty({
    description: 'Number of man-hours included in the plan',
    example: 20,
  })
  manHours: number;

  @ApiProperty({
    description: 'Price per man-hour in USD',
    example: 1.5,
  })
  pricePerManHour: number;

  @ApiProperty({
    description: 'Billing cycle of the plan',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiPropertyOptional({
    description: 'Optional discount percentage for this plan',
    example: 15,
  })
  discount?: number;

  @ApiPropertyOptional({
    description: 'Features included in the plan',
    example: ['AI Workflow Assist', 'Priority Support'],
    type: [String],
  })
  features?: string[];
}
