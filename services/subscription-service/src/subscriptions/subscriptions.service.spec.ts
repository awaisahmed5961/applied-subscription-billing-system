import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionStatus, PaymentStatus } from './entities/subscription.entity';
import { Plan, BillingCycle } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import {
  CreateSubscriptionDto,
  DowngradeSubscriptionDto,
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  PaymentWebhookDto,
} from './dto';
import { signPayload } from '@project/auth-lib';

// mock signPayload
jest.mock('@project/auth-lib', () => ({
  signPayload: jest.fn(() => 'mock-signature'),
}));

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionsRepo: jest.Mocked<Repository<Subscription>>;
  let plansRepo: jest.Mocked<Repository<Plan>>;
  let usersRepo: jest.Mocked<Repository<User>>;
  let http: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  // ---------- SHARED CONSTANTS / HELPERS ----------

  const USER_ID = 'user-123';
  const OTHER_USER_ID = 'other-user';
  const SUBSCRIPTION_ID = 'sub-1';
  const PAYMENT_SERVICE_URL = 'http://payment-service:3001';
  const SUBSCRIPTION_WEBHOOK_URL = 'http://subscription-service:3000';
  const PAYMENT_API_KEY = 'secret-api-key-123';
  const PAYMENT_SHARED_SECRET = 'super-secret';
  const DEFAULT_CURRENCY = 'AED';

  const BASE_CREATE_DTO: CreateSubscriptionDto = {
    planId: 'plan-1',
    manHours: 10,
    billingCycle: 'monthly',
  } as any;

  const BASE_UPGRADE_DTO: UpgradeSubscriptionDto = {
    newPlanId: 'plan-2',
    newManHours: 20,
  } as any;

  const BASE_DOWNGRADE_DTO: DowngradeSubscriptionDto = {
    newPlanId: 'plan-free',
    newManHours: 10,
    applyAt: 'next_billing_period',
  } as any;

  const BASE_CANCEL_DTO_IMMEDIATE: CancelSubscriptionDto = {
    cancelAt: 'immediate',
  } as any;

  const BASE_CANCEL_DTO_PERIOD: CancelSubscriptionDto = {
    cancelAt: 'end_of_period',
  } as any;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: USER_ID,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily@example.com',
      isActive: true,
      subscriptions: [],
      ...overrides,
    }) as any;

  const buildPlan = (overrides: Partial<Plan> = {}): Plan =>
    ({
      id: 'plan-1',
      name: 'Pro',
      manHours: 20,
      pricePerManHour: 2.5,
      billingCycle: BillingCycle.MONTHLY,
      discount: 20,
      features: [],
      subscriptions: [],
      ...overrides,
    }) as any;

  const buildSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
    ({
      id: SUBSCRIPTION_ID,
      user: buildUser(),
      plan: buildPlan(),
      status: SubscriptionStatus.ACTIVE,
      paymentStatus: PaymentStatus.SUCCESS,
      manHoursUsed: 0,
      totalCost: 0,
      startDate: new Date(),
      endDate: null,
      paymentId: null,
      pendingChange: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as any;

  const buildExpectedPaymentPayload = (subscriptionId: string, amount: number) => ({
    subscriptionId,
    amount,
    currency: DEFAULT_CURRENCY,
    userId: USER_ID,
    webhookUrl: `${SUBSCRIPTION_WEBHOOK_URL}/webhooks/payment`,
  });

  const buildBaseWebhookPayload = (overrides: Partial<PaymentWebhookDto> = {}): PaymentWebhookDto =>
    ({
      transactionId: 'txn-1',
      subscriptionId: SUBSCRIPTION_ID,
      status: 'success',
      amount: 10,
      ...overrides,
    }) as any;

  // ---------- BEFORE EACH ----------

  beforeEach(async () => {
    const subscriptionsRepoMock: Partial<jest.Mocked<Repository<Subscription>>> = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const plansRepoMock: Partial<jest.Mocked<Repository<Plan>>> = {
      findOne: jest.fn(),
    };

    const usersRepoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
    };

    const httpMock: Partial<jest.Mocked<HttpService>> = {
      post: jest.fn(),
    };

    const configServiceMock: Partial<jest.Mocked<ConfigService>> = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          PAYMENT_SERVICE_URL,
          SUBSCRIPTION_WEBHOOK_URL,
          PAYMENT_SERVICE_KEY: PAYMENT_API_KEY,
          PAYMENT_SHARED_SECRET,
        };
        return map[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(Subscription), useValue: subscriptionsRepoMock },
        { provide: getRepositoryToken(Plan), useValue: plansRepoMock },
        { provide: getRepositoryToken(User), useValue: usersRepoMock },
        { provide: HttpService, useValue: httpMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionsRepo = module.get(getRepositoryToken(Subscription));
    plansRepo = module.get(getRepositoryToken(Plan));
    usersRepo = module.get(getRepositoryToken(User));
    http = module.get(HttpService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  // ---------- TESTS ----------

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserSubscriptions', () => {
    it('should call repo.find with userId and return subscriptions', async () => {
      const expected = [{ id: 'sub-1' } as any];

      subscriptionsRepo.find.mockResolvedValue(expected as any);

      const result = await service.getUserSubscriptions(USER_ID);

      expect(subscriptionsRepo.find).toHaveBeenCalledWith({
        where: { user: { id: USER_ID } },
        relations: ['plan'],
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getUserSubscriptionById', () => {
    it('should return subscription when found', async () => {
      const subscription = buildSubscription();

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      const result = await service.getUserSubscriptionById(USER_ID, SUBSCRIPTION_ID);

      expect(subscriptionsRepo.findOne).toHaveBeenCalledWith({
        where: { id: SUBSCRIPTION_ID, user: { id: USER_ID } },
        relations: ['user', 'plan'],
      });
      expect(result).toBe(subscription);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      subscriptionsRepo.findOne.mockResolvedValue(null);

      await expect(service.getUserSubscriptionById(USER_ID, 'sub-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getSubscriptionOverview', () => {
    it('should return overview of active subscription', async () => {
      const now = new Date();
      const plan = buildPlan({ manHours: 50 });
      const activeSub = buildSubscription({
        id: 'sub-latest',
        status: SubscriptionStatus.ACTIVE,
        plan,
        manHoursUsed: 10,
        startDate: now,
      });

      const olderSub = buildSubscription({
        id: 'sub-old',
        status: SubscriptionStatus.ACTIVE,
        plan,
        manHoursUsed: 0,
        startDate: new Date(now.getTime() - 1000),
      });

      const user = buildUser({
        subscriptions: [olderSub, activeSub],
      });

      usersRepo.findOne.mockResolvedValue(user as any);

      const overview = await service.getSubscriptionOverview(USER_ID);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: USER_ID },
        relations: ['subscriptions', 'subscriptions.plan'],
      });

      expect(overview).toEqual({
        currentPlan: 'Pro',
        manhoursRemaining: 40,
        manhoursTotal: 50,
        manhoursUsed: 10,
      });
    });

    it('should throw NotFoundException if user has no subscriptions', async () => {
      const user = buildUser({ subscriptions: undefined as any });

      usersRepo.findOne.mockResolvedValue(user as any);

      await expect(service.getSubscriptionOverview(USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createSubscription', () => {
    const user = buildUser();

    it('should create new subscription when none exists, call payment, and save paymentId', async () => {
      const plan = buildPlan();

      usersRepo.findOne.mockResolvedValue(user as any);
      plansRepo.findOne.mockResolvedValue(plan as any);

      // no existing subscription for this user
      subscriptionsRepo.findOne.mockResolvedValue(null);

      subscriptionsRepo.create.mockImplementation((sub: any) => sub as any);
      subscriptionsRepo.save.mockImplementation(async (sub: any) => ({
        id: sub.id ?? 'sub-xyz',
        ...sub,
      }));

      const paymentApiResponse = {
        transactionId: 'txn-123',
        status: 'pending',
      };

      http.post.mockReturnValue(of({ data: paymentApiResponse } as any));

      const result = await service.createSubscription(USER_ID, BASE_CREATE_DTO);

      // amount = manHours * pricePerManHour = 10 * 2.5 = 25
      // yearly? no (monthly), discount 20% => 25 * 0.8 = 20
      const expectedAmount = 20;

      expect(subscriptionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          plan,
          totalCost: expectedAmount,
          status: SubscriptionStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
        }),
      );
      expect(subscriptionsRepo.save).toHaveBeenCalledTimes(2);

      const expectedPayload = buildExpectedPaymentPayload('sub-xyz', expectedAmount);
      const [url, body, options] = (http.post as jest.Mock).mock.calls[0];

      expect(url).toBe(`${PAYMENT_SERVICE_URL}/payments/initiate`);
      expect(body).toEqual(expectedPayload);
      expect(options.headers['x-api-key']).toBe(PAYMENT_API_KEY);
      expect(options.headers['x-signature']).toBe('mock-signature');
      expect(options.headers['x-timestamp']).toBeDefined();

      expect(signPayload as jest.Mock).toHaveBeenCalledWith(
        PAYMENT_SHARED_SECRET,
        expectedPayload,
        expect.any(String),
      );

      expect(result.payment).toEqual(paymentApiResponse);
      expect(result.subscription.paymentId).toBe('txn-123');
      expect(result.subscription.paymentStatus).toBe(PaymentStatus.PENDING);
    });

    it('should update existing subscription instead of creating new one', async () => {
      const plan = buildPlan();
      const existingSub = buildSubscription({
        id: 'sub-existing',
        user,
        plan,
        status: SubscriptionStatus.ACTIVE,
        paymentStatus: PaymentStatus.SUCCESS,
        manHoursUsed: 5,
        totalCost: 0,
        paymentId: 'old',
      });

      usersRepo.findOne.mockResolvedValue(user as any);
      plansRepo.findOne.mockResolvedValue(plan as any);
      subscriptionsRepo.findOne.mockResolvedValue(existingSub as any);
      subscriptionsRepo.save.mockImplementation(async (sub: any) => sub);

      const paymentApiResponse = {
        transactionId: 'txn-999',
        status: 'pending',
      };
      http.post.mockReturnValue(of({ data: paymentApiResponse } as any));

      const result = await service.createSubscription(USER_ID, BASE_CREATE_DTO);

      expect(subscriptionsRepo.create).not.toHaveBeenCalled();
      expect(subscriptionsRepo.save).toHaveBeenCalledTimes(2);
      expect(result.subscription.id).toBe('sub-existing');
      expect(result.subscription.status).toBe(SubscriptionStatus.PENDING_PAYMENT);
    });

    it('should mark paymentStatus FAILED when payment service is unreachable', async () => {
      const plan = buildPlan({ pricePerManHour: 2, discount: 0 });

      usersRepo.findOne.mockResolvedValue(user as any);
      plansRepo.findOne.mockResolvedValue(plan as any);
      subscriptionsRepo.findOne.mockResolvedValue(null);

      subscriptionsRepo.create.mockImplementation((sub: any) => sub as any);
      subscriptionsRepo.save.mockImplementation(async (sub: any) => ({
        id: sub.id ?? 'sub-err',
        ...sub,
      }));

      http.post.mockReturnValue(throwError(() => new Error('payment down')));

      const result = await service.createSubscription(USER_ID, BASE_CREATE_DTO);

      const lastSaveCall =
        subscriptionsRepo.save.mock.calls[subscriptionsRepo.save.mock.calls.length - 1][0];

      expect(lastSaveCall.paymentStatus).toBe(PaymentStatus.FAILED);
      expect(result.payment).toEqual({ error: 'payment_service_unreachable' });
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.createSubscription(USER_ID, BASE_CREATE_DTO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if plan not found', async () => {
      usersRepo.findOne.mockResolvedValue(user as any);
      plansRepo.findOne.mockResolvedValue(null);

      await expect(service.createSubscription(USER_ID, BASE_CREATE_DTO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade an active subscription and initiate payment', async () => {
      const currentPlan = buildPlan({ id: 'plan-1', manHours: 50 });
      const newPlan = buildPlan({ id: 'plan-2', pricePerManHour: 3, discount: 0 });

      const subscription = buildSubscription({
        plan: currentPlan,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentId: 'old',
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      plansRepo.findOne.mockResolvedValue(newPlan as any);
      subscriptionsRepo.save.mockImplementation(async (sub: any) => sub);

      const paymentApiResponse = { transactionId: 'txn-upgrade', status: 'pending' };
      http.post.mockReturnValue(of({ data: paymentApiResponse } as any));

      const result = await service.upgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_UPGRADE_DTO);

      // upgradeAmount = newManHours * pricePerManHour * 12? no, monthly
      // newPlan.billingCycle is monthly, so = 20 * 3 = 60
      const expectedAmount = 60;
      const expectedPayload = buildExpectedPaymentPayload(SUBSCRIPTION_ID, expectedAmount);

      expect(plansRepo.findOne).toHaveBeenCalledWith({ where: { id: 'plan-2' } });
      expect(subscription.plan.manHours).toBe(70); // 50 + 20
      expect(subscription.pendingChange).toEqual(
        expect.objectContaining({
          type: 'upgrade',
          newPlanId: 'plan-2',
          newManHours: 20,
        }),
      );
      expect(http.post).toHaveBeenCalledWith(
        `${PAYMENT_SERVICE_URL}/payments/initiate`,
        expectedPayload,
        expect.any(Object),
      );
      expect(result.subscription.paymentId).toBe('txn-upgrade');
      expect(result.payment).toEqual(paymentApiResponse);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upgradeSubscription(USER_ID, 'sub-x', BASE_UPGRADE_DTO),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if subscription does not belong to user', async () => {
      const subscription = buildSubscription({
        user: buildUser({ id: OTHER_USER_ID }),
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      await expect(
        service.upgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_UPGRADE_DTO),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw BadRequestException if subscription not active', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.PENDING_PAYMENT,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      await expect(
        service.upgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_UPGRADE_DTO),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException if new plan not found', async () => {
      const subscription = buildSubscription();

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      plansRepo.findOne.mockResolvedValue(null);

      await expect(
        service.upgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_UPGRADE_DTO),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('downgradeSubscription', () => {
    it('should set pendingChange for valid downgrade', async () => {
      const currentPlan = buildPlan();
      const newPlan = buildPlan({ id: 'plan-free' });

      const subscription = buildSubscription({
        plan: currentPlan,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      plansRepo.findOne.mockResolvedValue(newPlan as any);
      subscriptionsRepo.save.mockImplementation(async (s: any) => s);

      const result = await service.downgradeSubscription(
        USER_ID,
        SUBSCRIPTION_ID,
        BASE_DOWNGRADE_DTO,
      );

      expect(result.subscription.pendingChange).toEqual({
        type: 'downgrade',
        newPlanId: 'plan-free',
        newManHours: 10,
        applyAt: 'next_billing_period',
        effectiveDate: null,
      });
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.downgradeSubscription(USER_ID, 'sub-x', BASE_DOWNGRADE_DTO),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if not subscription owner', async () => {
      const subscription = buildSubscription({
        user: buildUser({ id: OTHER_USER_ID }),
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      await expect(
        service.downgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_DOWNGRADE_DTO),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw BadRequestException if subscription not active', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.PENDING_PAYMENT,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      await expect(
        service.downgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_DOWNGRADE_DTO),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException if new plan not found', async () => {
      const subscription = buildSubscription();

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      plansRepo.findOne.mockResolvedValue(null);

      await expect(
        service.downgradeSubscription(USER_ID, SUBSCRIPTION_ID, BASE_DOWNGRADE_DTO),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel immediately and set status/endDate', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
        pendingChange: null,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      subscriptionsRepo.save.mockImplementation(async (s: any) => s);

      const result = await service.cancelSubscription(
        USER_ID,
        SUBSCRIPTION_ID,
        BASE_CANCEL_DTO_IMMEDIATE,
      );

      expect(result.subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.subscription.endDate).toBeInstanceOf(Date);
      expect(result.subscription.pendingChange).toBeNull();
    });

    it('should set pending cancel when cancelAt is end_of_period', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
        pendingChange: null,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      subscriptionsRepo.save.mockImplementation(async (s: any) => s);

      const result = await service.cancelSubscription(
        USER_ID,
        SUBSCRIPTION_ID,
        BASE_CANCEL_DTO_PERIOD,
      );

      expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.subscription.pendingChange).toEqual({
        type: 'cancel',
        effectiveDate: null,
      });
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelSubscription(USER_ID, 'sub-x', BASE_CANCEL_DTO_IMMEDIATE),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if not subscription owner', async () => {
      const subscription = buildSubscription({
        user: buildUser({ id: OTHER_USER_ID }),
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      await expect(
        service.cancelSubscription(USER_ID, SUBSCRIPTION_ID, BASE_CANCEL_DTO_IMMEDIATE),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('handlePaymentWebhook', () => {
    it('should return error if subscription not found', async () => {
      subscriptionsRepo.findOne.mockResolvedValue(null);

      const payload = buildBaseWebhookPayload({ subscriptionId: 'sub-x' });

      const result = await service.handlePaymentWebhook(payload);

      expect(result).toEqual({ ok: false, error: 'Subscription not found' });
    });

    it('should return error on unsupported webhook status', async () => {
      const subscription = buildSubscription({
        paymentStatus: PaymentStatus.PENDING,
        status: SubscriptionStatus.PENDING_PAYMENT,
        totalCost: 10,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      const payload = buildBaseWebhookPayload({ status: 'unknown' as any });

      const result = await service.handlePaymentWebhook(payload);

      expect(result).toEqual({
        ok: false,
        error: 'Unsupported status: unknown',
      });
    });

    it('should be idempotent when paymentStatus already matches', async () => {
      const subscription = buildSubscription({
        paymentStatus: PaymentStatus.SUCCESS,
        status: SubscriptionStatus.ACTIVE,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);

      const payload = buildBaseWebhookPayload({ status: 'success' });

      const result = await service.handlePaymentWebhook(payload);

      expect(result).toEqual({
        ok: true,
        alreadyProcessed: true,
        subscriptionId: SUBSCRIPTION_ID,
        paymentStatus: PaymentStatus.SUCCESS,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });
      expect(subscriptionsRepo.save).not.toHaveBeenCalled();
    });

    it('should set ACTIVE/SUCCESS on success status', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalCost: 10,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      subscriptionsRepo.save.mockImplementation(async (s: any) => s);

      const payload = buildBaseWebhookPayload({ status: 'success', amount: 10 });

      const result = await service.handlePaymentWebhook(payload);

      expect(subscriptionsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          paymentStatus: PaymentStatus.SUCCESS,
          paymentId: payload.transactionId,
        }),
      );
      expect(result).toEqual({
        ok: true,
        subscriptionId: SUBSCRIPTION_ID,
        paymentStatus: PaymentStatus.SUCCESS,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });
    });

    it('should set FAILED on failed status', async () => {
      const subscription = buildSubscription({
        status: SubscriptionStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalCost: 10,
      });

      subscriptionsRepo.findOne.mockResolvedValue(subscription as any);
      subscriptionsRepo.save.mockImplementation(async (s: any) => s);

      const payload = buildBaseWebhookPayload({ status: 'failed', amount: 10 });

      const result = await service.handlePaymentWebhook(payload);

      expect(subscriptionsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.FAILED,
          paymentStatus: PaymentStatus.FAILED,
          paymentId: payload.transactionId,
        }),
      );
      expect(result).toEqual({
        ok: true,
        subscriptionId: SUBSCRIPTION_ID,
        paymentStatus: PaymentStatus.FAILED,
        subscriptionStatus: SubscriptionStatus.FAILED,
      });
    });
  });
});
