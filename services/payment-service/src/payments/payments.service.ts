import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Payment, TransactionStatus } from './entities/payment.entity';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfigService } from '@nestjs/config';
import { signPayload } from '@project/auth-lib';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async initiate(dto: InitiatePaymentDto) {
    const txn = this.paymentRepo.create({
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      currency: dto.currency,
      webhookUrl: dto.webhookUrl,
      status: TransactionStatus.PENDING,
    });

    const saved = await this.paymentRepo.save(txn);

    this.processPayment(saved);

    return {
      transactionId: saved.id,
      status: 'processing',
    };
  }

  private async processPayment(txn: Payment) {
    setTimeout(async () => {
      const success = Math.random() > 0.1;

      txn.status = TransactionStatus.SUCCESS;
      await this.paymentRepo.save(txn);

      await this.sendWebhook(txn);
    }, 2000);
  }

  private async sendWebhook(txn: Payment) {
    const body = {
      transactionId: txn.id,
      subscriptionId: txn.subscriptionId,
      status: txn.status,
      amount: txn.amount,
      timestamp: new Date().toISOString(),
    };

    const paymentSharedSecret = this.configService.get<string>('PAYMENT_SHARED_SECRET');
    const paymentApiKey = this.configService.get<string>('PAYMENT_SERVICE_KEY');

    if (!paymentSharedSecret) {
      throw new Error('PAYMENT_SHARED_SECRET is missing in environment variables');
    }

    const timestamp = Date.now().toString();
    const signature = signPayload(paymentSharedSecret, body, timestamp);

    try {
      await firstValueFrom(
        this.http.post(txn.webhookUrl, body, {
          headers: {
            'x-api-key': paymentApiKey,
            'x-signature': signature,
            'x-timestamp': timestamp,
          },
        }),
      );

      await this.paymentRepo.update(txn.id, {
        attempts: txn.attempts + 1,
      });
    } catch (err) {
      this.retryWebhook(txn);
    }
  }

  private async retryWebhook(txn: Payment) {
    const MAX_RETRIES = 5;

    if (txn.attempts >= MAX_RETRIES) {
      console.error(`Webhook failed permanently for txn ${txn.id}`);
      return;
    }

    const delay = Math.pow(2, txn.attempts) * 1000;

    setTimeout(async () => {
      txn.attempts += 1;
      await this.paymentRepo.save(txn);

      await this.sendWebhook(txn);
    }, delay);
  }

  async findOne(id: string) {
    return this.paymentRepo.findOne({ where: { id } });
  }
}
