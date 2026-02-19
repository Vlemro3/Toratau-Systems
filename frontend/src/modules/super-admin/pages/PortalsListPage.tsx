/**
 * Страница списка порталов с фильтрацией и поиском.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPortals, blockPortal, unblockPortal, deletePortal } from '../../../api/superAdmin';
import { SummaryStats } from '../components/SummaryStats';
import { FiltersPanel } from '../components/FiltersPanel';
import { PortalsTable } from '../components/PortalsTable';
import { PortalForm } from '../components/PortalForm';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { Portal, PortalCreate, PortalPlan, PortalStatus } from '../../../types';
import * as superAdminApi from '../../../api/superAdmin';

export function PortalsListPage() {
  const navigate = useNavigate();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Фильтры
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PortalStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<PortalPlan | 'all'>('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    loadPortals();
  }, []);

  const loadPortals = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await getAllPortals();
      // Обновляем список порталов
      setPortals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки порталов');
      console.error('Ошибка загрузки порталов:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPortals = useMemo(() => {
    return portals.filter((portal) => {
      // Поиск
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          portal.id.toLowerCase().includes(q) ||
          portal.name.toLowerCase().includes(q) ||
          portal.ownerEmail.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Статус - удалённые порталы скрываются, если фильтр не "all" или не "deleted"
      if (statusFilter !== 'all' && portal.status !== statusFilter) return false;

      // Тариф
      if (planFilter !== 'all' && portal.subscription.plan !== planFilter) return false;

      // Оплата
      if (paidFilter === 'paid') {
        if (!portal.subscription.isPaid) return false;
        if (portal.subscription.paidUntil && new Date(portal.subscription.paidUntil) < new Date()) return false;
      } else if (paidFilter === 'unpaid') {
        if (portal.subscription.isPaid && portal.subscription.paidUntil && new Date(portal.subscription.paidUntil) >= new Date()) {
          return false;
        }
      }

      return true;
    });
  }, [portals, search, statusFilter, planFilter, paidFilter]);

  const handleCreate = async (data: PortalCreate | Partial<Portal>) => {
    if ('ownerEmail' in data && data.ownerEmail) {
      await superAdminApi.createPortal(data as PortalCreate);
      await loadPortals();
      setShowForm(false);
    }
  };

  const handleBlock = async (id: string) => {
    try {
      await blockPortal(id);
      await loadPortals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка блокировки');
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await unblockPortal(id);
      await loadPortals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка разблокировки');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError('');
      // Закрываем модальное окно сразу для лучшего UX
      setDeleteId(null);
      
      // Выполняем удаление
      await deletePortal(id);
      
      // Обновляем список порталов
      await loadPortals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления';
      setError(errorMessage);
      console.error('Ошибка удаления портала:', err);
      // Модальное окно уже закрыто, но если была ошибка, можно показать её
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Управление порталами</h2>
        <button className="btn btn--primary" onClick={() => setShowForm(true)}>
          + Создать портал
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <SummaryStats portals={portals} />

      <FiltersPanel
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        paidFilter={paidFilter}
        onPaidFilterChange={setPaidFilter}
      />

      <PortalsTable
        portals={filteredPortals}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onDelete={(id) => setDeleteId(id)}
      />

      {showForm && (
        <div className="modal">
          <div className="modal__content">
            <div className="modal__header">
              <h3>Создать портал</h3>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <div className="modal__body">
              <PortalForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          open={!!deleteId}
          title="Удалить портал?"
          message="Портал будет полностью удалён из системы. Это действие нельзя отменить."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
          danger
        />
      )}
    </div>
  );
}
