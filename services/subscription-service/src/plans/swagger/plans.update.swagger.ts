import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { UpdatePlanDto, PlanResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiUpdatePlanDocs = () =>
  applyDecorators(
    ApiParam({
      name: 'id',
      description: 'UUID of the plan',
      example: 'e2b1d12a-6a5d-4e14-9ab0-a3bc123f9f61',
    }),

    ApiBody({ type: UpdatePlanDto }),

    ApiOkResponse({
      description: 'Plan updated successfully',
      type: PlanResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Invalid update payload',
      type: ErrorResponseDto,
    }),

    ApiNotFoundResponse({
      description: 'Plan not found',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to update plan',
      type: ErrorResponseDto,
    }),
  );
