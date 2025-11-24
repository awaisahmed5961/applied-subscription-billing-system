import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentWebhookResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiPropertyOptional({ example: true, nullable: true })
  alreadyProcessed?: boolean;

  @ApiPropertyOptional({ example: 'Subscription not found', nullable: true })
  error?: string;
}
