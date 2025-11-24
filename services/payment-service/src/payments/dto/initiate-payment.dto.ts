import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'ID of the subscription to be charged',
    example: '26a7967c-9421-44bd-81a0-ad4f62518309',
  })
  subscriptionId: string;

  @ApiProperty({
    description: 'Amount to be charged',
    example: 25.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'ID of the user who owns the subscription',
    example: 'eb8b088d-4816-4807-909a-5696d1bb6d0b',
  })
  userId: string;

  @ApiProperty({
    description: 'Webhook URL that the payment service will call with the final payment status',
    example: 'http://subscription-service:3000/webhooks/payment',
  })
  webhookUrl: string;
}
