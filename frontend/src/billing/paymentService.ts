/**
 * Mock Payment Service.
 *
 * Эмулирует платёжный шлюз. Не выполняет реальных транзакций,
 * но логирует все действия и позволяет симулировать успех/неудачу.
 *
 * При подключении реального шлюза (Stripe, ЮKassa и т.д.)
 * нужно реализовать интерфейс PaymentAdapter.
 */
import type { BillingPlan, Invoice, InvoiceStatus, PaymentLog } from './billingTypes';
import { BILLING_CONFIG } from './billingConfig';

let logId = 1000;
function genLogId(): number { return ++logId; }

let invoiceId = 500;
function genInvoiceId(): number { return ++invoiceId; }

/**
 * Интерфейс платёжного адаптера.
 * При подключении реального шлюза — реализуется заново,
 * остальной код не меняется.
 */
export interface PaymentAdapter {
  createInvoice(subscriptionId: number, plan: BillingPlan): Invoice;
  processPayment(invoice: Invoice): Promise<{ success: boolean; details: string }>;
}

/**
 * Mock-реализация платёжного адаптера
 */
export class MockPaymentAdapter implements PaymentAdapter {
  private simulateSuccess = true;
  private processingDelayMs = 800;

  setSimulateSuccess(value: boolean): void {
    this.simulateSuccess = value;
  }

  createInvoice(subscriptionId: number, plan: BillingPlan): Invoice {
    const config = BILLING_CONFIG.plans[plan];
    const now = new Date().toISOString();

    return {
      id: genInvoiceId(),
      subscriptionId,
      amount: config.price,
      plan,
      status: 'pending',
      createdAt: now,
      paidAt: null,
    };
  }

  async processPayment(invoice: Invoice): Promise<{ success: boolean; details: string }> {
    await new Promise((r) => setTimeout(r, this.processingDelayMs));

    if (this.simulateSuccess) {
      return {
        success: true,
        details: `Mock payment processed. Invoice #${invoice.id}, amount: ${invoice.amount}`,
      };
    }
    return {
      success: false,
      details: `Mock payment DECLINED. Invoice #${invoice.id}. Simulated failure.`,
    };
  }
}

/**
 * Сервис платежей. Оборачивает адаптер, добавляя логирование и
 * обновление статусов счетов.
 */
export class PaymentService {
  private adapter: PaymentAdapter;
  private logs: PaymentLog[] = [];
  private invoices: Invoice[] = [];

  constructor(adapter?: PaymentAdapter) {
    this.adapter = adapter || new MockPaymentAdapter();
  }

  getAdapter(): PaymentAdapter {
    return this.adapter;
  }

  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  getInvoicesBySubscription(subscriptionId: number): Invoice[] {
    return this.invoices.filter((i) => i.subscriptionId === subscriptionId);
  }

  getLogs(): PaymentLog[] {
    return [...this.logs];
  }

  getLogsByInvoice(invoiceId: number): PaymentLog[] {
    return this.logs.filter((l) => l.invoiceId === invoiceId);
  }

  private addLog(invoiceId: number, action: string, status: string, amount: number, details: string): PaymentLog {
    const log: PaymentLog = {
      id: genLogId(),
      invoiceId,
      action,
      status,
      amount,
      timestamp: new Date().toISOString(),
      details,
    };
    this.logs.push(log);
    return log;
  }

  private updateInvoiceStatus(invoiceId: number, status: InvoiceStatus, paidAt?: string): void {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = status;
      if (paidAt) inv.paidAt = paidAt;
    }
  }

  createInvoice(subscriptionId: number, plan: BillingPlan): Invoice {
    this.cancelPendingInvoices(subscriptionId);

    const invoice = this.adapter.createInvoice(subscriptionId, plan);
    this.invoices.push(invoice);

    this.addLog(
      invoice.id,
      'INVOICE_CREATED',
      'pending',
      invoice.amount,
      `Created invoice for ${plan} plan`
    );

    return invoice;
  }

  /**
   * Отмена всех pending-счетов подписки (защита от двойного нажатия)
   */
  cancelPendingInvoices(subscriptionId: number): void {
    this.invoices
      .filter((i) => i.subscriptionId === subscriptionId && i.status === 'pending')
      .forEach((i) => {
        i.status = 'cancelled';
        this.addLog(i.id, 'INVOICE_CANCELLED', 'cancelled', i.amount, 'Superseded by new invoice');
      });
  }

  async processPayment(invoiceId: number): Promise<{ success: boolean; invoice: Invoice }> {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'pending') {
      throw new Error(`Cannot process invoice with status "${invoice.status}"`);
    }

    this.addLog(invoice.id, 'PAYMENT_PROCESSING', 'processing', invoice.amount, 'Payment initiated');

    const result = await this.adapter.processPayment(invoice);

    if (result.success) {
      const paidAt = new Date().toISOString();
      this.updateInvoiceStatus(invoice.id, 'paid', paidAt);
      this.addLog(invoice.id, 'PAYMENT_SUCCESS', 'paid', invoice.amount, result.details);
    } else {
      this.updateInvoiceStatus(invoice.id, 'failed');
      this.addLog(invoice.id, 'PAYMENT_FAILED', 'failed', invoice.amount, result.details);
    }

    return {
      success: result.success,
      invoice: { ...this.invoices.find((i) => i.id === invoiceId)! },
    };
  }

  /** Прямая симуляция успешной оплаты (для UI-кнопки «Симулировать оплату») */
  simulatePaymentSuccess(subscriptionId: number, plan: BillingPlan): Invoice {
    const invoice = this.createInvoice(subscriptionId, plan);
    const paidAt = new Date().toISOString();
    this.updateInvoiceStatus(invoice.id, 'paid', paidAt);
    this.addLog(invoice.id, 'SIMULATE_SUCCESS', 'paid', invoice.amount, 'Manual simulation: success');
    return { ...this.invoices.find((i) => i.id === invoice.id)! };
  }

  /** Прямая симуляция неудачной оплаты */
  simulatePaymentFail(subscriptionId: number, plan: BillingPlan): Invoice {
    const invoice = this.createInvoice(subscriptionId, plan);
    this.updateInvoiceStatus(invoice.id, 'failed');
    this.addLog(invoice.id, 'SIMULATE_FAIL', 'failed', invoice.amount, 'Manual simulation: failure');
    return { ...this.invoices.find((i) => i.id === invoice.id)! };
  }

  /** Восстановление данных из localStorage */
  loadState(invoices: Invoice[], logs: PaymentLog[]): void {
    this.invoices = invoices;
    this.logs = logs;
    const maxInv = invoices.reduce((m, i) => Math.max(m, i.id), invoiceId);
    const maxLog = logs.reduce((m, l) => Math.max(m, l.id), logId);
    invoiceId = maxInv;
    logId = maxLog;
  }

  /** Сериализация для сохранения в localStorage */
  getState(): { invoices: Invoice[]; logs: PaymentLog[] } {
    return {
      invoices: [...this.invoices],
      logs: [...this.logs],
    };
  }
}
