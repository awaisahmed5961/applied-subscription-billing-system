import { Controller, Get, Post, Body, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthTokenPayload, CurrentUser, JwtAuthGuard } from '@project/auth-lib';
import { CreateUserDto } from './dto';
import { ApiRegisterDocs, ApiLoginDocs, ApiProfileDocs } from './swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/auth/register')
  @ApiRegisterDocs()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.registerUserWithEmailAndPassword(createUserDto);
  }

  @Post('/auth/login')
  @ApiLoginDocs()
  login(@Body() body: { email: string; password: string }) {
    return this.usersService.loginWithEmail(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiProfileDocs()
  getUserProfile(@CurrentUser() user: AuthTokenPayload | undefined) {
    const userFromToken = user as AuthTokenPayload | undefined;
    if (!userFromToken || !userFromToken.userId) {
      throw new UnauthorizedException('We couldn’t verify your identity. Please sign in again.');
    }

    return this.usersService.getProfile(userFromToken.userId);
  }
}
