import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Exclude } from 'class-transformer';
import { Referral } from '../../referral/entities/referral.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @Column({ type: 'uuid', nullable: true })
  referralId?: string | null;

  @ManyToOne(() => Referral, (ref) => ref.users, { nullable: true })
  @JoinColumn({ name: 'referralId' })
  referral?: Referral | null;
}
