import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, PaymentStatus } from '../entities/subscription.entity';

export class PlanSummaryDto {
  @ApiProperty({ example: 'plan_pro_20' })
  id: string;

  @ApiProperty({ example: 'Pro 20 Hours' })
  name: string;

  @ApiProperty({ example: 20 })
  manHours: number;

  @ApiProperty({ example: 1.5 })
  pricePerManHour: number;

  @ApiProperty({
    example: 'monthly',
    enum: ['monthly', 'yearly', 'custom'],
  })
  billingCycle: string;

  @ApiPropertyOptional({ example: 15 })
  discount?: number;
}

export class PendingChangeDto {
  @ApiProperty({ example: 'upgrade', enum: ['upgrade', 'downgrade', 'cancel'] })
  type: 'upgrade' | 'downgrade' | 'cancel';

  @ApiPropertyOptional({ example: 'plan_pro_50' })
  newPlanId?: string;

  @ApiPropertyOptional({ example: 50 })
  newManHours?: number;

  @ApiPropertyOptional({
    example: 'next_billing_period',
    enum: ['next_billing_period', 'immediate'],
  })
  applyAt?: 'next_billing_period' | 'immediate';

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z' })
  effectiveDate?: string | null;
}

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'sub_123456' })
  id: string;

  @ApiProperty({ type: () => PlanSummaryDto })
  plan: PlanSummaryDto;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2025-11-01T12:00:00.000Z' })
  startDate: Date;

  @ApiPropertyOptional({ example: '2026-11-01T12:00:00.000Z', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: 0 })
  manHoursUsed: number;

  @ApiProperty({ example: 300.0 })
  totalCost: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ example: 'txn_123456', nullable: true })
  paymentId: string | null;

  @ApiPropertyOptional({ type: () => PendingChangeDto, nullable: true })
  pendingChange: PendingChangeDto | null;

  @ApiProperty({ example: '2025-11-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-01T12:30:00.000Z' })
  updatedAt: Date;
}
