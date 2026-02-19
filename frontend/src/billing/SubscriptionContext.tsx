/**
 * React-контекст подписки.
 *
 * Загружает состояние подписки при инициализации и после каждого действия.
 * Проверяет переходы (trial → expiring → expired) при каждой загрузке
 * (заменяет cron — проверка при обращении к порталу).
 */
import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import type { Subscription, BillingPlan, Invoice, PlanTier } from './billingTypes';
import { isAccessAllowed, shouldShowWarning, getRemainingDays } from './subscriptionMachine';
import * as billingApi from '../api/billing';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  /** Доступ к порталу разрешён */
  accessAllowed: boolean;
  /** Нужно показать предупреждение о скором окончании */
  showWarning: boolean;
  /** Дней до окончания */
  remainingDays: number;
  /** Идёт ли операция оплаты */
  paying: boolean;
  /** Подписаться на тариф и интервал */
  subscribe: (planTier: PlanTier, planInterval: BillingPlan) => Promise<Invoice | null>;
  /** Симулировать успешную оплату */
  simulateSuccess: (invoiceId: number) => Promise<void>;
  /** Симулировать неудачную оплату */
  simulateFail: (invoiceId: number) => Promise<void>;
  /** Перезагрузить подписку */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  error: null,
  accessAllowed: true,
  showWarning: false,
  remainingDays: 0,
  paying: false,
  subscribe: async (): Promise<Invoice | null> => null,
  simulateSuccess: async () => {},
  simulateFail: async () => {},
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const sub = isAdmin
        ? await billingApi.getSubscription()
        : await billingApi.getPortalSubscription();
      setSubscription(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки подписки');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const subscribeToPlan = useCallback(async (planTier: PlanTier, planInterval: BillingPlan): Promise<Invoice | null> => {
    if (paying) return null;
    setPaying(true);
    try {
      const result = await billingApi.subscribe(planTier, planInterval);
      setSubscription(result.subscription);

      const payResult = await billingApi.simulatePaymentSuccess(result.invoice.id);
      setSubscription(payResult.subscription);
      return payResult.invoice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка оплаты');
      return null;
    } finally {
      setPaying(false);
    }
  }, [paying]);

  const simulateSuccess = useCallback(async (invoiceId: number) => {
    setPaying(true);
    try {
      const result = await billingApi.simulatePaymentSuccess(invoiceId);
      setSubscription(result.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPaying(false);
    }
  }, []);

  const simulateFail = useCallback(async (invoiceId: number) => {
    setPaying(true);
    try {
      const result = await billingApi.simulatePaymentFail(invoiceId);
      setSubscription(result.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPaying(false);
    }
  }, []);

  const accessAllowed = subscription ? isAccessAllowed(subscription) : true;
  const showWarning = subscription ? shouldShowWarning(subscription) : false;
  const remainingDays = subscription ? getRemainingDays(subscription) : 0;

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      loading,
      error,
      accessAllowed,
      showWarning,
      remainingDays,
      paying,
      subscribe: subscribeToPlan,
      simulateSuccess,
      simulateFail,
      refresh: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  return useContext(SubscriptionContext);
}
