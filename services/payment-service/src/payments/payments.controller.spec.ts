import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '@project/auth-lib';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ApiKeyGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    })
      // this prevents Nest from loading real guards globally
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call paymentsService.findOne with id and return result', async () => {
    const payment = { id: 'txn-1', amount: 100 };
    mockPaymentsService.findOne.mockResolvedValue(payment);

    const result = await controller.find('txn-1');

    expect(service.findOne).toHaveBeenCalledWith('txn-1');
    expect(result).toEqual(payment);
  });
});
