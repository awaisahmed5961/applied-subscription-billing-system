import { PartialType } from '@nestjs/mapped-types';
import { InitiatePaymentDto } from './initiate-payment.dto';

export class UpdatePaymentDto extends PartialType(InitiatePaymentDto) {}
