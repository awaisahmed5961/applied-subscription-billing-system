import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { Payment } from '../entities/payment.entity';

export const ApiInitiatePaymentDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Initiate a payment for a subscription',
      description:
        'Creates a payment record for a subscription and starts simulated processing. ' +
        'The payment service will later send a webhook callback to the provided `webhookUrl`.',
    }),
    ApiBody({
      type: InitiatePaymentDto,
      description: 'Payment initiation payload',
      examples: {
        example: {
          summary: 'Example payment initiation body',
          value: {
            subscriptionId: '26a7967c-9421-44bd-81a0-ad4f62518309',
            amount: 25.5,
            currency: 'AED',
            userId: 'eb8b088d-4816-4807-909a-5696d1bb6d0b',
            webhookUrl: 'http://subscription-service:3000/webhooks/payment',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Payment created successfully and queued for processing.',
      type: Payment,
    }),
    ApiBadRequestResponse({
      description: 'Invalid payload or missing required fields.',
    }),
  );

export const ApiFindPaymentDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get payment details by ID',
      description: 'Returns the payment record including status, attempts, and amount.',
    }),
    ApiParam({
      name: 'id',
      description: 'Payment ID (UUID)',
      required: true,
    }),
    ApiOkResponse({
      description: 'Payment found',
      type: Payment,
    }),
    ApiNotFoundResponse({
      description: 'Payment with the given ID was not found.',
    }),
  );
