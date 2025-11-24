import { applyDecorators } from '@nestjs/common';
import {
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { PlanResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiFindOnePlanDocs = () =>
  applyDecorators(
   
    ApiOperation({
      summary: 'Get a subscription plan by ID, including pricing and features',
      description: 'Public endpoint — no authentication required.',
    }),

    ApiParam({
      name: 'id',
      description: 'id',
      example: 'e2b1d12a-6a5d-4e14-9ab0-a3bc123f9f61',
    }),

    ApiOkResponse({
      description: 'Retrieve plan by id',
      type: PlanResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Plan not found',
      type: ErrorResponseDto,
      example: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Plan with id e2b1d12a-6a5d-4e14-9ab0-a3bc123f9f61 not found',
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to fetch plan',
      type: ErrorResponseDto,
      example: {
        statusCode: 500,
        error: 'Internal system',
        message: 'Something went wrong while fetching the plan. Please try again later.',
      },
    }),
  );
