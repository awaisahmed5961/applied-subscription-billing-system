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
import { DowngradeSubscriptionDto, SubscriptionWrapperResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiDowngradeSubscriptionDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({ summary: 'Downgrade subscription' }),

    ApiParam({
      name: 'id',
      description: 'Subscription ID',
      example: 'sub_123456',
    }),

    ApiBody({ type: DowngradeSubscriptionDto }),

    ApiOkResponse({
      description: 'Subscription downgrade scheduled',
      type: SubscriptionWrapperResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Subscription must be active or invalid input',
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
      description: 'Subscription or new plan not found',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to downgrade subscription',
      type: ErrorResponseDto,
    }),
  );
