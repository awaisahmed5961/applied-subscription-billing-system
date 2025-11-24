import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApiFindAllPlansDocs, ApiFindOnePlanDocs } from './swagger';

import { PlansService } from './plans.service';
import { ApiTags } from '@nestjs/swagger';
import { FindPlansQueryDto } from './dto';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiFindAllPlansDocs()
  findAll(@Query() query: FindPlansQueryDto = {}) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  @ApiFindOnePlanDocs()
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }
}
