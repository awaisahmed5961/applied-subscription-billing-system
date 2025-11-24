import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiInternalServerErrorResponse, ApiOperation } from '@nestjs/swagger';
import { PlanResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';
import { ERROR_MESSAGES, STATUS_CODES } from '../../constants';

export const ApiFindAllPlansDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all subscription plans with their pricing and features',
      description:
        'Public endpoint — no authentication required. Optionally filter results by billing cycle such as monthly, yearly, free, or custom.',
    }),

    ApiOkResponse({
      description: 'Retrieve all available plans',
      type: PlanResponseDto,
      isArray: true,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to fetch plans',
      type: ErrorResponseDto,
      schema: {
        example: {
          statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
          error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          message: 'Something went wrong, please try again later',
        },
      },
    }),
  );
