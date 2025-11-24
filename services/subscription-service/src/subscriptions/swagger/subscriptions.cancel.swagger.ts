import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@project/auth-lib';
import { CancelSubscriptionDto, SubscriptionWrapperResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiCancelSubscriptionDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({ summary: 'Cancel subscription' }),

    ApiParam({
      name: 'id',
      description: 'Subscription ID',
      example: 'sub_123456',
    }),

    ApiBody({ type: CancelSubscriptionDto }),

    ApiOkResponse({
      description: 'Subscription canceled or marked for cancellation',
      type: SubscriptionWrapperResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Invalid cancelAt value or similar',
      type: ErrorResponseDto,
    }),

    ApiUnauthorizedResponse({
      description: 'Invalid or missing token',
      type: ErrorResponseDto,
    }),

    ApiForbiddenResponse({
      description: 'Not your subscription',
      type: ErrorResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Subscription not found',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to cancel subscription',
      type: ErrorResponseDto,
    }),
  );
