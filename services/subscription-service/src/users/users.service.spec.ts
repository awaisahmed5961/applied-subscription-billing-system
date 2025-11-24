import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  Subscription,
  PaymentStatus,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Plan, BillingCycle } from '../plans/entities/plan.entity';
import { Referral } from '../referral/entities/referral.entity';
import { ReferralService } from '../referral/referral.service';
import { TokenService } from '@project/auth-lib';
import { CreateUserDto } from './dto';

import bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  let userRepo: jest.Mocked<Repository<User>>;
  let subscriptionRepo: jest.Mocked<Repository<Subscription>>;
  let planRepo: jest.Mocked<Repository<Plan>>;
  let referralService: jest.Mocked<ReferralService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const userRepoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const subscriptionRepoMock: Partial<jest.Mocked<Repository<Subscription>>> = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const planRepoMock: Partial<jest.Mocked<Repository<Plan>>> = {
      findOne: jest.fn(),
    };

    const referralServiceMock: Partial<jest.Mocked<ReferralService>> = {
      validateReferralCode: jest.fn(),
      markUsed: jest.fn(),
    };

    const tokenServiceMock: Partial<jest.Mocked<TokenService>> = {
      generateToken: jest.fn(),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepoMock,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: planRepoMock,
        },
        {
          provide: ReferralService,
          useValue: referralServiceMock,
        },
        {
          provide: TokenService,
          useValue: tokenServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    planRepo = module.get(getRepositoryToken(Plan));
    referralService = module.get(ReferralService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUserWithEmailAndPassword', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emilyxy@example.com',
      password: 'Password123!',
      referralCode: undefined,
    } as any;

    it('should register a user, create free subscription, and return token (no referral)', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      const createdUser: User = {
        id: 'user-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: createUserDto.email,
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      // Free plan
      const freePlan: Plan = {
        id: 'plan-free',
        name: 'Free',
        manHours: 20,
        pricePerManHour: 0,
        billingCycle: BillingCycle.FREE,
        discount: null,
        features: ['Basic'],
        subscriptions: [],
      } as any;

      planRepo.findOne.mockResolvedValueOnce(freePlan);

      const createdSubscription: Subscription = {
        id: 'sub-1',
        user: createdUser,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: null,
        manHoursUsed: 0,
        totalCost: 0,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentId: null,
        pendingChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      subscriptionRepo.create.mockReturnValue(createdSubscription);
      subscriptionRepo.save.mockResolvedValue(createdSubscription);

      // userWithSubscriptions
      userRepo.findOne.mockResolvedValueOnce({
        ...createdUser,
        subscriptions: [createdSubscription],
      } as any);

      tokenService.generateToken.mockReturnValue('jwt-token');

      const result = await service.registerUserWithEmailAndPassword(createUserDto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(userRepo.create).toHaveBeenCalled();
      expect(planRepo.findOne).toHaveBeenCalledWith({ where: { name: 'Free' } });
      expect(subscriptionRepo.create).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(tokenService.generateToken).toHaveBeenCalledWith({
        userId: createdUser.id,
        email: createdUser.email,
      });

      expect(result.user.email).toBe(createUserDto.email);
      expect(result.token).toBe('jwt-token');
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 'existing-id' } as any);

      await expect(service.registerUserWithEmailAndPassword(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException if free plan not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      const createdUser: User = {
        id: 'user-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: createUserDto.email,
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      planRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.registerUserWithEmailAndPassword(createUserDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('should handle referral code: validate, markUsed, add referral relation', async () => {
      const dtoWithReferral: CreateUserDto = {
        ...createUserDto,
        email: 'referral@example.com',
        referralCode: 'REF100',
      } as any;

      userRepo.findOne.mockResolvedValueOnce(null);

      const createdUser: User = {
        id: 'user-2',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: dtoWithReferral.email,
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.create.mockReturnValue(createdUser);
      userRepo.save.mockResolvedValue(createdUser);

      const referral: Referral = {
        id: 'ref-1',
        code: 'REF100',
        bonusManHours: 100,
        startsAt: new Date(Date.now() - 1000),
        endsAt: new Date(Date.now() + 1000 * 60),
        maxUses: null,
        usedCount: 0,
        isActive: true,
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      referralService.validateReferralCode.mockResolvedValue(referral);
      referralService.markUsed.mockResolvedValue(referral);

      const freePlan: Plan = {
        id: 'plan-free',
        name: 'Free',
        manHours: 20,
        pricePerManHour: 0,
        billingCycle: BillingCycle.FREE,
        discount: null,
        features: ['Basic'],
        subscriptions: [],
      } as any;
      planRepo.findOne.mockResolvedValueOnce(freePlan);

      const createdSubscription: Subscription = {
        id: 'sub-2',
        user: createdUser,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: null,
        manHoursUsed: 0,
        totalCost: 0,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentId: null,
        pendingChange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      subscriptionRepo.create.mockReturnValue(createdSubscription);
      subscriptionRepo.save.mockResolvedValue(createdSubscription);

      userRepo.findOne.mockResolvedValueOnce({
        ...createdUser,
        subscriptions: [createdSubscription],
        referral,
      } as any);

      tokenService.generateToken.mockReturnValue('jwt-token-ref');

      const result = await service.registerUserWithEmailAndPassword(dtoWithReferral);

      expect(referralService.validateReferralCode).toHaveBeenCalledWith('REF100');
      expect(referralService.markUsed).toHaveBeenCalledWith(referral);
      expect(result.user.email).toBe(dtoWithReferral.email);
      expect(result.token).toBe('jwt-token-ref');
    });
  });

  describe('loginWithEmail', () => {
    it('should throw BadRequestException if email or password missing', async () => {
      await expect(service.loginWithEmail({ email: '', password: 'pass' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      await expect(
        service.loginWithEmail({ email: 'test@example.com', password: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.loginWithEmail({
          email: 'notfound@example.com',
          password: 'Password123!',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const user: User = {
        id: 'user-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily@example.com',
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.findOne.mockResolvedValueOnce(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.loginWithEmail({
          email: 'emily@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return user and token on successful login', async () => {
      const user: User = {
        id: 'user-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily@example.com',
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.findOne.mockResolvedValueOnce(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      tokenService.generateToken.mockReturnValue('login-token');

      const result = await service.loginWithEmail({
        email: 'emily@example.com',
        password: 'Password123!',
      });

      expect(result.user).toBe(user);
      expect(result.token).toBe('login-token');
      expect(tokenService.generateToken).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user with subscriptions if found', async () => {
      const user: User = {
        id: 'user-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily@example.com',
        password: 'hashed-password',
        isActive: true,
        subscriptions: [],
      } as any;

      userRepo.findOne.mockResolvedValueOnce(user);

      const result = await service.getProfile('user-1');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['subscriptions', 'subscriptions.plan'],
      });
      expect(result).toBe(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getProfile('unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
