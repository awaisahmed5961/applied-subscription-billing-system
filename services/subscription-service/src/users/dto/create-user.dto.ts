import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Emily', description: 'User first name' })
  firstName: string;

  @ApiProperty({ example: 'Johnson', description: 'User last name' })
  lastName: string;

  @ApiProperty({ example: 'emilyjohnson@xyz.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Create Strong Password' })
  password: string;

  @ApiProperty({ example: 'REF100', description: 'Referral Code' })
  @IsOptional()
  referralCode: string;
}
