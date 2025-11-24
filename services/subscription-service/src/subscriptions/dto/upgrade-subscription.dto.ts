import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000009' })
  @IsString()
  newPlanId: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  newManHours: number;
}
