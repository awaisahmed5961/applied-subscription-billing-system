import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreatePlanDto, PlanResponseDto } from '../dto';
import { ErrorResponseDto } from '../../error-response.dto';

export const ApiCreatePlanDocs = () =>
  applyDecorators(
    ApiBody({ type: CreatePlanDto }),

    ApiCreatedResponse({
      description: 'Plan created successfully',
      type: PlanResponseDto,
    }),

    ApiBadRequestResponse({
      description: 'Invalid request body',
      type: ErrorResponseDto,
    }),

    ApiConflictResponse({
      description: 'Plan name already exists',
      type: ErrorResponseDto,
    }),

    ApiInternalServerErrorResponse({
      description: 'Failed to create plan',
      type: ErrorResponseDto,
    }),
  );
