/**
 * Unit-тесты для state machine подписки.
 *
 * Проверяют корректность переходов между состояниями,
 * edge cases (двойная оплата, оплата до окончания, смена тарифа и т.д.)
 */
import { describe, it, expect } from 'vitest';
import type { Subscription, SubscriptionStatus } from '../billingTypes';
import {
  createTrialSubscription,
  checkAndTransition,
  transition,
  getRemainingDays,
  isAccessAllowed,
  shouldShowWarning,
} from '../subscriptionMachine';

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: 1,
    userId: 1,
    status: 'trial',
    plan: null,
    planTier: null,
    planInterval: null,
    currentPeriodStart: now,
    currentPeriodEnd: future,
    trialEndsAt: future,
    cancelledAt: null,
    blockedAt: null,
    blockedReason: null,
    previousStatus: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeExpiredSub(): Subscription {
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return makeSub({
    status: 'expired',
    currentPeriodEnd: past,
  });
}

function makeExpiringSub(): Subscription {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  return makeSub({
    status: 'expiring',
    currentPeriodEnd: soon,
  });
}

describe('createTrialSubscription', () => {
  it('creates a trial with status=trial', () => {
    const sub = createTrialSubscription(42, 1);
    expect(sub.status).toBe('trial');
    expect(sub.userId).toBe(42);
    expect(sub.plan).toBeNull();
    expect(sub.trialEndsAt).not.toBeNull();
  });

  it('sets period end ~14 days from now', () => {
    const sub = createTrialSubscription(1, 1);
    const days = getRemainingDays(sub);
    expect(days).toBeGreaterThanOrEqual(13);
    expect(days).toBeLessThanOrEqual(15);
  });
});

describe('checkAndTransition', () => {
  it('does not change trial with >7 days left', () => {
    const sub = makeSub();
    const result = checkAndTransition(sub);
    expect(result.status).toBe('trial');
  });

  it('changes trial → expiring when ≤7 days remain', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const sub = makeSub({ currentPeriodEnd: soon });
    const result = checkAndTransition(sub);
    expect(result.status).toBe('expiring');
  });

  it('changes trial → expired when period has passed', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const sub = makeSub({ currentPeriodEnd: past });
    const result = checkAndTransition(sub);
    expect(result.status).toBe('expired');
  });

  it('changes active → expiring when ≤7 days remain', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const sub = makeSub({ status: 'active', plan: 'monthly', planTier: 'business', planInterval: 'monthly', currentPeriodEnd: soon });
    const result = checkAndTransition(sub);
    expect(result.status).toBe('expiring');
  });

  it('changes expiring → expired when period passed', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const sub = makeSub({ status: 'expiring', currentPeriodEnd: past });
    const result = checkAndTransition(sub);
    expect(result.status).toBe('expired');
  });

  it('does not change blocked status', () => {
    const sub = makeSub({ status: 'blocked' });
    const result = checkAndTransition(sub);
    expect(result.status).toBe('blocked');
  });
});

describe('transition - PAYMENT_INITIATED', () => {
  const statuses: SubscriptionStatus[] = ['trial', 'active', 'expiring', 'expired', 'blocked'];

  statuses.forEach((status) => {
    it(`allows payment initiation from ${status}`, () => {
      const sub = makeSub({ status });
      const result = transition(sub, { type: 'PAYMENT_INITIATED', planTier: 'business', planInterval: 'monthly' });
      expect(result).not.toBeNull();
      expect(result!.status).toBe('pending_payment');
      expect(result!.previousStatus).toBe(status);
    });
  });

  it('rejects payment initiation from pending_payment', () => {
    const sub = makeSub({ status: 'pending_payment' });
    const result = transition(sub, { type: 'PAYMENT_INITIATED', planTier: 'business', planInterval: 'monthly' });
    expect(result).toBeNull();
  });
});

describe('transition - PAYMENT_SUCCESS', () => {
  it('activates subscription from pending_payment', () => {
    const sub = makeSub({ status: 'pending_payment', previousStatus: 'expired' });
    const result = transition(sub, { type: 'PAYMENT_SUCCESS', planTier: 'business', planInterval: 'monthly' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
    expect(result!.plan).toBe('monthly');
    expect(result!.planTier).toBe('business');
    expect(result!.planInterval).toBe('monthly');
    expect(result!.blockedAt).toBeNull();
    expect(result!.blockedReason).toBeNull();
  });

  it('activates from expired directly', () => {
    const sub = makeExpiredSub();
    const result = transition(sub, { type: 'PAYMENT_SUCCESS', planTier: 'premium', planInterval: 'yearly' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
    expect(result!.plan).toBe('yearly');
    expect(result!.planTier).toBe('premium');
  });

  it('extends from expiring (adds to remaining period)', () => {
    const sub = makeExpiringSub();
    const result = transition(sub, { type: 'PAYMENT_SUCCESS', planTier: 'start', planInterval: 'monthly' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
    const days = getRemainingDays(result!);
    expect(days).toBeGreaterThan(30);
  });

  it('allows plan change (monthly → yearly)', () => {
    const sub = makeSub({ status: 'expiring', plan: 'monthly', planTier: 'business', planInterval: 'monthly' });
    const result = transition(sub, { type: 'PAYMENT_SUCCESS', planTier: 'business', planInterval: 'yearly' });
    expect(result!.plan).toBe('yearly');
    expect(result!.planInterval).toBe('yearly');
  });

  it('rejects payment success from active (not in allowed states)', () => {
    const sub = makeSub({ status: 'active' });
    const result = transition(sub, { type: 'PAYMENT_SUCCESS', planTier: 'business', planInterval: 'monthly' });
    expect(result).toBeNull();
  });
});

describe('transition - PAYMENT_FAILED', () => {
  it('restores previous status on failure', () => {
    const sub = makeSub({ status: 'pending_payment', previousStatus: 'expiring' });
    const result = transition(sub, { type: 'PAYMENT_FAILED' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('expiring');
    expect(result!.previousStatus).toBeNull();
  });

  it('defaults to expired if no previous status', () => {
    const sub = makeSub({ status: 'pending_payment', previousStatus: null });
    const result = transition(sub, { type: 'PAYMENT_FAILED' });
    expect(result!.status).toBe('expired');
  });

  it('rejects failure from non-pending_payment', () => {
    const sub = makeSub({ status: 'active' });
    const result = transition(sub, { type: 'PAYMENT_FAILED' });
    expect(result).toBeNull();
  });
});

describe('transition - ADMIN_BLOCK / ADMIN_UNBLOCK', () => {
  it('blocks any subscription', () => {
    const sub = makeSub({ status: 'active' });
    const result = transition(sub, { type: 'ADMIN_BLOCK', reason: 'Нарушение условий' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('blocked');
    expect(result!.blockedReason).toBe('Нарушение условий');
    expect(result!.previousStatus).toBe('active');
  });

  it('unblocks and restores previous status', () => {
    const sub = makeSub({
      status: 'blocked',
      previousStatus: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const result = transition(sub, { type: 'ADMIN_UNBLOCK' });
    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
    expect(result!.blockedAt).toBeNull();
  });

  it('unblock runs checkAndTransition (may result in expiring)', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const sub = makeSub({
      status: 'blocked',
      previousStatus: 'active',
      currentPeriodEnd: soon,
    });
    const result = transition(sub, { type: 'ADMIN_UNBLOCK' });
    expect(result!.status).toBe('expiring');
  });

  it('rejects unblock from non-blocked', () => {
    const sub = makeSub({ status: 'active' });
    const result = transition(sub, { type: 'ADMIN_UNBLOCK' });
    expect(result).toBeNull();
  });
});

describe('isAccessAllowed', () => {
  const allowed: SubscriptionStatus[] = ['trial', 'active', 'expiring', 'pending_payment'];
  const denied: SubscriptionStatus[] = ['expired', 'blocked'];

  allowed.forEach((status) => {
    it(`allows access for ${status}`, () => {
      expect(isAccessAllowed(makeSub({ status }))).toBe(true);
    });
  });

  denied.forEach((status) => {
    it(`denies access for ${status}`, () => {
      expect(isAccessAllowed(makeSub({ status }))).toBe(false);
    });
  });
});

describe('shouldShowWarning', () => {
  it('shows warning for expiring', () => {
    expect(shouldShowWarning(makeSub({ status: 'expiring' }))).toBe(true);
  });

  it('does not show warning for other statuses', () => {
    expect(shouldShowWarning(makeSub({ status: 'active' }))).toBe(false);
    expect(shouldShowWarning(makeSub({ status: 'trial' }))).toBe(false);
  });
});
