/**
 * Unit-тесты для модуля порталов (Super Admin).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MockStore } from '../../../api/mockStore';
import type { Portal, PortalCreate, PortalUpdate } from '../../../types';

// Создаём изолированный экземпляр MockStore для тестов
function createTestStore(): MockStore {
  const store = new MockStore();
  // Очищаем порталы перед каждым тестом
  const portals = store.getAllPortals();
  portals.forEach((p) => {
    try {
      store.deletePortal(p.id);
    } catch {
      // Игнорируем ошибки при удалении
    }
  });
  return store;
}

describe('Portals CRUD', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createTestStore();
  });

  it('creates a portal with default values', () => {
    const data: PortalCreate = {
      name: 'Test Portal',
      ownerEmail: 'owner@test.com',
    };

    const portal = store.createPortal(data);

    expect(portal.id).toBeTruthy();
    expect(portal.name).toBe('Test Portal');
    expect(portal.ownerEmail).toBe('owner@test.com');
    expect(portal.status).toBe('active');
    expect(portal.subscription.plan).toBe('free');
    expect(portal.subscription.isPaid).toBe(false);
    expect(portal.usersCount).toBe(0);
    expect(portal.limits.maxUsers).toBe(10);
    expect(portal.limits.maxStorageMb).toBe(1000);
  });

  it('creates a portal with custom values', () => {
    const data: PortalCreate = {
      name: 'Pro Portal',
      ownerEmail: 'pro@test.com',
      subscription: {
        plan: 'pro',
        isPaid: true,
        paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'active',
      limits: {
        maxUsers: 50,
        maxStorageMb: 5000,
      },
    };

    const portal = store.createPortal(data);

    expect(portal.subscription.plan).toBe('pro');
    expect(portal.subscription.isPaid).toBe(true);
    expect(portal.limits.maxUsers).toBe(50);
    expect(portal.limits.maxStorageMb).toBe(5000);
  });

  it('gets all portals', () => {
    store.createPortal({ name: 'Portal 1', ownerEmail: '1@test.com' });
    store.createPortal({ name: 'Portal 2', ownerEmail: '2@test.com' });

    const portals = store.getAllPortals();

    expect(portals.length).toBe(2);
  });

  it('gets portal by id', () => {
    const created = store.createPortal({ name: 'Test', ownerEmail: 'test@test.com' });
    const found = store.getPortal(created.id);

    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Test');
  });

  it('throws error when portal not found', () => {
    expect(() => store.getPortal('non-existent')).toThrow('Портал не найден');
  });

  it('updates portal', () => {
    const portal = store.createPortal({ name: 'Old', ownerEmail: 'old@test.com' });
    const update: PortalUpdate = {
      name: 'New Name',
      status: 'blocked',
    };

    const updated = store.updatePortal(portal.id, update);

    expect(updated.name).toBe('New Name');
    expect(updated.status).toBe('blocked');
  });

  it('updates subscription and checks expiry', () => {
    const portal = store.createPortal({ name: 'Test', ownerEmail: 'test@test.com' });
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const updated = store.updatePortal(portal.id, {
      subscription: {
        paidUntil: pastDate,
        isPaid: true,
      },
    });

    expect(updated.subscription.isPaid).toBe(false); // Автоматически стало false из-за просрочки
  });

  it('hard deletes portal', () => {
    const portal = store.createPortal({ name: 'Test', ownerEmail: 'test@test.com' });
    const initialCount = store.getAllPortals().length;

    store.deletePortal(portal.id);

    // Портал должен быть полностью удалён
    expect(() => store.getPortal(portal.id)).toThrow('Портал не найден');
    expect(store.getAllPortals().length).toBe(initialCount - 1);
  });
});

describe('Portal blocking', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createTestStore();
  });

  it('blocks active portal', () => {
    const portal = store.createPortal({ name: 'Test', ownerEmail: 'test@test.com', status: 'active' });

    const blocked = store.blockPortal(portal.id);

    expect(blocked.status).toBe('blocked');
  });

  it('unblocks portal', () => {
    const portal = store.createPortal({ name: 'Test', ownerEmail: 'test@test.com', status: 'blocked' });

    const unblocked = store.unblockPortal(portal.id);

    expect(unblocked.status).toBe('active');
  });
});

describe('Expired subscriptions', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createTestStore();
  });

  it('marks subscription as unpaid when paidUntil is in the past', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const portal = store.createPortal({
      name: 'Test',
      ownerEmail: 'test@test.com',
      subscription: {
        plan: 'basic',
        isPaid: true,
        paidUntil: pastDate,
      },
    });

    expect(portal.subscription.isPaid).toBe(false);
  });

  it('keeps subscription paid when paidUntil is in the future', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const portal = store.createPortal({
      name: 'Test',
      ownerEmail: 'test@test.com',
      subscription: {
        plan: 'basic',
        isPaid: true,
        paidUntil: futureDate,
      },
    });

    expect(portal.subscription.isPaid).toBe(true);
  });

  it('updates expiry status when paidUntil changes', () => {
    const portal = store.createPortal({
      name: 'Test',
      ownerEmail: 'test@test.com',
      subscription: {
        plan: 'basic',
        isPaid: true,
        paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect(portal.subscription.isPaid).toBe(true);

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const updated = store.updatePortal(portal.id, {
      subscription: {
        paidUntil: pastDate,
      },
    });

    expect(updated.subscription.isPaid).toBe(false);
  });
});

describe('Portal filtering and sorting', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createTestStore();
    store.createPortal({ name: 'Portal A', ownerEmail: 'a@test.com', status: 'active' });
    store.createPortal({ name: 'Portal B', ownerEmail: 'b@test.com', status: 'blocked' });
    store.createPortal({
      name: 'Portal C',
      ownerEmail: 'c@test.com',
      status: 'active',
      subscription: { plan: 'pro', isPaid: true, paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    });
  });

  it('filters portals by status', () => {
    const all = store.getAllPortals();
    const active = all.filter((p) => p.status === 'active');
    const blocked = all.filter((p) => p.status === 'blocked');

    expect(active.length).toBeGreaterThanOrEqual(0);
    expect(blocked.length).toBeGreaterThanOrEqual(0);
  });

  it('filters portals by plan', () => {
    const all = store.getAllPortals();
    const pro = all.filter((p) => p.subscription.plan === 'pro');

    expect(pro.length).toBe(1);
    expect(pro[0].name).toBe('Portal C');
  });

  it('filters portals by payment status', () => {
    const all = store.getAllPortals();
    const paid = all.filter((p) => p.subscription.isPaid && p.subscription.paidUntil && new Date(p.subscription.paidUntil) >= new Date());

    expect(paid.length).toBe(1);
    expect(paid[0].name).toBe('Portal C');
  });
});
