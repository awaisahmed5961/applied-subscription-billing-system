import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UnauthorizedException } from '@nestjs/common';
import { AuthTokenPayload } from '@project/auth-lib';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const USER_ID = 'user-123';
  const USER_EMAIL = 'emilyjohnson@xyz.com';

  const REGISTER_DTO: CreateUserDto = {
    firstName: 'Emily',
    lastName: 'Johnson',
    email: USER_EMAIL,
    password: 'Password123!',
  };

  const REGISTER_RESULT = {
    user: {
      id: USER_ID,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: USER_EMAIL,
    },
    token: 'jwt-token',
  };

  const LOGIN_BODY = {
    email: USER_EMAIL,
    password: 'Password123!',
  };

  const LOGIN_RESULT = {
    user: {
      id: USER_ID,
      email: USER_EMAIL,
    },
    token: 'jwt-token',
  };

  const VALID_TOKEN_PAYLOAD: AuthTokenPayload = {
    userId: USER_ID,
    email: USER_EMAIL,
  };

  const PROFILE_RESULT = {
    id: USER_ID,
    firstName: 'Emily',
    lastName: 'Johnson',
    email: USER_EMAIL,
  };

  const BAD_TOKEN_PAYLOAD = {
    email: USER_EMAIL,
  } as AuthTokenPayload;

  const usersServiceMock = {
    registerUserWithEmailAndPassword: jest.fn(),
    loginWithEmail: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call registerUserWithEmailAndPassword and return result', async () => {
      usersServiceMock.registerUserWithEmailAndPassword.mockResolvedValue(REGISTER_RESULT);

      const result = await controller.create(REGISTER_DTO);

      expect(service.registerUserWithEmailAndPassword).toHaveBeenCalledWith(REGISTER_DTO);
      expect(result).toEqual(REGISTER_RESULT);
    });
  });

  describe('login', () => {
    it('should call loginWithEmail and return result', async () => {
      usersServiceMock.loginWithEmail.mockResolvedValue(LOGIN_RESULT);

      const result = await controller.login(LOGIN_BODY);

      expect(service.loginWithEmail).toHaveBeenCalledWith(LOGIN_BODY);
      expect(result).toEqual(LOGIN_RESULT);
    });
  });

  describe('getUserProfile', () => {
    it('should call getProfile with userId and return profile', async () => {
      usersServiceMock.getProfile.mockResolvedValue(PROFILE_RESULT);

      const result = await controller.getUserProfile(VALID_TOKEN_PAYLOAD);

      expect(service.getProfile).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual(PROFILE_RESULT);
    });

    it('should throw UnauthorizedException if user payload is undefined', () => {
      expect(() => controller.getUserProfile(undefined)).toThrow(UnauthorizedException);
      expect(service.getProfile).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if userId is missing', () => {
      expect(() => controller.getUserProfile(BAD_TOKEN_PAYLOAD)).toThrow(UnauthorizedException);
      expect(service.getProfile).not.toHaveBeenCalled();
    });
  });
});
