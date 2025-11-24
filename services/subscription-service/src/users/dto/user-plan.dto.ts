import { ApiProperty } from '@nestjs/swagger';

export class UserPlanDto {
  @ApiProperty({ example: 'efd2b21a-2cba-45f5-a5a6-6c54645798a85' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ example: 9.99 })
  price: number;

  @ApiProperty({ example: 'AED' })
  currency: string;
}
