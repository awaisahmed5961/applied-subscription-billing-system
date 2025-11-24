import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralService } from './referral.service';
import { Referral } from './entities/referral.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReferralService', () => {
  let service: ReferralService;
  let repo: jest.Mocked<Repository<Referral>>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Referral>>> = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(Referral),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    repo = module.get(getRepositoryToken(Referral));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateReferralCode', () => {
    const baseReferral: Referral = {
      id: 'ref-1',
      code: 'REF100',
      bonusManHours: 100,
      startsAt: new Date(Date.now() - 1000),
      endsAt: new Date(Date.now() + 60_000),
      maxUses: null,
      usedCount: 0,
      isActive: true,
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    it('should return referral if code is valid', async () => {
      repo.findOne.mockResolvedValue(baseReferral);

      const result = await service.validateReferralCode('REF100');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { code: 'REF100' } });
      expect(result).toBe(baseReferral);
    });

    it('should throw NotFoundException if code does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.validateReferralCode('INVALID')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if referral is inactive', async () => {
      repo.findOne.mockResolvedValue({
        ...baseReferral,
        isActive: false,
      });

      await expect(service.validateReferralCode('REF100')).rejects.toThrow(
        new BadRequestException('Referral code is inactive'),
      );
    });

    it('should throw BadRequestException if referral not active yet', async () => {
      repo.findOne.mockResolvedValue({
        ...baseReferral,
        startsAt: new Date(Date.now() + 60_000),
      });

      await expect(service.validateReferralCode('REF100')).rejects.toThrow(
        new BadRequestException('Referral code is not active yet'),
      );
    });

    it('should throw BadRequestException if referral has expired', async () => {
      repo.findOne.mockResolvedValue({
        ...baseReferral,
        endsAt: new Date(Date.now() - 60_000),
      });

      await expect(service.validateReferralCode('REF100')).rejects.toThrow(
        new BadRequestException('Referral code has expired'),
      );
    });

    it('should throw BadRequestException if usage limit reached', async () => {
      repo.findOne.mockResolvedValue({
        ...baseReferral,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(service.validateReferralCode('REF100')).rejects.toThrow(
        new BadRequestException('Referral code usage limit reached'),
      );
    });

    it('should allow when maxUses is not reached', async () => {
      repo.findOne.mockResolvedValue({
        ...baseReferral,
        maxUses: 5,
        usedCount: 3,
      });

      const result = await service.validateReferralCode('REF100');

      expect(result).toBeDefined();
      expect(result.code).toBe('REF100');
    });
  });

  describe('markUsed', () => {
    it('should increment usedCount and save referral', async () => {
      const referral: Referral = {
        id: 'ref-1',
        code: 'REF100',
        bonusManHours: 100,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60_000),
        maxUses: null,
        usedCount: 2,
        isActive: true,
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const savedReferral = { ...referral, usedCount: 3 };
      repo.save.mockResolvedValue(savedReferral);

      const result = await service.markUsed(referral);

      expect(referral.usedCount).toBe(3);
      expect(repo.save).toHaveBeenCalledWith(referral);
      expect(result.usedCount).toBe(3);
    });
  });
});
