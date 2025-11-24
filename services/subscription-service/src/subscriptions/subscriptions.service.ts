import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, PaymentStatus } from './entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateSubscriptionDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionOverviewDto,
  PaymentWebhookDto,
} from './dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { signPayload } from '@project/auth-lib';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepo: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly plansRepo: Repository<Plan>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly http: HttpService,

    private readonly configService: ConfigService,
  ) {}

  async getUserSubscriptions(userId: string) {
    return this.subscriptionsRepo.find({
      where: { user: { id: userId } },
      relations: ['plan'],
    });
  }

  async getUserSubscriptionById(userId: string, id: string) {
    const subscription = await this.subscriptionsRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async getSubscriptionOverview(userId: string): Promise<SubscriptionOverviewDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['subscriptions', 'subscriptions.plan'],
    });

    if (!user?.subscriptions) {
      throw new NotFoundException('No active subscription found for this user');
    }

    const activeSubscription = user.subscriptions
      ?.filter((s) => s.status === 'active')
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];

    const total = activeSubscription?.plan?.manHours ?? 0;
    const manhoursUsed = activeSubscription?.manHoursUsed ?? 0;
    const manhoursRemaining = Math.max(total - manhoursUsed, 0);

    return {
      currentPlan: activeSubscription?.plan?.name ?? 'Free',
      manhoursRemaining,
      manhoursTotal: total,
      manhoursUsed,
    };
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.plansRepo.findOne({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    let amount = dto.manHours * Number(plan.pricePerManHour ?? 0);

    if (dto.billingCycle === 'yearly') {
      amount = amount * 12;
    }

    if (plan.discount != null) {
      const discountFactor = 1 - Number(plan.discount) / 100;
      amount = amount * discountFactor;
    }

    let subscription = await this.subscriptionsRepo.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();

    if (subscription) {
      subscription.plan = {
        ...plan,
        manHours: dto.manHours,
      };
      subscription.startDate = now;
      subscription.endDate = null;
      subscription.status = SubscriptionStatus.PENDING_PAYMENT;
      subscription.paymentStatus = PaymentStatus.PENDING;
      subscription.totalCost = amount;
      subscription.manHoursUsed = 0;
      subscription.paymentId = null;
      subscription.pendingChange = null;
    } else {
      subscription = this.subscriptionsRepo.create({
        user,
        plan,
        startDate: now,
        endDate: null,
        status: SubscriptionStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalCost: amount,
        manHoursUsed: 0,
        paymentId: null,
        pendingChange: null,
      });
    }

    subscription = await this.subscriptionsRepo.save(subscription);

    const paymentResult = await this.sendPaymentRequest(subscription.id, userId, amount);
    if (!paymentResult.ok) {
      subscription.paymentStatus = PaymentStatus.FAILED;
      await this.subscriptionsRepo.save(subscription);

      return {
        subscription,
        payment: { error: paymentResult.error },
      };
    }
    const { data } = paymentResult;

    subscription.paymentId = data.transactionId;
    subscription.paymentStatus = PaymentStatus.PENDING;
    await this.subscriptionsRepo.save(subscription);

    return {
      subscription,
      payment: data,
    };
  }

  async upgradeSubscription(userId: string, subscriptionId: string, dto: UpgradeSubscriptionDto) {
    const subscription = await this.subscriptionsRepo.findOne({
      where: { id: subscriptionId },
      relations: ['user', 'plan'],
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.user.id !== userId) {
      throw new ForbiddenException('Not your subscription');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription must be active to upgrade');
    }

    const newPlan = await this.plansRepo.findOne({
      where: { id: dto.newPlanId },
    });

    if (!newPlan) throw new NotFoundException('New plan not found');

    let upgradeAmount = dto.newManHours * Number(newPlan.pricePerManHour);

    if (newPlan.billingCycle === 'yearly') {
      upgradeAmount *= 12;
    }

    if (newPlan.discount != null) {
      const discountFactor = 1 - Number(newPlan.discount) / 100;
      upgradeAmount *= discountFactor;
    }

    let manHours = subscription.plan.manHours + dto.newManHours;
    subscription.plan.manHours = manHours;

    subscription.pendingChange = {
      type: 'upgrade',
      newPlanId: newPlan.id,
      newManHours: dto.newManHours,
      effectiveDate: new Date().toISOString(),
    };

    subscription.paymentStatus = PaymentStatus.PENDING;
    subscription.paymentId = null;

    await this.subscriptionsRepo.save(subscription);

    const paymentResult = await this.sendPaymentRequest(subscription.id, userId, upgradeAmount);
    if (!paymentResult.ok) {
      subscription.paymentStatus = PaymentStatus.FAILED;
      await this.subscriptionsRepo.save(subscription);

      return {
        subscription,
        payment: { error: paymentResult.error },
      };
    }
    const { data } = paymentResult;

    subscription.paymentId = data.transactionId;
    subscription.paymentStatus = PaymentStatus.PENDING;
    await this.subscriptionsRepo.save(subscription);

    return {
      subscription,
      payment: data,
    };
  }

  async downgradeSubscription(
    userId: string,
    subscriptionId: string,
    dto: DowngradeSubscriptionDto,
  ) {
    const subscription = await this.subscriptionsRepo.findOne({
      where: { id: subscriptionId },
      relations: ['user', 'plan'],
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.user.id !== userId) {
      throw new ForbiddenException('Not your subscription');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription must be active to downgrade');
    }

    const newPlan = await this.plansRepo.findOne({
      where: { id: dto.newPlanId },
    });
    if (!newPlan) throw new NotFoundException('New plan not found');

    const effectiveDate: string | null =
      dto.applyAt === 'immediate' ? new Date().toISOString() : null;

    subscription.pendingChange = {
      type: 'downgrade',
      newPlanId: newPlan.id,
      newManHours: dto.newManHours,
      applyAt: dto.applyAt,
      effectiveDate,
    };

    const saved = await this.subscriptionsRepo.save(subscription);

    return {
      subscription: saved,
    };
  }

  async cancelSubscription(userId: string, subscriptionId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.subscriptionsRepo.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.user.id !== userId) {
      throw new ForbiddenException('Not your subscription');
    }

    const cancelAt = dto.cancelAt ?? 'immediate';

    if (cancelAt === 'immediate') {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.endDate = new Date();
      subscription.pendingChange = null;
    } else {
      subscription.pendingChange = {
        type: 'cancel',
        effectiveDate: null,
      };
    }

    const saved = await this.subscriptionsRepo.save(subscription);

    return {
      subscription: saved,
    };
  }

  async handlePaymentWebhook(data: PaymentWebhookDto): Promise<any> {
    const { transactionId, subscriptionId, status, amount } = data;

    const subscription = await this.subscriptionsRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'user'],
    });

    if (!subscription) {
      return { ok: false, error: 'Subscription not found' };
    }

    let incomingPaymentStatus: PaymentStatus;
    let incomingSubscriptionStatus: SubscriptionStatus;

    if (status === 'success') {
      incomingPaymentStatus = PaymentStatus.SUCCESS;
      incomingSubscriptionStatus = SubscriptionStatus.ACTIVE;
    } else if (status === 'failed') {
      incomingPaymentStatus = PaymentStatus.FAILED;
      incomingSubscriptionStatus = SubscriptionStatus.FAILED;
    } else {
      return { ok: false, error: `Unsupported status: ${status}` };
    }

    if (subscription.paymentStatus === incomingPaymentStatus) {
      return {
        ok: true,
        alreadyProcessed: true,
        subscriptionId: subscription.id,
        paymentStatus: subscription.paymentStatus,
        subscriptionStatus: subscription.status,
      };
    }

    if (subscription.totalCost != null && Number(subscription.totalCost) !== Number(amount)) {
      console.warn?.(
        `Webhook amount mismatch for subscription ${subscriptionId}: expected ${subscription.totalCost}, got ${amount}`,
      );
    }

    subscription.paymentStatus = incomingPaymentStatus;
    subscription.status = incomingSubscriptionStatus;
    subscription.paymentId = transactionId;

    if (incomingPaymentStatus === PaymentStatus.SUCCESS) {
      subscription.startDate = new Date();
    }

    await this.subscriptionsRepo.save(subscription);

    return {
      ok: true,
      subscriptionId: subscription.id,
      paymentStatus: subscription.paymentStatus,
      subscriptionStatus: subscription.status,
    };
  }

  private async sendPaymentRequest(subscriptionId: string, userId: string, amount: number) {
    const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL');
    const paymentApiKey = this.configService.get<string>('PAYMENT_SERVICE_KEY');
    const webhookBaseUrl = this.configService.get<string>('SUBSCRIPTION_WEBHOOK_URL');
    const paymentSharedSecret = this.configService.get<string>('PAYMENT_SHARED_SECRET');

    if (!paymentSharedSecret) {
      throw new Error('PAYMENT_SHARED_SECRET is missing in environment variables');
    }

    const paymentPayload = {
      subscriptionId,
      amount,
      currency: 'AED',
      userId,
      webhookUrl: `${webhookBaseUrl}/webhooks/payment`,
    };

    const timestamp = Date.now().toString();
    const signature = signPayload(paymentSharedSecret, paymentPayload, timestamp);

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${paymentServiceUrl}/payments/initiate`, paymentPayload, {
          headers: {
            'x-api-key': paymentApiKey,
            'x-signature': signature,
            'x-timestamp': timestamp,
          },
        }),
      );

      return { ok: true as const, data };
    } catch (err) {
      return {
        ok: false as const,
        error: 'payment_service_unreachable' as const,
      };
    }
  }
}
