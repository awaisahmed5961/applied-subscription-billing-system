import { applyDecorators } from '@nestjs/common';
import {
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PlanDeleteResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiDeletePlanDocs = () =>
  applyDecorators(
    ApiParam({
      name: 'id',
      description: 'UUID of the plan',
      example: 'e2b1d12a-6a5d-4e14-9ab0-a3bc123f9f61',
    }),

    ApiOkResponse({
      description: 'Plan deleted successfully',
      type: PlanDeleteResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Plan not found',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to delete plan',
      type: ErrorResponseDto,
    }),
  );
