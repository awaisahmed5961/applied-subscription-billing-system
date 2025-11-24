import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
  FREE = 'free',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('int')
  manHours: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pricePerManHour: number;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discount?: number; //only in percentage but in feature it can be extended.

  @Column({ type: 'json', nullable: true })
  features?: string[];

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
