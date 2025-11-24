import { ApiProperty } from '@nestjs/swagger';

export class PlanDeleteResponseDto {
  @ApiProperty({ example: 'Plan removed successfully' })
  message: string;
}
