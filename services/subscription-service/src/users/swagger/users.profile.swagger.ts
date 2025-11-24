import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { UserResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { ERROR_MESSAGES, STATUS_CODES } from '../../constants';

export const ApiProfileDocs = () =>
  applyDecorators(
    ApiBearerAuth(),

    ApiOperation({
      summary: 'Get current logged-in user data, active plan details, and man-hours information',
      description: 'Protected endpoint — authentication required.',
    }),

    ApiOkResponse({
      description: 'Profile of the authenticated user',
      type: UserResponseDto,
    }),

    ApiUnauthorizedResponse({
      description: 'We couldn’t verify your identity. Please sign in again.',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.UNAUTHORIZED,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'We couldn’t verify your identity. Please sign in again.',
      },
    }),

    ApiNotFoundResponse({
      description: 'User with this account does not exist',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.NOT_FOUND,
        error: ERROR_MESSAGES.NOT_FOUND,
        message: 'User with this account does not exist',
      },
    }),
  );
