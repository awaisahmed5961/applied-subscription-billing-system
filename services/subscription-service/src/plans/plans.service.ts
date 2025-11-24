import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto, FindPlansQueryDto } from './dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const existing = await this.planRepository.findOne({
      where: { name: createPlanDto.name },
    });

    if (existing) {
      throw new ConflictException('Plan name already exists');
    }

    const plan = this.planRepository.create(createPlanDto);
    return await this.planRepository.save(plan);
  }

  async findAll(query: FindPlansQueryDto) {
    const { billingCycle } = query;

    try {
      if (billingCycle) {
        return await this.planRepository.find({
          where: { billingCycle },
        });
      }

      // if no filter → return all
      return await this.planRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch plans');
    }
  }
  async findOne(id: string) {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });
      if (!plan) {
        throw new NotFoundException('We could not find a plan matching this ID.');
      }
      return plan;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong while fetching the plan. Please try again later.',
      );
    }
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.planRepository.preload({
      id,
      ...updatePlanDto,
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }

    return await this.planRepository.save(plan);
  }

  async remove(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }

    await this.planRepository.delete(id);
    return { message: 'Plan removed successfully' };
  }
}
