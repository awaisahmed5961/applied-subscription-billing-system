import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateUserDto, AuthResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { ERROR_MESSAGES, STATUS_CODES } from '../../constants';

export const ApiRegisterDocs = () =>
  applyDecorators(
    ApiBody({ type: CreateUserDto }),

    ApiOperation({
      summary: 'Register a new user with email and password',
    }),

    ApiCreatedResponse({
      description: 'User registered and token returned',
      type: AuthResponseDto,
    }),
    ApiConflictResponse({
      description: 'User with this email already exists',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.CONFLICT,
        error: ERROR_MESSAGES.CONFLICT,
        message: 'User already exists',
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.BAD_REQUEST,
        error: ERROR_MESSAGES.BAD_REQUEST,
        message: 'Email is required',
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Failed to create user',
      type: ErrorResponseDto,
      example: {
        statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong while creating user',
      },
    }),
  );
