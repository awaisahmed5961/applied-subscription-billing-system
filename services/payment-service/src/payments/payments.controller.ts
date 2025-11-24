import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiInitiatePaymentDocs, ApiFindPaymentDocs } from './swagger';
import { ApiKeyGuard, SignatureGuard } from '@project/auth-lib';
@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiBody({ type: InitiatePaymentDto })
  @ApiInitiatePaymentDocs()
  @UseGuards(ApiKeyGuard, SignatureGuard)
  async initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(dto);
  }

  @Get(':id')
  @ApiFindPaymentDocs()
  async find(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
