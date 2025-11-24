import { ApiProperty } from '@nestjs/swagger';
import { UserPlanDto } from './user-plan.dto';

export class UserSubscriptionDto {
  @ApiProperty({ example: 'efd2b21a-2cba-45f5-a5a6-6c8070798790' })
  id: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ type: () => UserPlanDto })
  plan: UserPlanDto;
}
