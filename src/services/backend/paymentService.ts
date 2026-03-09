import { LedgerService } from './ledgerService';
import { CommerceService } from './commerceService';
import { OrderStatus } from '../../types/operational';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  provider: 'paypal' | 'revolut';
  checkoutUrl: string;
}

export interface PaymentProvider {
  createIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntent>;
  verifyPayment(intentId: string): Promise<boolean>;
}

class PayPalAdapter implements PaymentProvider {
  async createIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    // Mocking PayPal API call
    const id = `pp_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      amount,
      currency,
      status: 'pending',
      provider: 'paypal',
      checkoutUrl: `https://www.paypal.com/checkout?id=${id}&order=${orderId}`
    };
  }
  async verifyPayment(intentId: string): Promise<boolean> {
    return true; // Mock success
  }
}

class RevolutAdapter implements PaymentProvider {
  async createIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    // Mocking Revolut API call
    const id = `rev_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      amount,
      currency,
      status: 'pending',
      provider: 'revolut',
      checkoutUrl: `https://revolut.me/pay/${id}?amount=${amount}`
    };
  }
  async verifyPayment(intentId: string): Promise<boolean> {
    return true; // Mock success
  }
}

export class PaymentService {
  private static providers: Record<string, PaymentProvider> = {
    paypal: new PayPalAdapter(),
    revolut: new RevolutAdapter()
  };

  static async createPayment(providerName: 'paypal' | 'revolut', amount: number, currency: string, orderId: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new Error(`Provider ${providerName} not supported`);

    const intent = await provider.createIntent(amount, currency, orderId);
    
    // Record in ledger as pending payment
    await LedgerService.recordEntry({
      orderId,
      type: 'payment',
      amount,
      currency,
      fromId: userId,
      toId: 'platform_escrow',
      description: `Pending ${providerName} payment for order ${orderId}`
    });

    return intent;
  }

  static async handleWebhook(providerName: string, payload: any) {
    const { intentId, status, orderId, userId, amount, currency } = payload;
    
    if (status === 'succeeded') {
      // 1. Update order status to PAID
      await CommerceService.updateOrderStatus(orderId, OrderStatus.PAID);
      
      // 2. Record final ledger entries (fees, merchant payout)
      const subtotal = amount / 1.15; // Simplified reverse calculation
      const platformFee = subtotal * 0.05;
      const tax = subtotal * 0.10;
      const deliveryFee = 5.00;
      const merchantPayout = subtotal;

      // Platform Fee Entry
      await LedgerService.recordEntry({
        orderId,
        type: 'fee',
        amount: platformFee,
        currency,
        fromId: userId,
        toId: 'platform_revenue',
        description: `Platform fee for order ${orderId}`
      });

      // Tax Entry
      await LedgerService.recordEntry({
        orderId,
        type: 'fee',
        amount: tax,
        currency,
        fromId: userId,
        toId: 'tax_authority',
        description: `Tax for order ${orderId}`
      });

      // Merchant Payout Entry
      await LedgerService.recordEntry({
        orderId,
        type: 'payout',
        amount: merchantPayout,
        currency,
        fromId: userId,
        toId: 'merchant_account',
        description: `Payout for order ${orderId}`
      });

      console.log(`[Payment] Webhook processed: Order ${orderId} is now PAID`);
    }
  }
}
