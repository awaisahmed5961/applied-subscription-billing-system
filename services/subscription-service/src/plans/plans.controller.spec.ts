import { Test, TestingModule } from '@nestjs/testing';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

describe('Plans Controller Coverage', () => {
  let controller: PlansController;
  let service: PlansService;

  const PLAN_ID_1 = 'plan-1';
  const PLAN_ID_2 = 'plan-2';
  const PLAN_ID_SINGLE = 'plan-123';

  const PLAN_LIST = [
    { id: PLAN_ID_1, name: 'Free' },
    { id: PLAN_ID_2, name: 'Pro' },
  ] as any;

  const SINGLE_PLAN = { id: PLAN_ID_SINGLE, name: 'Scale' } as any;

  const plansServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [
        {
          provide: PlansService,
          useValue: plansServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PlansController>(PlansController);
    service = module.get<PlansService>(PlansService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all plans from service', async () => {
      plansServiceMock.findAll.mockResolvedValue(PLAN_LIST);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(PLAN_LIST);
    });
  });

  describe('findOne', () => {
    it('should return one plan from service by id', async () => {
      plansServiceMock.findOne.mockResolvedValue(SINGLE_PLAN);

      const result = await controller.findOne(PLAN_ID_SINGLE);

      expect(service.findOne).toHaveBeenCalledWith(PLAN_ID_SINGLE);
      expect(result).toEqual(SINGLE_PLAN);
    });
  });
});
