import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@project/auth-lib';
import { SubscriptionResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiGetSubscriptionsDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({ summary: 'Get all subscriptions for current user' }),

    ApiOkResponse({
      description: 'List of subscriptions for the authenticated user',
      type: SubscriptionResponseDto,
      isArray: true,
    }),

    ApiUnauthorizedResponse({
      description: 'Invalid or missing token',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to fetch subscriptions',
      type: ErrorResponseDto,
    }),
  );
