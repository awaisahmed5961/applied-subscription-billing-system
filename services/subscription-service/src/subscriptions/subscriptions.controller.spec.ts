import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
} from './dto';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: SubscriptionsService;

  const USER_ID = 'user-123';
  const USER_EMAIL = 'test@example.com';
  const MOCK_USER = { userId: USER_ID, email: USER_EMAIL } as any;

  const SUB_ID = 'sub-123';
  const SUB_ID_1 = 'sub-1';
  const SUB_ID_2 = 'sub-2';

  const CREATE_DTO: CreateSubscriptionDto = {
    planId: 'plan-1',
    manHours: 10,
    billingCycle: 'monthly',
  } as any;

  const UPGRADE_DTO: UpgradeSubscriptionDto = {
    newPlanId: 'plan-pro',
    newManHours: 40,
  } as any;

  const DOWNGRADE_DTO: DowngradeSubscriptionDto = {
    newPlanId: 'plan-free',
    newManHours: 5,
    applyAt: 'next_billing_period',
  } as any;

  const CANCEL_DTO: CancelSubscriptionDto = {
    cancelAt: 'immediate',
  } as any;

  const EXPECTED_SUBSCRIPTIONS_LIST = [{ id: SUB_ID_1 }, { id: SUB_ID_2 }];
  const EXPECTED_SINGLE_SUBSCRIPTION = { id: SUB_ID };
  const EXPECTED_CREATE_RESULT = {
    subscription: { id: 'sub-new' },
    payment: { id: 'pay-1', status: 'pending' },
  };
  const EXPECTED_UPGRADE_RESULT = {
    subscription: { id: SUB_ID, pendingChange: { type: 'upgrade' } },
    payment: { id: 'pay-upgrade-1', status: 'pending' },
  };
  const EXPECTED_DOWNGRADE_RESULT = {
    subscription: {
      id: SUB_ID,
      pendingChange: { type: 'downgrade', applyAt: 'next_billing_period' },
    },
  };
  const EXPECTED_CANCEL_RESULT = {
    subscription: { id: SUB_ID, status: 'canceled' },
  };

  const subscriptionsServiceMock = {
    getUserSubscriptions: jest.fn(),
    getUserSubscriptionById: jest.fn(),
    createSubscription: jest.fn(),
    upgradeSubscription: jest.fn(),
    downgradeSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: subscriptionsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get<SubscriptionsService>(SubscriptionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptions', () => {
    it('should call service.getUserSubscriptions with current user id and return result', async () => {
      subscriptionsServiceMock.getUserSubscriptions.mockResolvedValue(EXPECTED_SUBSCRIPTIONS_LIST);

      const result = await controller.getSubscriptions(MOCK_USER);

      expect(service.getUserSubscriptions).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual(EXPECTED_SUBSCRIPTIONS_LIST);
    });
  });

  describe('createSubscription', () => {
    it('should call service.createSubscription with user id and dto', async () => {
      subscriptionsServiceMock.createSubscription.mockResolvedValue(EXPECTED_CREATE_RESULT);

      const result = await controller.createSubscription(CREATE_DTO, MOCK_USER);

      expect(service.createSubscription).toHaveBeenCalledWith(USER_ID, CREATE_DTO);
      expect(result).toEqual(EXPECTED_CREATE_RESULT);
    });
  });

  describe('upgradeSubscription', () => {
    it('should call service.upgradeSubscription with user id, subscription id and dto', async () => {
      subscriptionsServiceMock.upgradeSubscription.mockResolvedValue(EXPECTED_UPGRADE_RESULT);

      const result = await controller.upgradeSubscription(SUB_ID, UPGRADE_DTO, MOCK_USER);

      expect(service.upgradeSubscription).toHaveBeenCalledWith(USER_ID, SUB_ID, UPGRADE_DTO);
      expect(result).toEqual(EXPECTED_UPGRADE_RESULT);
    });
  });

  describe('downgradeSubscription', () => {
    it('should call service.downgradeSubscription with user id, subscription id and dto', async () => {
      subscriptionsServiceMock.downgradeSubscription.mockResolvedValue(EXPECTED_DOWNGRADE_RESULT);

      const result = await controller.downgradeSubscription(SUB_ID, DOWNGRADE_DTO, MOCK_USER);

      expect(service.downgradeSubscription).toHaveBeenCalledWith(USER_ID, SUB_ID, DOWNGRADE_DTO);
      expect(result).toEqual(EXPECTED_DOWNGRADE_RESULT);
    });
  });

  describe('cancelSubscription', () => {
    it('should call service.cancelSubscription with user id, subscription id and dto', async () => {
      subscriptionsServiceMock.cancelSubscription.mockResolvedValue(EXPECTED_CANCEL_RESULT);

      const result = await controller.cancelSubscription(SUB_ID, CANCEL_DTO, MOCK_USER);

      expect(service.cancelSubscription).toHaveBeenCalledWith(USER_ID, SUB_ID, CANCEL_DTO);
      expect(result).toEqual(EXPECTED_CANCEL_RESULT);
    });
  });
});
