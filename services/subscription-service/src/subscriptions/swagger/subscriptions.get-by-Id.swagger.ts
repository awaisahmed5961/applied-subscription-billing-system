import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@project/auth-lib';
import { SubscriptionResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiGetSubscriptionByIdDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({
      summary: 'Get a single subscription (only if it belongs to current user)',
    }),

    ApiParam({
      name: 'id',
      description: 'Subscription ID',
      example: 'sub_123456',
    }),

    ApiOkResponse({
      description: 'Subscription details',
      type: SubscriptionResponseDto,
    }),

    ApiUnauthorizedResponse({
      description: 'Invalid or missing token',
      type: ErrorResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Subscription not found',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to fetch subscription',
      type: ErrorResponseDto,
    }),
  );
