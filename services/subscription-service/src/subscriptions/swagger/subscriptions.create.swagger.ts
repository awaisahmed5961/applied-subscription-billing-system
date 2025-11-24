import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@project/auth-lib';
import { CreateSubscriptionDto, SubscriptionWithPaymentResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { ERROR_MESSAGES, STATUS_CODES } from '../../constants';

export const ApiCreateSubscriptionDocs = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('authorization'),

    ApiOperation({
      summary: 'Create a subscription and initiate payment',
    }),

    ApiBody({ type: CreateSubscriptionDto }),

    ApiCreatedResponse({
      description: 'Subscription created and payment initiated',
      type: SubscriptionWithPaymentResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Invalid request body',
      type: ErrorResponseDto,

      example: {
        statusCode: STATUS_CODES.BAD_REQUEST,
        error: ERROR_MESSAGES.BAD_REQUEST,
        message: 'PlanId is missing',
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Invalid or missing token',
      type: ErrorResponseDto,

      example: {
        statusCode: STATUS_CODES.UNAUTHORIZED,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'You are unauthorized to perform this action',
      },
    }),

    ApiNotFoundResponse({
      description: 'User or Plan not found',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.NOT_FOUND,
        error: ERROR_MESSAGES.NOT_FOUND,
        message: 'Required Resource does not exist',
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to create subscription',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
      },
    }),
  );
