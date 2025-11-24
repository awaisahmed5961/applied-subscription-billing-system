import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionResponseDto } from './subscription-response.dto';

export class PaymentInfoDto {
  @ApiPropertyOptional({ example: 'txn_123456', nullable: true })
  transactionId?: string;

  @ApiPropertyOptional({ example: 'payment_service_unreachable', nullable: true })
  error?: string;

  @ApiPropertyOptional({ example: 'Timeout calling payment service', nullable: true })
  details?: string;
}

export class SubscriptionWithPaymentResponseDto {
  @ApiProperty({ type: () => SubscriptionResponseDto })
  subscription: SubscriptionResponseDto;

  @ApiProperty({ type: () => PaymentInfoDto })
  payment: PaymentInfoDto;
}
