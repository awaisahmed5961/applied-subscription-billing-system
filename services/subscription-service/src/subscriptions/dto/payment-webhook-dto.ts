export class PaymentWebhookDto {
  transactionId: string;
  subscriptionId: string;
  status: 'success' | 'failed';
  amount: number;
  timestamp: string;
}
