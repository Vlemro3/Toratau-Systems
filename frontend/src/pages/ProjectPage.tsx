/**
 * Карточка объекта — активная секция определяется из URL (сайдбар управляет).
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProject } from '../api/projects';
import { getProjectReport } from '../api/reports';
import { getWorkLogs, deleteWorkLog } from '../api/workLogs';
import { getCashIns, deleteCashIn } from '../api/cashIn';
import { getExpenses, deleteExpense } from '../api/expenses';
import { getPayouts, deletePayout } from '../api/payouts';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { formatMoney, formatDate } from '../utils/format';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  getExpenseCategoryLabel,
  PAYMENT_METHOD_LABELS,
} from '../utils/constants';
import type { Project, ProjectReport, WorkLog, CashIn, Expense, Payout } from '../types';

type Section = 'summary' | 'works' | 'expenses-payouts' | 'payments' | 'expenses' | 'payouts';

function sectionFromPath(pathname: string): Section {
  const parts = pathname.split('/');
  const last = parts[3] || '';
  const map: Record<string, Section> = {
    '': 'summary', works: 'works',
    'expenses-payouts': 'expenses-payouts',
    payments: 'payments',
    expenses: 'expenses',
    payouts: 'payouts',
  };
  return map[last] || 'summary';
}

const SECTION_TITLES: Record<Section, string> = {
  summary: 'Сводка', works: 'Работы',
  'expenses-payouts': 'Расходы и выплаты',
  payments: 'Платежи',
  expenses: 'Расходы',
  payouts: 'Выплаты',
};

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);

const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number(id) : NaN;
  const location = useLocation();
  const { isAdmin, isForeman } = useAuth();
  const section = sectionFromPath(location.pathname);

  // Validate project ID
  if (!id || isNaN(projectId)) {
    return <EmptyState message="Неверный ID объекта" />;
  }

  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [cashIns, setCashIns] = useState<CashIn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; action: () => Promise<void>;
  } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [proj, rep, wl, ci, exp, pay] = await Promise.all([
        getProject(projectId),
        getProjectReport(projectId).catch(() => null),
        getWorkLogs(projectId),
        getCashIns(projectId),
        getExpenses(projectId),
        getPayouts(projectId),
      ]);
      setProject(proj); setReport(rep); setWorkLogs(wl);
      setCashIns(ci); setExpenses(exp); setPayouts(pay);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      if (msg.includes('Нет доступа')) {
        setAccessDenied(true);
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (accessDenied) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '64px 16px' }}>
        <h2 style={{ fontSize: '48px', margin: '0 0 16px' }}>403</h2>
        <p className="text-muted" style={{ fontSize: '18px' }}>У вас нет доступа к этому объекту</p>
        <Link to="/dashboard" className="btn btn--primary" style={{ marginTop: '16px' }}>
          На главную
        </Link>
      </div>
    );
  }

  const askDelete = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmAction({ title, message, action: async () => { await action(); await loadAll(); } });
  };

  const askDeleteMany = (title: string, ids: number[], deleteFn: (id: number) => Promise<void>) => {
    setConfirmAction({
      title,
      message: `Удалить выбранные записи (${ids.length})?`,
      action: async () => {
        const results = await Promise.allSettled(ids.map((i) => deleteFn(i)));
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          alert(`Не удалось удалить ${failures.length} из ${ids.length} записей`);
        }
        await loadAll();
      },
    });
  };

  const doConfirm = async () => {
    if (!confirmAction) return;
    try { await confirmAction.action(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Ошибка'); }
    setConfirmAction(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!project) return <EmptyState message="Объект не найден" />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">{SECTION_TITLES[section]}</h2>
          <p className="text-muted">
            {project.name} · {project.client}{' '}
            <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} color={PROJECT_STATUS_COLORS[project.status]} />
          </p>
        </div>
        {isAdmin && section === 'summary' && (
          <Link to={`/projects/${project.id}/edit`} className="btn btn--secondary btn--sm">Редактировать</Link>
        )}
      </div>

      {section === 'summary' && (
        report
          ? <SummaryDashboard project={project} report={report} workLogs={workLogs} cashIns={cashIns} expenses={expenses} payouts={payouts} isForeman={isForeman} />
          : <EmptyState message="Данные загружаются..." icon="📊" />
      )}
      {section === 'works' && <WorksSection projectId={projectId} workLogs={workLogs} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить работы?', ids, deleteWorkLog)} />}
      {section === 'expenses-payouts' && <ExpensesAndPayoutsSection projectId={projectId} expenses={expenses} payouts={payouts} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={askDeleteMany} />}
      {section === 'expenses' && <ExpensesAndPayoutsSection projectId={projectId} expenses={expenses} payouts={payouts} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={askDeleteMany} mode="expenses" />}
      {section === 'payouts' && <ExpensesAndPayoutsSection projectId={projectId} expenses={expenses} payouts={payouts} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={askDeleteMany} mode="payouts" />}
      {section === 'payments' && <PaymentsSection projectId={projectId} cashIns={cashIns} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить платежи?', ids, deleteCashIn)} />}

      <ConfirmDialog
        open={!!confirmAction} title={confirmAction?.title || ''} message={confirmAction?.message || ''}
        onConfirm={doConfirm} onCancel={() => setConfirmAction(null)} danger
      />
    </div>
  );
}

/* ==================================================================== СВОДКА ==================================================================== */

interface SummaryProps {
  project: Project; report: ProjectReport;
  workLogs: WorkLog[]; cashIns: CashIn[]; expenses: Expense[]; payouts: Payout[];
  isForeman?: boolean;
}

// Constants
const MS_PER_DAY = 86400000;

function SummaryDashboard({ project, report, workLogs, cashIns, expenses, payouts, isForeman }: SummaryProps) {
  const now = useMemo(() => new Date(), []);
  const daysLeft = useMemo(() => {
    return project.end_date ? Math.ceil((new Date(project.end_date).getTime() - now.getTime()) / MS_PER_DAY) : null;
  }, [project.end_date, now]);
  const daysPassed = useMemo(() => {
    return Math.ceil((now.getTime() - new Date(project.start_date).getTime()) / MS_PER_DAY);
  }, [project.start_date, now]);

  /* Аналитика для Прораба: выплаты по бригадам, расходы, объём по видам работ */
  const payoutsByCrew = useMemo(() => {
    const byCrew: Record<number, { name: string; total: number }> = {};
    payouts.forEach((p) => {
      const id = p.crew_id;
      if (!byCrew[id]) byCrew[id] = { name: p.crew?.name || `Бригада #${id}`, total: 0 };
      byCrew[id].total += p.amount;
    });
    return Object.entries(byCrew).map(([id, v]) => ({ crewId: Number(id), name: v.name, total: v.total }));
  }, [payouts]);
  const expensesTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const expensesByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    return Object.entries(byCat).map(([cat, amount]) => ({ category: cat, amount }));
  }, [expenses]);
  const volumeByWorkType = useMemo(() => {
    const byType: Record<number, { name: string; unit: string; volume: number }> = {};
    workLogs.forEach((wl) => {
      const id = wl.work_type_id;
      if (!byType[id]) byType[id] = { name: wl.work_type?.name || `Вид #${id}`, unit: wl.work_type?.unit || '', volume: 0 };
      byType[id].volume += wl.volume;
    });
    return Object.entries(byType).map(([id, v]) => ({ workTypeId: Number(id), name: v.name, unit: v.unit, volume: v.volume }));
  }, [workLogs]);

  const allDates = useMemo(() => {
    const dates: { date: string; label: string; who?: string }[] = [];
    workLogs.forEach((wl) => dates.push({ date: wl.date, label: 'Работа: ' + (wl.work_type?.name || ''), who: wl.creator?.full_name }));
    cashIns.forEach((ci) => dates.push({ date: ci.date, label: 'Платёж: ' + formatMoney(ci.amount), who: ci.creator?.full_name }));
    expenses.forEach((e) => dates.push({ date: e.date, label: 'Расход: ' + formatMoney(e.amount), who: e.creator?.full_name }));
    payouts.forEach((p) => dates.push({ date: p.date, label: 'Выплата: ' + formatMoney(p.amount), who: p.creator?.full_name }));
    return dates.sort((a, b) => b.date.localeCompare(a.date));
  }, [workLogs, cashIns, expenses, payouts]);

  const weekAgo = useMemo(() => new Date(now.getTime() - 7 * MS_PER_DAY).toISOString().slice(0, 10), [now]);
  const weekPayouts = payouts.filter((p) => p.date >= weekAgo);
  const weekPayoutsSum = weekPayouts.reduce((s, p) => s + p.amount, 0);
  const weekWorks = workLogs.filter((wl) => wl.date >= weekAgo);
  const weekWorksSum = weekWorks.reduce((s, wl) => s + wl.accrued_amount, 0);

  const budgetUsed = project.planned_cost > 0 ? (report.total_fact_expense / project.planned_cost) * 100 : 0;
  const paymentCoverage = project.contract_amount > 0 ? (report.total_cash_in / project.contract_amount) * 100 : 0;

  const expByCategory: Record<string, number> = {};
  expenses.forEach((e) => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const crewShare = report.total_fact_expense > 0 ? (report.total_paid / report.total_fact_expense) * 100 : 0;
  const otherShare = report.total_fact_expense > 0 ? (report.total_expenses / report.total_fact_expense) * 100 : 0;

  /* Кнопки быстрого добавления в Сводке (для Администратора — с платёжом) */
  const summaryQuickActions = (
    <div className="dash-quick-actions">
      <Link to={`/projects/${project.id}/work-logs/new`} className="btn btn--primary btn--sm">+ Добавить работу</Link>
      <Link to={`/projects/${project.id}/expenses/new`} className="btn btn--primary btn--sm">+ Добавить расход</Link>
      <Link to={`/projects/${project.id}/payouts/new`} className="btn btn--primary btn--sm">+ Добавить выплату</Link>
      {!isForeman && (
        <Link to={`/projects/${project.id}/cashin/new`} className="btn btn--primary btn--sm">+ Добавить платёж</Link>
      )}
    </div>
  );

  /* Сводка для Прораба: аналитика по выплатам, расходам, объёму работ, дням */
  if (isForeman) {
    return (
      <div className="dashboard">
        <div className="dash-kpis">
          <KpiCard icon="📅" value={daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : daysLeft === 0 ? 'Сегодня' : `${Math.abs(daysLeft)} просрочка`) : '—'} label={daysLeft !== null && daysLeft < 0 ? 'Дней просрочки' : 'Дней до сдачи'} alert={daysLeft !== null && daysLeft < 0} />
          <KpiCard icon="⏱️" value={String(daysPassed)} label="Дней в работе" />
        </div>
        {summaryQuickActions}
        <div className="dash-cols">
          <div className="dash-card">
            <h3 className="dash-card__title">Выплаты бригадам</h3>
            {payoutsByCrew.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px 0' }}>Нет выплат</p>
            ) : (
              <div style={{ fontSize: '0.875rem' }}>
                {payoutsByCrew.map(({ crewId, name, total }) => (
                  <div key={crewId} className="summary-row">
                    <span className="summary-row__label">{name}</span>
                    <span className="summary-row__value text-bold">{formatMoney(total)}</span>
                  </div>
                ))}
                <hr className="summary-grid__divider" style={{ margin: '8px 0' }} />
                <div className="summary-row summary-row--bold">
                  <span className="summary-row__label">Итого выплачено</span>
                  <span className="summary-row__value">{formatMoney(report.total_paid)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="dash-card">
            <h3 className="dash-card__title">Расходы</h3>
            {expensesByCategory.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px 0' }}>Нет расходов</p>
            ) : (
              <div style={{ fontSize: '0.875rem' }}>
                {expensesByCategory.sort((a, b) => b.amount - a.amount).map(({ category, amount }) => (
                  <div key={category} className="summary-row">
                    <span className="summary-row__label">{getExpenseCategoryLabel(category)}</span>
                    <span className="summary-row__value">{formatMoney(amount)}</span>
                  </div>
                ))}
                <hr className="summary-grid__divider" style={{ margin: '8px 0' }} />
                <div className="summary-row summary-row--bold">
                  <span className="summary-row__label">Итого расходов</span>
                  <span className="summary-row__value">{formatMoney(expensesTotal)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="dash-card">
            <h3 className="dash-card__title">Выполненный объём работ (по видам)</h3>
            {volumeByWorkType.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px 0' }}>Нет данных</p>
            ) : (
              <div style={{ fontSize: '0.875rem' }}>
                {volumeByWorkType.sort((a, b) => b.volume - a.volume).map(({ workTypeId, name, unit, volume }) => (
                  <div key={workTypeId} className="summary-row">
                    <span className="summary-row__label">{name}</span>
                    <span className="summary-row__value">
                      {volume.toLocaleString('ru-RU')} {unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="dash-cols">
          <div className="dash-card">
            <h3 className="dash-card__title">Последняя активность</h3>
            {allDates.length === 0 ? (
              <p className="text-muted" style={{ padding: '16px 0' }}>Нет записей</p>
            ) : (
              <>
                <div className="dash-timeline">
                  {allDates.slice(0, 8).map((item, i) => (
                    <div className="dash-timeline__item" key={i}>
                      <div className="dash-timeline__dot" />
                      <div className="dash-timeline__content">
                        <div className="dash-timeline__text">{item.label}</div>
                        <div className="dash-timeline__meta">
                          {formatDate(item.date)} · {item.who ?? '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 12, marginBottom: 0 }}>
                  <Link to={`/projects/${project.id}/activity`} className="link">
                    Все логи за 3 месяца →
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dash-kpis">
        <KpiCard icon="📅" value={daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : daysLeft === 0 ? 'Сегодня' : `${Math.abs(daysLeft)} просрочка`) : '—'} label={daysLeft !== null && daysLeft < 0 ? 'Дней просрочки' : 'Дней до сдачи'} alert={daysLeft !== null && daysLeft < 0} />
        <KpiCard icon="⏱️" value={String(daysPassed)} label="Дней в работе" />
        <KpiCard icon="💸" value={formatMoney(weekPayoutsSum)} label="Выплат за неделю" />
        <KpiCard icon="🔨" value={formatMoney(weekWorksSum)} label="Работ за неделю" />
      </div>
      {summaryQuickActions}
      <div className="dash-cols">
        <div className="dash-card"><h3 className="dash-card__title">Финансы</h3><FinanceRows project={project} report={report} /></div>
        <div className="dash-card">
          <h3 className="dash-card__title">Бюджет</h3>
          <ProgressBar label="Оплата контракта" pct={paymentCoverage} sub={`${formatMoney(report.total_cash_in)} из ${formatMoney(project.contract_amount)}`} color={paymentCoverage >= 100 ? 'green' : 'blue'} />
          <ProgressBar label="Освоение бюджета" pct={budgetUsed} sub={`${formatMoney(report.total_fact_expense)} из ${formatMoney(project.planned_cost)}`} color={budgetUsed > 100 ? 'red' : budgetUsed > 80 ? 'yellow' : 'blue'} />
          <h3 className="dash-card__title" style={{ marginTop: 20 }}>Структура расходов</h3>
          <div className="dash-bar-chart">
            <BarRow label="Бригады" value={formatMoney(report.total_paid)} pct={crewShare} color="#2563eb" />
            <BarRow label="Прочие" value={formatMoney(report.total_expenses)} pct={otherShare} color="#f59e0b" />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Аналитика по расходам</h3>
          {expTotal > 0 ? (
            <>
              <div className="dash-bar-chart">
                {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const colors: Record<string, string> = { materials: '#3b82f6', tools: '#8b5cf6', transport: '#f97316', other: '#6b7280' };
                  return <BarRow key={cat} label={getExpenseCategoryLabel(cat)} value={formatMoney(amount)} pct={(amount / expTotal) * 100} color={colors[cat] || '#6b7280'} />;
                })}
              </div>
              <hr className="summary-grid__divider" style={{ margin: '12px 0' }} />
              <div className="summary-row summary-row--bold">
                <span className="summary-row__label">Итого расходов</span>
                <span className="summary-row__value">{formatMoney(expTotal)}</span>
              </div>
            </>
          ) : (
            <p className="text-muted" style={{ padding: '12px 0' }}>Нет расходов</p>
          )}
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Выполненный объём работ (по видам)</h3>
          {volumeByWorkType.length === 0 ? (
            <p className="text-muted" style={{ padding: '12px 0' }}>Нет данных</p>
          ) : (
            <div style={{ fontSize: '0.875rem' }}>
              {volumeByWorkType.sort((a, b) => b.volume - a.volume).map(({ workTypeId, name, unit, volume }) => (
                <div key={workTypeId} className="summary-row">
                  <span className="summary-row__label">{name}</span>
                  <span className="summary-row__value">
                    {volume.toLocaleString('ru-RU')} {unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="dash-cols">
        {report.crews_summary.length > 0 && (
          <div className="dash-card">
            <h3 className="dash-card__title">Подрядчики</h3>
            <CrewsTable report={report} />
          </div>
        )}
        <div className="dash-card">
          <h3 className="dash-card__title">Последняя активность</h3>
          {allDates.length === 0 ? (
            <p className="text-muted" style={{ padding: '16px 0' }}>Нет записей</p>
          ) : (
            <>
              <div className="dash-timeline">
                {allDates.slice(0, 8).map((item, i) => (
                  <div className="dash-timeline__item" key={i}>
                    <div className="dash-timeline__dot" />
                    <div className="dash-timeline__content">
                      <div className="dash-timeline__text">{item.label}</div>
                      <div className="dash-timeline__meta">
                        {formatDate(item.date)} · {item.who ?? '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link to={`/projects/${project.id}/activity`} className="link">
                  Все логи за 3 месяца →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, value, label, alert }: { icon: string; value: string; label: string; alert?: boolean }) {
  return <div className={`dash-kpi ${alert ? 'dash-kpi--danger' : ''}`}><div className="dash-kpi__icon">{icon}</div><div className="dash-kpi__body"><div className="dash-kpi__value">{value}</div><div className="dash-kpi__label">{label}</div></div></div>;
}
function ProgressBar({ label, pct, sub, color }: { label: string; pct: number; sub: string; color: string }) {
  return <div className="dash-progress"><div className="dash-progress__header"><span>{label}</span><span className={`text-bold ${pct > 100 ? 'text-danger' : ''}`}>{pct.toFixed(0)}%</span></div><div className="dash-progress__track"><div className={`dash-progress__fill dash-progress__fill--${color}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><div className="dash-progress__sub">{sub}</div></div>;
}
function BarRow({ label, value, pct, color, valueCls }: { label: string; value: string; pct: number; color: string; valueCls?: string }) {
  return <div className="dash-bar-chart__row"><span className="dash-bar-chart__label">{label}</span><div className="dash-bar-chart__track"><div className="dash-bar-chart__fill" style={{ width: `${Math.max(pct, 2)}%`, background: color }} /></div><span className={`dash-bar-chart__val ${valueCls || ''}`}>{value}</span></div>;
}
function FinanceRows({ project, report }: { project: Project; report: ProjectReport }) {
  const rows = [
    { label: 'Сумма контракта', value: formatMoney(project.contract_amount) },
    { label: 'Плановая себестоимость', value: formatMoney(project.planned_cost) },
    { d: true },
    { label: 'Пришло денег', value: formatMoney(report.total_cash_in), cls: 'text-success' },
    { label: 'Расходы (прочие)', value: formatMoney(report.total_expenses), cls: 'text-danger' },
    { label: 'Начислено бригадам', value: formatMoney(report.total_accrued) },
    { label: 'Выплачено бригадам', value: formatMoney(report.total_paid) },
    { d: true },
    { label: 'Итого факт расход', value: formatMoney(report.total_fact_expense), cls: 'text-danger', bold: true },
    { label: 'Баланс (касса)', value: formatMoney(report.balance), cls: report.balance >= 0 ? 'text-success' : 'text-danger', bold: true },
    { d: true },
    { label: 'Дата старта', value: formatDate(project.start_date) },
    ...(project.end_date ? [{ label: 'Плановое завершение', value: formatDate(project.end_date) }] : []),
  ];
  return <div style={{ fontSize: '0.875rem' }}>{rows.map((row, i) => 'd' in row ? <hr key={i} className="summary-grid__divider" /> : <div key={i} className={`summary-row ${row.bold ? 'summary-row--bold' : ''}`}><span className="summary-row__label">{row.label}</span><span className={`summary-row__value ${row.cls || ''}`}>{row.value}</span></div>)}</div>;
}

/* ==================================================================== ТАБЛИЦЫ ==================================================================== */

type DeleteFn = (title: string, message: string, action: () => Promise<void>) => void;

function WorksSection({ projectId, workLogs, isAdmin, onDelete, onDeleteMany }: {
  projectId: number; workLogs: WorkLog[]; isAdmin: boolean; onDelete: DeleteFn; onDeleteMany: (ids: number[]) => void;
}) {
  return (
    <div>
      <div className="tab-header"><Link to={`/projects/${projectId}/work-logs/new`} className="btn btn--primary btn--sm">+ Добавить работу</Link></div>
      <DataTable
        items={workLogs}
        columns={[
          { key: 'date', label: 'Дата', sortValue: (wl) => wl.date },
          { key: 'type', label: 'Вид работ', sortValue: (wl) => wl.work_type?.name || '' },
          { key: 'crew', label: 'Бригада', sortValue: (wl) => wl.crew?.name || '' },
          { key: 'volume', label: 'Объём', className: 'text-right', sortValue: (wl) => wl.volume },
          { key: 'amount', label: 'Сумма', className: 'text-right', sortValue: (wl) => wl.accrued_amount },
          { key: 'comment', label: 'Комментарий' },
          { key: 'changed_by', label: 'Кем изменён', sortValue: (wl) => wl.updated_by_user?.full_name || wl.creator?.full_name || '' },
          isAdmin && { key: 'actions', label: 'Действия', className: 'text-center' },
        ]}
        defaultSortKey="date"
        searchFields={(wl) => `${wl.work_type?.name || ''} ${wl.crew?.name || ''} ${wl.comment || ''} ${wl.date} ${wl.creator?.full_name || ''} ${wl.updated_by_user?.full_name || ''}`}
        emptyMessage="Нет записей о работах" emptyIcon="🔨"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderRow={(wl, sel, toggle) => (
          <tr key={wl.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(wl.date)}</td>
            <td><strong>{wl.work_type?.name || `#${wl.work_type_id}`}</strong></td>
            <td>{wl.crew?.name || `#${wl.crew_id}`}</td>
            <td className="text-right">{wl.volume} {wl.work_type?.unit || ''}</td>
            <td className="text-right text-bold">{formatMoney(wl.accrued_amount)}</td>
            <td className="text-muted">{wl.comment || '—'}</td>
            <td className="text-muted" style={{ fontSize: '0.875rem' }}>{wl.updated_by_user?.full_name || wl.creator?.full_name || '—'}</td>
            {isAdmin && <td><div className="table-actions">
              <Link to={`/projects/${projectId}/work-logs/${wl.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => onDelete('Удалить работу?', `${wl.work_type?.name} — ${formatMoney(wl.accrued_amount)}`, () => deleteWorkLog(wl.id))} title="Удалить"><IconDelete /></button>
            </div></td>}
          </tr>
        )}
      />
    </div>
  );
}

function PaymentsSection({ projectId, cashIns, isAdmin, onDelete, onDeleteMany }: {
  projectId: number; cashIns: CashIn[]; isAdmin: boolean; onDelete: DeleteFn; onDeleteMany: (ids: number[]) => void;
}) {
  return (
    <div>
      <div className="tab-header"><Link to={`/projects/${projectId}/cashin/new`} className="btn btn--primary btn--sm">+ Добавить платёж</Link></div>
      <DataTable
        items={cashIns}
        columns={[
          { key: 'date', label: 'Дата', sortValue: (ci) => ci.date },
          { key: 'amount', label: 'Сумма', className: 'text-right', sortValue: (ci) => ci.amount },
          { key: 'comment', label: 'Комментарий' },
          { key: 'changed_by', label: 'Кем изменён', sortValue: (ci) => ci.updated_by_user?.full_name || ci.creator?.full_name || '' },
          isAdmin && { key: 'actions', label: 'Действия', className: 'text-center' },
        ]}
        defaultSortKey="date"
        searchFields={(ci) => `${ci.comment || ''} ${ci.date} ${ci.amount} ${ci.creator?.full_name || ''} ${ci.updated_by_user?.full_name || ''}`}
        emptyMessage="Нет входящих платежей" emptyIcon="💰"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderRow={(ci, sel, toggle) => (
          <tr key={ci.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ci.date)}</td>
            <td className="text-right text-bold">{formatMoney(ci.amount)}</td>
            <td className="text-muted">{ci.comment || '—'}</td>
            <td className="text-muted" style={{ fontSize: '0.875rem' }}>{ci.updated_by_user?.full_name || ci.creator?.full_name || '—'}</td>
            {isAdmin && <td><div className="table-actions">
              <Link to={`/projects/${projectId}/cashin/${ci.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => onDelete('Удалить платёж?', `${formatMoney(ci.amount)} от ${formatDate(ci.date)}`, () => deleteCashIn(ci.id))} title="Удалить"><IconDelete /></button>
            </div></td>}
          </tr>
        )}
      />
    </div>
  );
}

function ExpensesAndPayoutsSection({ projectId, expenses, payouts, isAdmin, onDelete, onDeleteMany, mode = 'all' }: {
  projectId: number; expenses: Expense[]; payouts: Payout[]; isAdmin: boolean; onDelete: DeleteFn; onDeleteMany: (title: string, ids: number[], deleteFn: (id: number) => Promise<void>) => void;
  /** 'all' — оба блока (для админа), 'expenses' / 'payouts' — один блок (для прораба) */
  mode?: 'all' | 'expenses' | 'payouts';
}) {
  const showExpenses = mode === 'all' || mode === 'expenses';
  const showPayouts = mode === 'all' || mode === 'payouts';

  return (
    <div>
      <div className="tab-header">
        {showExpenses && <Link to={`/projects/${projectId}/expenses/new`} className="btn btn--primary btn--sm">+ Добавить расход</Link>}
        {showPayouts && <Link to={`/projects/${projectId}/payouts/new`} className="btn btn--primary btn--sm" style={{ marginLeft: showExpenses ? '8px' : 0 }}>+ Добавить выплату</Link>}
      </div>

      {/* Расходы */}
      {showExpenses && (
      <div style={{ marginBottom: '32px' }}>
        {mode === 'all' && <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Расходы</h3>}
        <DataTable
          items={expenses}
          columns={[
            { key: 'date', label: 'Дата', sortValue: (e) => e.date },
            { key: 'category', label: 'Категория', sortValue: (e) => getExpenseCategoryLabel(e.category) },
            { key: 'amount', label: 'Сумма', className: 'text-right', sortValue: (e) => e.amount },
            { key: 'comment', label: 'Комментарий' },
            { key: 'changed_by', label: 'Кем изменён', sortValue: (e) => e.updated_by_user?.full_name || e.creator?.full_name || '' },
            isAdmin && { key: 'actions', label: 'Действия', className: 'text-center' },
          ]}
          defaultSortKey="date"
          searchFields={(e) => `${getExpenseCategoryLabel(e.category)} ${e.comment || ''} ${e.date} ${e.amount} ${e.creator?.full_name || ''} ${e.updated_by_user?.full_name || ''}`}
          emptyMessage="Нет расходов" emptyIcon="🧾"
          showCheckboxes={isAdmin}
          onDeleteMany={isAdmin ? (ids) => onDeleteMany('Удалить расходы?', ids, deleteExpense) : undefined}
          renderRow={(exp, sel, toggle) => (
            <tr key={exp.id} className={sel ? 'table-row--selected' : ''}>
              {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
              <td style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
              <td>{getExpenseCategoryLabel(exp.category)}</td>
              <td className="text-right text-bold">{formatMoney(exp.amount)}</td>
              <td className="text-muted">{exp.comment || '—'}</td>
              <td className="text-muted" style={{ fontSize: '0.875rem' }}>{exp.updated_by_user?.full_name || exp.creator?.full_name || '—'}</td>
              {isAdmin && <td><div className="table-actions">
                <Link to={`/projects/${projectId}/expenses/${exp.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
                <button className="table-action table-action--delete" onClick={() => onDelete('Удалить расход?', `${formatMoney(exp.amount)}`, () => deleteExpense(exp.id))} title="Удалить"><IconDelete /></button>
              </div></td>}
            </tr>
          )}
        />
      </div>
      )}

      {/* Выплаты */}
      {showPayouts && (
      <div>
        {mode === 'all' && <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>Выплаты</h3>}
        <DataTable
          items={payouts}
          columns={[
            { key: 'date', label: 'Дата', sortValue: (p) => p.date },
            { key: 'crew', label: 'Бригада', sortValue: (p) => p.crew?.name || '' },
            { key: 'amount', label: 'Сумма', className: 'text-right', sortValue: (p) => p.amount },
            { key: 'method', label: 'Способ', sortValue: (p) => p.payment_method },
            { key: 'comment', label: 'Комментарий' },
            { key: 'changed_by', label: 'Кем изменён', sortValue: (p) => p.updated_by_user?.full_name || p.creator?.full_name || '' },
            isAdmin && { key: 'actions', label: 'Действия', className: 'text-center' },
          ]}
          defaultSortKey="date"
          searchFields={(p) => `${p.crew?.name || ''} ${p.comment || ''} ${p.date} ${p.amount} ${p.creator?.full_name || ''} ${p.updated_by_user?.full_name || ''}`}
          emptyMessage="Нет выплат" emptyIcon="💸"
          showCheckboxes={isAdmin}
          onDeleteMany={isAdmin ? (ids) => onDeleteMany('Удалить выплаты?', ids, deletePayout) : undefined}
          renderRow={(p, sel, toggle) => (
            <tr key={p.id} className={sel ? 'table-row--selected' : ''}>
              {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
              <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.date)}</td>
              <td><strong>{p.crew?.name || `#${p.crew_id}`}</strong></td>
              <td className="text-right text-bold">{formatMoney(p.amount)}</td>
              <td>{PAYMENT_METHOD_LABELS[p.payment_method]}</td>
              <td className="text-muted">{p.comment || '—'}</td>
              <td className="text-muted" style={{ fontSize: '0.875rem' }}>{p.updated_by_user?.full_name || p.creator?.full_name || '—'}</td>
              {isAdmin && <td><div className="table-actions">
                <Link to={`/projects/${projectId}/payouts/${p.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
                <button className="table-action table-action--delete" onClick={() => onDelete('Удалить выплату?', `${p.crew?.name} — ${formatMoney(p.amount)}`, () => deletePayout(p.id))} title="Удалить"><IconDelete /></button>
              </div></td>}
            </tr>
          )}
        />
      </div>
      )}
    </div>
  );
}

/** Строка сводки по бригаде с id для DataTable */
type CrewSummaryRow = ProjectReport['crews_summary'][number] & { id: number };

function CrewsTable({ report }: { report: ProjectReport }) {
  const rows: CrewSummaryRow[] = (report.crews_summary || []).map((cs) => ({ ...cs, id: cs.crew.id }));
  if (rows.length === 0) return <EmptyState message="Нет данных по бригадам" icon="👷" />;
  return (
    <DataTable<CrewSummaryRow>
      items={rows}
      columns={[
        { key: 'name', label: 'Бригада', sortValue: (r) => r.crew.name },
        { key: 'accrued', label: 'Начислено', className: 'text-right', sortValue: (r) => r.accrued },
        { key: 'paid', label: 'Выплачено', className: 'text-right', sortValue: (r) => r.paid },
        { key: 'debt', label: 'Долг', className: 'text-right', sortValue: (r) => r.debt },
      ]}
      defaultSortKey="name"
      defaultSortDir="asc"
      searchFields={(r) => `${r.crew.name} ${formatMoney(r.accrued)} ${formatMoney(r.paid)} ${formatMoney(r.debt)}`}
      emptyMessage="Нет данных по бригадам"
      emptyIcon="👷"
      showCheckboxes={false}
      renderRow={(r) => (
        <tr key={r.id}>
          <td><strong>{r.crew.name}</strong></td>
          <td className="text-right">{formatMoney(r.accrued)}</td>
          <td className="text-right">{formatMoney(r.paid)}</td>
          <td className={`text-right ${r.debt > 0 ? 'text-danger' : 'text-success'}`}>{formatMoney(r.debt)}</td>
        </tr>
      )}
    />
  );
}
