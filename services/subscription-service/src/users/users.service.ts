import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TokenService, AuthTokenPayload } from '@project/auth-lib';
import { CreateUserDto } from './dto';
import {
  Subscription,
  SubscriptionStatus,
  PaymentStatus,
} from '../subscriptions/entities/subscription.entity';
import { Plan, BillingCycle } from '../plans/entities/plan.entity';
import bcrypt from 'bcrypt';
import { Referral } from '../referral/entities/referral.entity';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    private readonly referralService: ReferralService,
    private readonly tokenService: TokenService,
  ) {}

  async registerUserWithEmailAndPassword(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      // 1) Create user (basic data only)
      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      let referralBonusManHours = 0;
      let referralEntity: Referral | null = null;

      // 2) If there is a referralCode, validate & compute bonus
      if (createUserDto.referralCode) {
        const referral = await this.referralService.validateReferralCode(
          createUserDto.referralCode,
        );

        referralBonusManHours = referral.bonusManHours;
        referralEntity = referral;

        await this.referralService.markUsed(referral);

        (user as any).referral = referral;
      }

      const savedUser = await this.userRepository.save(user);

      const freePlan = await this.planRepository.findOne({
        where: { name: 'Free' },
      });

      if (!freePlan) {
        throw new InternalServerErrorException('Free plan not found. Please seed default plans.');
      }

      const startDate = new Date();
      const endDate = this.getEndDateForPlan(freePlan, startDate);

      const baseManHours = freePlan.manHours;

      const totalAllocatedManHours = baseManHours + referralBonusManHours;

      const newSubscription = this.subscriptionRepository.create({
        user: savedUser,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        manHoursUsed: 0,
        totalCost: 0,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentId: null,
        pendingChange: null,
      });

      await this.subscriptionRepository.save(newSubscription);

      const userWithSubscriptions = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['subscriptions', 'subscriptions.plan', 'referral'],
      });

      const payload: AuthTokenPayload = {
        userId: savedUser.id,
        email: savedUser.email,
      };

      const token = this.tokenService.generateToken(payload);

      return {
        user: userWithSubscriptions ?? savedUser,
        token,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async loginWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['subscriptions', 'subscriptions.plan'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = this.tokenService.generateToken(payload);

    return { user, token };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscriptions', 'subscriptions.plan'],
    });

    if (!user) {
      throw new NotFoundException('User with this account does not exist');
    }

    return user;
  }

  private getEndDateForPlan(plan: Plan, startDate: Date): Date | null {
    const end = new Date(startDate);

    switch (plan.billingCycle) {
      case BillingCycle.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        return end;
      case BillingCycle.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        return end;
      case BillingCycle.FREE:
      case BillingCycle.CUSTOM:
      default:
        return null;
    }
  }
}
