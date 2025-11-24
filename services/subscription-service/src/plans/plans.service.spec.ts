import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { FindPlansQueryDto } from './dto';

describe('Plans Service Coverage', () => {
  let service: PlansService;
  let repo: jest.Mocked<Repository<Plan>>;

  const PLAN_ID = 'plan-1';
  const PLAN_ID_2 = 'plan-2';
  const PLAN_NAME = 'Pro';
  const PLAN_NAME_UPDATED = 'Pro Updated';
  const MISSING_ID = 'missing-id';

  const CREATE_DTO: CreatePlanDto = {
    name: PLAN_NAME,
    manHours: 20,
    pricePerManHour: 1.5 as any,
    billingCycle: 'monthly' as any,
    discount: 10 as any,
    features: ['feature1', 'feature2'],
  };

  const CREATE_DTO_CONFLICT: CreatePlanDto = {
    name: PLAN_NAME,
    manHours: 20,
    pricePerManHour: 1.5 as any,
    billingCycle: 'monthly' as any,
    discount: 0,
    features: [],
  };

  const CREATED_PLAN: Plan = {
    id: PLAN_ID,
    ...CREATE_DTO,
    subscriptions: [] as any,
  };

  const ALL_PLANS: Plan[] = [
    { id: PLAN_ID, name: 'Free' } as Plan,
    { id: PLAN_ID_2, name: PLAN_NAME } as Plan,
  ];

  const FOUND_PLAN: Plan = { id: PLAN_ID, name: PLAN_NAME } as Plan;

  const UPDATE_DTO: UpdatePlanDto = {
    name: PLAN_NAME_UPDATED,
    pricePerManHour: 2.0 as any,
  };

  const UPDATED_PLAN: Plan = {
    id: PLAN_ID,
    ...UPDATE_DTO,
  } as Plan;

  const REMOVE_SUCCESS_RESULT = { message: 'Plan removed successfully' };

  const repoMock: Partial<jest.Mocked<Repository<Plan>>> = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: getRepositoryToken(Plan),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    repo = module.get(getRepositoryToken(Plan));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new plan when name is unique', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(CREATED_PLAN);
      (repo.save as jest.Mock).mockResolvedValue(CREATED_PLAN);

      const result = await service.create(CREATE_DTO);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { name: CREATE_DTO.name },
      });
      expect(repo.create).toHaveBeenCalledWith(CREATE_DTO);
      expect(repo.save).toHaveBeenCalledWith(CREATED_PLAN);
      expect(result).toEqual(CREATED_PLAN);
    });

    it('should throw ConflictException when plan name already exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        id: 'existing-plan',
      } as Plan);

      await expect(service.create(CREATE_DTO_CONFLICT)).rejects.toBeInstanceOf(ConflictException);

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all plans when no billingCycle filter is provided', async () => {
      (repo.find as jest.Mock).mockResolvedValue(ALL_PLANS);

      const query = {} as FindPlansQueryDto;

      const result = await service.findAll(query);

      // find() should be called without where when no billingCycle present
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith();
      expect(result).toEqual(ALL_PLANS);
    });

    it('should return plans filtered by billingCycle when provided', async () => {
      const MONTHLY_PLANS: Plan[] = [
        { id: PLAN_ID, name: 'Monthly Basic', billingCycle: 'monthly' as any } as Plan,
        { id: PLAN_ID_2, name: 'Monthly Pro', billingCycle: 'monthly' as any } as Plan,
      ];

      (repo.find as jest.Mock).mockResolvedValue(MONTHLY_PLANS);

      const query: FindPlansQueryDto = { billingCycle: 'monthly' as any };

      const result = await service.findAll(query);

      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { billingCycle: 'monthly' as any },
      });
      expect(result).toEqual(MONTHLY_PLANS);
    });

    it('should throw InternalServerErrorException on error when no filter is provided', async () => {
      (repo.find as jest.Mock).mockRejectedValue(new Error('DB error'));

      const query = {} as FindPlansQueryDto;

      await expect(service.findAll(query)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith();
    });

    it('should throw InternalServerErrorException on error when billingCycle filter is provided', async () => {
      (repo.find as jest.Mock).mockRejectedValue(new Error('DB error'));

      const query: FindPlansQueryDto = { billingCycle: 'yearly' as any };

      await expect(service.findAll(query)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(repo.find).toHaveBeenCalledTimes(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { billingCycle: 'yearly' as any },
      });
    });
  });

  describe('findOne', () => {
    it('should return plan when found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(FOUND_PLAN);

      const result = await service.findOne(PLAN_ID);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: PLAN_ID } });
      expect(result).toEqual(FOUND_PLAN);
    });

    it('should throw NotFoundException when plan not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(MISSING_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw InternalServerErrorException when an unexpected error occurs', async () => {
      const planId = PLAN_ID;
      const unexpectedError = new Error('Database crashed');
      (repo.findOne as jest.Mock).mockRejectedValue(unexpectedError);

      await expect(service.findOne(planId)).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: planId } });
    });
  });

  describe('update', () => {
    it('should preload, save and return updated plan when exists', async () => {
      (repo.preload as jest.Mock).mockResolvedValue(UPDATED_PLAN);
      (repo.save as jest.Mock).mockResolvedValue(UPDATED_PLAN);

      const result = await service.update(PLAN_ID, UPDATE_DTO);

      expect(repo.preload).toHaveBeenCalledWith({ id: PLAN_ID, ...UPDATE_DTO });
      expect(repo.save).toHaveBeenCalledWith(UPDATED_PLAN);
      expect(result).toEqual(UPDATED_PLAN);
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      (repo.preload as jest.Mock).mockResolvedValue(null);

      const dummyDto: UpdatePlanDto = { name: 'Does not matter' } as any;

      await expect(service.update(MISSING_ID, dummyDto)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete plan and return success message when exists', async () => {
      const existingPlan = { id: PLAN_ID, name: PLAN_NAME } as Plan;

      (repo.findOne as jest.Mock).mockResolvedValue(existingPlan);
      (repo.delete as jest.Mock).mockResolvedValue({} as any);

      const result = await service.remove(PLAN_ID);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: PLAN_ID } });
      expect(repo.delete).toHaveBeenCalledWith(PLAN_ID);
      expect(result).toEqual(REMOVE_SUCCESS_RESULT);
    });

    it('should throw NotFoundException when plan not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(MISSING_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
