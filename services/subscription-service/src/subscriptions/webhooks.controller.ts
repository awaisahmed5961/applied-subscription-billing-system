import { Controller, Post, Body, Headers, HttpCode, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { SignatureGuard, ApiKeyGuard } from '@project/auth-lib';
import { PaymentWebhookDto } from './dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  @Post('payment')
  @UseGuards(ApiKeyGuard, SignatureGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Handle payment webhook events and update subscription status',
    description:
      'Receives payment status from the Payment Service via webhook. ' +
      'Verifies the request using the `x-api-key` header and then updates the related subscription. ' +
      'On successful payment, the subscription is activated; on failure, it is marked as failed.',
  })
  @ApiBody({
    description: 'Payment result payload sent by the Payment Service',
    type: PaymentWebhookDto,
    examples: {
      success: {
        summary: 'Successful payment example',
        value: {
          transactionId: 'txn_123456789',
          subscriptionId: 'e5dc8c1c-4c5e-4b3a-9df0-8b71b7a71f0a',
          status: 'success',
          amount: 120.5,
        },
      },
      failed: {
        summary: 'Failed payment example',
        value: {
          transactionId: 'txn_987654321',
          subscriptionId: 'e5dc8c1c-4c5e-4b3a-9df0-8b71b7a71f0a',
          status: 'failed',
          amount: 120.5,
        },
      },
    },
  })
  async handlePaymentWebhook(@Body() data: any, @Headers('x-api-key') apiKey: string) {
    return this.subscriptionsService.handlePaymentWebhook(data);
  }
}
