import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiHeader,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentWebhookDto, PaymentWebhookResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiPaymentWebhookDocs = () =>
  applyDecorators(
    ApiTags('webhooks'),

    ApiOperation({
      summary: 'Handle payment webhook from payment provider',
    }),

    ApiHeader({
      name: 'x-api-key',
      description: 'Webhook secret / API key from payment service',
      required: false,
    }),

    ApiBody({ type: PaymentWebhookDto }),

    ApiOkResponse({
      description: 'Webhook processed successfully',
      type: PaymentWebhookResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Invalid webhook payload',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to process webhook',
      type: ErrorResponseDto,
    }),
  );
