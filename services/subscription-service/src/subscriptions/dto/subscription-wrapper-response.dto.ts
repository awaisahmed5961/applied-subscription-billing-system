import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionResponseDto } from './subscription-response.dto';

export class SubscriptionWrapperResponseDto {
  @ApiProperty({ type: () => SubscriptionResponseDto })
  subscription: SubscriptionResponseDto;
}
