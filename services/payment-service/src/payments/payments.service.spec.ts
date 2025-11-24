import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { PaymentsService } from './payments.service';
import { Payment, TransactionStatus } from './entities/payment.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { Repository } from 'typeorm';
import { signPayload } from '@project/auth-lib';

jest.mock('@project/auth-lib', () => ({
  signPayload: jest.fn(() => 'mock-signature'),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;
  let http: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const PAYMENT_SHARED_SECRET = 'test-secret';
  const PAYMENT_SERVICE_KEY = 'api-key-123';

  const buildPayment = (overrides: Partial<Payment> = {}): Payment =>
    ({
      id: 'txn-1',
      subscriptionId: 'sub-1',
      amount: 100,
      currency: 'AED',
      webhookUrl: 'http://subscription-service/webhooks/payment',
      status: TransactionStatus.PENDING,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as any;

  beforeEach(async () => {
    const paymentRepoMock: Partial<jest.Mocked<Repository<Payment>>> = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const httpMock: Partial<jest.Mocked<HttpService>> = {
      post: jest.fn(),
    };

    const configServiceMock: Partial<jest.Mocked<ConfigService>> = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          PAYMENT_SHARED_SECRET,
          PAYMENT_SERVICE_KEY,
        };
        return map[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepoMock,
        },
        {
          provide: HttpService,
          useValue: httpMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    http = module.get(HttpService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiate', () => {
    it('should create and save a pending transaction and return transactionId + status', async () => {
      const dto: InitiatePaymentDto = {
        subscriptionId: 'sub-123',
        amount: 50,
        currency: 'AED',
        webhookUrl: 'http://subscription-service/webhooks/payment',
      } as any;

      const created = buildPayment({
        id: 'txn-abc',
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        currency: dto.currency,
        webhookUrl: dto.webhookUrl,
        status: TransactionStatus.PENDING,
      });

      paymentRepo.create.mockReturnValue(created);
      paymentRepo.save.mockResolvedValue(created);

      const processPaymentSpy = jest
        .spyOn(service as any, 'processPayment')
        .mockResolvedValue(undefined);

      const result = await service.initiate(dto);

      expect(paymentRepo.create).toHaveBeenCalledWith({
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        currency: dto.currency,
        webhookUrl: dto.webhookUrl,
        status: TransactionStatus.PENDING,
      });

      expect(paymentRepo.save).toHaveBeenCalledWith(created);
      expect(processPaymentSpy).toHaveBeenCalledWith(created);

      expect(result).toEqual({
        transactionId: 'txn-abc',
        status: 'processing',
      });
    });
  });

  describe('findOne', () => {
    it('should delegate to paymentRepo.findOne', async () => {
      const payment = buildPayment({ id: 'txn-xyz' });
      paymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.findOne('txn-xyz');

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'txn-xyz' },
      });
      expect(result).toBe(payment);
    });
  });

  describe('sendWebhook / retryWebhook (integration-style)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send webhook and update attempts on success', async () => {
      const txn = buildPayment({ attempts: 0 });

      http.post.mockReturnValue(of({ data: { ok: true } } as any));

      const sendWebhook = (service as any).sendWebhook.bind(service);

      await sendWebhook(txn);

      expect(signPayload).toHaveBeenCalledWith(
        PAYMENT_SHARED_SECRET,
        expect.objectContaining({
          transactionId: txn.id,
          subscriptionId: txn.subscriptionId,
          status: txn.status,
          amount: txn.amount,
        }),
        expect.any(String),
      );

      expect(http.post).toHaveBeenCalledWith(
        txn.webhookUrl,
        expect.objectContaining({
          transactionId: txn.id,
          subscriptionId: txn.subscriptionId,
          status: txn.status,
          amount: txn.amount,
        }),
        {
          headers: {
            'x-api-key': PAYMENT_SERVICE_KEY,
            'x-signature': 'mock-signature',
            'x-timestamp': expect.any(String),
          },
        },
      );

      expect(paymentRepo.update).toHaveBeenCalledWith(txn.id, {
        attempts: txn.attempts + 1,
      });
    });
  });
});
