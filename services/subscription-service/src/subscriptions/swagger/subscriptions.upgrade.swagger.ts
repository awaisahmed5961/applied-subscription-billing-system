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
import { UpgradeSubscriptionDto, SubscriptionWithPaymentResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { STATUS_CODES } from 'http';
import { ERROR_MESSAGES } from '../../constants';

export const ApiUpgradeSubscriptionDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({ summary: 'Upgrade subscription' }),

    ApiParam({
      name: 'id',
      description: 'subscription id',
      example: '10000000-0000-0000-0000-000000000002',
    }),

    ApiBody({ type: UpgradeSubscriptionDto }),

    ApiOkResponse({
      description: 'Subscription upgrade initiated and payment started',
      type: SubscriptionWithPaymentResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Subscription must be active or invalid input',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.BAD_REQUEST,
        error: ERROR_MESSAGES.BAD_REQUEST,
        message: 'Request Body contains invalid data',
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Invalid or missing token',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.UNAUTHORIZED,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Unauthorized to perform this action',
      },
    }),

    ApiForbiddenResponse({
      description: 'Invalid subscription',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.FORBIDDEN,
        error: ERROR_MESSAGES.FORBIDDEN,
        message: 'Operation not permitted',
      },
    }),

    ApiNotFoundResponse({
      description: 'Subscription or plan not found',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.NOT_FOUND,
        error: ERROR_MESSAGES.NOT_FOUND,
        message: 'Subscription or plan does not exist',
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to upgrade subscription',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong, service failed to upgrade.',
      },
    }),
  );
