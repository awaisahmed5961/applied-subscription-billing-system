import { ApiProperty } from '@nestjs/swagger';
import { UserSubscriptionDto } from './user-subscription.dto';

export class UserResponseDto {
  @ApiProperty({ example: 'efd2b21a-2cba-45f5-a5a6-6c8070798a85' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({
    type: () => [UserSubscriptionDto],
    required: false,
    description: 'User subscriptions with their plans',
  })
  subscriptions?: UserSubscriptionDto[];
}
