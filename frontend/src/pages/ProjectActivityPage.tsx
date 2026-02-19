/**
 * Полная страница активности по объекту — все логи за последние 3 месяца.
 */
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject } from '../api/projects';
import { getWorkLogs } from '../api/workLogs';
import { getCashIns } from '../api/cashIn';
import { getExpenses } from '../api/expenses';
import { getPayouts } from '../api/payouts';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatMoney, formatDate } from '../utils/format';
import type { Project, WorkLog, CashIn, Expense, Payout } from '../types';

const MS_PER_DAY = 86400000;
const THREE_MONTHS_DAYS = 92;

export function ProjectActivityPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number(id) : NaN;
  const [project, setProject] = useState<Project | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [cashIns, setCashIns] = useState<CashIn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || isNaN(projectId)) {
      setLoading(false);
      return;
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - THREE_MONTHS_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    Promise.all([
      getProject(projectId),
      getWorkLogs(projectId),
      getCashIns(projectId),
      getExpenses(projectId),
      getPayouts(projectId),
    ])
      .then(([proj, wl, ci, exp, pay]) => {
        setProject(proj);
        setWorkLogs(wl.filter((x) => x.date >= cutoffStr));
        setCashIns(ci.filter((x) => x.date >= cutoffStr));
        setExpenses(exp.filter((x) => x.date >= cutoffStr));
        setPayouts(pay.filter((x) => x.date >= cutoffStr));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id, projectId]);

  const allDates = useMemo(() => {
    const items: { date: string; label: string; who?: string }[] = [];
    workLogs.forEach((wl) =>
      items.push({
        date: wl.date,
        label: 'Работа: ' + (wl.work_type?.name || ''),
        who: wl.creator?.full_name,
      })
    );
    cashIns.forEach((ci) =>
      items.push({
        date: ci.date,
        label: 'Платёж: ' + formatMoney(ci.amount),
        who: ci.creator?.full_name,
      })
    );
    expenses.forEach((e) =>
      items.push({
        date: e.date,
        label: 'Расход: ' + formatMoney(e.amount),
        who: e.creator?.full_name,
      })
    );
    payouts.forEach((p) =>
      items.push({
        date: p.date,
        label: 'Выплата: ' + formatMoney(p.amount),
        who: p.creator?.full_name,
      })
    );
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [workLogs, cashIns, expenses, payouts]);

  if (!id || isNaN(projectId)) {
    return <EmptyState message="Неверный ID объекта" />;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState message={error} />;
  if (!project) return <EmptyState message="Объект не найден" />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <Link to={`/projects/${projectId}`} className="link" style={{ marginRight: 12 }}>
            ← Сводка
          </Link>
          <h2 className="page__title">Активность за последние 3 месяца</h2>
        </div>
      </div>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Объект: <strong>{project.name}</strong>
      </p>
      {allDates.length === 0 ? (
        <p className="text-muted">Нет записей за выбранный период.</p>
      ) : (
        <div className="card">
          <div className="card__body">
            <div className="dash-timeline">
              {allDates.map((item, i) => (
                <div className="dash-timeline__item" key={i}>
                  <div className="dash-timeline__dot" />
                  <div className="dash-timeline__content">
                    <div className="dash-timeline__text">{item.label}</div>
                    <div className="dash-timeline__meta">
                      {formatDate(item.date)}
                      {item.who != null && item.who !== '' ? ` · ${item.who}` : ' · —'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
