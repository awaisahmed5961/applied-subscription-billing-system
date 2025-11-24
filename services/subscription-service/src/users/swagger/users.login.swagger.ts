import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { STATUS_CODES } from 'http';
import { ERROR_MESSAGES } from '../../constants';
export const ApiLoginDocs = () =>
  applyDecorators(
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            example: 'emilyjohnson@xyz.com',
          },
          password: {
            type: 'string',
            example: 'Password123!',
          },
        },
        required: ['email', 'password'],
      },
    }),

    ApiOperation({
      summary: 'User Authentication with email & password',
    }),

    ApiOkResponse({
      description: 'User logged in and token returned',
      type: AuthResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Email is required',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.BAD_REQUEST,
        error: ERROR_MESSAGES.BAD_REQUEST,
        message: 'Email is required',
      },
    }),

    ApiNotFoundResponse({
      description: 'User with this email does not exist',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.NOT_FOUND,
        error: ERROR_MESSAGES.NOT_FOUND,
        message: 'User with this email does not exist',
      },
    }),
  );
