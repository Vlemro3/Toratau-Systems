/**
 * Карточка объекта — активная секция определяется из URL (сайдбар управляет).
 */
import { useEffect, useState, useCallback } from 'react';
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
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils/constants';
import type { Project, ProjectReport, WorkLog, CashIn, Expense, Payout, ExpenseCategory } from '../types';

type Section = 'summary' | 'works' | 'payouts' | 'payments' | 'expenses' | 'crews';

function sectionFromPath(pathname: string): Section {
  const parts = pathname.split('/');
  const last = parts[3] || '';
  const map: Record<string, Section> = {
    '': 'summary', works: 'works', payouts: 'payouts',
    payments: 'payments', expenses: 'expenses', crews: 'crews',
  };
  return map[last] || 'summary';
}

const SECTION_TITLES: Record<Section, string> = {
  summary: 'Сводка', works: 'Работы', payouts: 'Выплаты',
  payments: 'Платежи', expenses: 'Расходы', crews: 'Бригады',
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
  const projectId = Number(id);
  const location = useLocation();
  const { isAdmin } = useAuth();
  const section = sectionFromPath(location.pathname);

  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [cashIns, setCashIns] = useState<CashIn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const askDelete = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmAction({ title, message, action: async () => { await action(); await loadAll(); } });
  };

  const askDeleteMany = (title: string, ids: number[], deleteFn: (id: number) => Promise<void>) => {
    setConfirmAction({
      title,
      message: `Удалить выбранные записи (${ids.length})?`,
      action: async () => { for (const i of ids) await deleteFn(i); await loadAll(); },
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
          ? <SummaryDashboard project={project} report={report} workLogs={workLogs} cashIns={cashIns} expenses={expenses} payouts={payouts} />
          : <EmptyState message="Данные загружаются..." icon="📊" />
      )}
      {section === 'works' && <WorksSection projectId={projectId} workLogs={workLogs} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить работы?', ids, deleteWorkLog)} />}
      {section === 'payouts' && <PayoutsSection projectId={projectId} payouts={payouts} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить выплаты?', ids, deletePayout)} />}
      {section === 'payments' && <PaymentsSection projectId={projectId} cashIns={cashIns} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить платежи?', ids, deleteCashIn)} />}
      {section === 'expenses' && <ExpensesSection projectId={projectId} expenses={expenses} isAdmin={isAdmin} onDelete={askDelete} onDeleteMany={(ids) => askDeleteMany('Удалить расходы?', ids, deleteExpense)} />}
      {section === 'crews' && (report ? <CrewsTable report={report} /> : <EmptyState message="Данные загружаются..." icon="👷" />)}

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
}

function SummaryDashboard({ project, report, workLogs, cashIns, expenses, payouts }: SummaryProps) {
  const now = new Date();
  const daysLeft = project.end_date ? Math.ceil((new Date(project.end_date).getTime() - now.getTime()) / 86400000) : null;
  const daysPassed = Math.ceil((now.getTime() - new Date(project.start_date).getTime()) / 86400000);

  const allDates: { date: string; label: string; who?: string }[] = [];
  workLogs.forEach((wl) => allDates.push({ date: wl.date, label: 'Работа: ' + (wl.work_type?.name || ''), who: wl.creator?.full_name }));
  cashIns.forEach((ci) => allDates.push({ date: ci.date, label: 'Платёж: ' + formatMoney(ci.amount), who: ci.creator?.full_name }));
  expenses.forEach((e) => allDates.push({ date: e.date, label: 'Расход: ' + formatMoney(e.amount), who: e.creator?.full_name }));
  payouts.forEach((p) => allDates.push({ date: p.date, label: 'Выплата: ' + formatMoney(p.amount), who: p.creator?.full_name }));
  allDates.sort((a, b) => b.date.localeCompare(a.date));

  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
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
  const otherShare = 100 - crewShare;

  return (
    <div className="dashboard">
      <div className="dash-kpis">
        <KpiCard icon="📅" value={daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : daysLeft === 0 ? 'Сегодня' : `${Math.abs(daysLeft)} просрочка`) : '—'} label={daysLeft !== null && daysLeft < 0 ? 'Дней просрочки' : 'Дней до сдачи'} alert={daysLeft !== null && daysLeft < 0} />
        <KpiCard icon="⏱️" value={String(daysPassed)} label="Дней в работе" />
        <KpiCard icon="💸" value={`${weekPayouts.length} / ${formatMoney(weekPayoutsSum)}`} label="Выплат за неделю" />
        <KpiCard icon="🔨" value={`${weekWorks.length} / ${formatMoney(weekWorksSum)}`} label="Работ за неделю" />
      </div>
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
          {expTotal > 0 && (<>
            <h3 className="dash-card__title" style={{ marginTop: 20 }}>По категориям</h3>
            <div className="dash-bar-chart">
              {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const colors: Record<string, string> = { materials: '#3b82f6', tools: '#8b5cf6', transport: '#f97316', other: '#6b7280' };
                return <BarRow key={cat} label={EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] || cat} value={formatMoney(amount)} pct={(amount / expTotal) * 100} color={colors[cat] || '#6b7280'} />;
              })}
            </div>
          </>)}
        </div>
      </div>
      <div className="dash-cols">
        {report.crews_summary.length > 0 && (
          <div className="dash-card"><h3 className="dash-card__title">Задолженность бригадам</h3>
            <div className="dash-bar-chart">
              {report.crews_summary.map((cs) => {
                const maxDebt = Math.max(...report.crews_summary.map((c) => Math.abs(c.debt)), 1);
                return <BarRow key={cs.crew.id} label={cs.crew.name} value={formatMoney(cs.debt)} pct={(Math.abs(cs.debt) / maxDebt) * 100} color={cs.debt > 0 ? '#ef4444' : '#22c55e'} valueCls={cs.debt > 0 ? 'text-danger' : 'text-success'} />;
              })}
            </div>
          </div>
        )}
        <div className="dash-card"><h3 className="dash-card__title">Последняя активность</h3>
          {allDates.length === 0 ? <p className="text-muted" style={{ padding: '16px 0' }}>Нет записей</p> : (
            <div className="dash-timeline">
              {allDates.slice(0, 8).map((item, i) => (
                <div className="dash-timeline__item" key={i}><div className="dash-timeline__dot" /><div className="dash-timeline__content">
                  <div className="dash-timeline__text">{item.label}</div>
                  <div className="dash-timeline__meta">{formatDate(item.date)}{item.who && ` · ${item.who}`}</div>
                </div></div>
              ))}
            </div>
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
    { label: 'Прогноз прибыли', value: formatMoney(report.forecast_profit), cls: report.forecast_profit >= 0 ? 'text-success' : 'text-danger', bold: true },
    { label: 'Отклонение от плана', value: formatMoney(report.plan_deviation), cls: report.plan_deviation > 0 ? 'text-danger' : 'text-success' },
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
        searchFields={(wl) => `${wl.work_type?.name || ''} ${wl.crew?.name || ''} ${wl.comment || ''} ${wl.date}`}
        emptyMessage="Нет записей о работах" emptyIcon="🔨"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderHead={() => <>
          <th>Дата</th><th>Вид работ</th><th>Бригада</th>
          <th className="text-right">Объём</th><th className="text-right">Сумма</th>
          <th>Комментарий</th>{isAdmin && <th className="text-center">Действия</th>}
        </>}
        renderRow={(wl, sel, toggle) => (
          <tr key={wl.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(wl.date)}</td>
            <td><strong>{wl.work_type?.name || `#${wl.work_type_id}`}</strong></td>
            <td>{wl.crew?.name || `#${wl.crew_id}`}</td>
            <td className="text-right">{wl.volume} {wl.work_type?.unit || ''}</td>
            <td className="text-right text-bold">{formatMoney(wl.accrued_amount)}</td>
            <td className="text-muted">{wl.comment || '—'}</td>
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

function PayoutsSection({ projectId, payouts, isAdmin, onDelete, onDeleteMany }: {
  projectId: number; payouts: Payout[]; isAdmin: boolean; onDelete: DeleteFn; onDeleteMany: (ids: number[]) => void;
}) {
  return (
    <div>
      <div className="tab-header"><Link to={`/projects/${projectId}/payouts/new`} className="btn btn--primary btn--sm">+ Создать выплату</Link></div>
      <DataTable
        items={payouts}
        searchFields={(p) => `${p.crew?.name || ''} ${p.comment || ''} ${p.date} ${p.amount}`}
        emptyMessage="Нет выплат" emptyIcon="💸"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderHead={() => <>
          <th>Дата</th><th>Бригада</th><th className="text-right">Сумма</th><th>Способ</th><th>Комментарий</th>{isAdmin && <th className="text-center">Действия</th>}
        </>}
        renderRow={(p, sel, toggle) => (
          <tr key={p.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.date)}</td>
            <td><strong>{p.crew?.name || `#${p.crew_id}`}</strong></td>
            <td className="text-right text-bold">{formatMoney(p.amount)}</td>
            <td>{PAYMENT_METHOD_LABELS[p.payment_method]}</td>
            <td className="text-muted">{p.comment || '—'}</td>
            {isAdmin && <td><div className="table-actions">
              <Link to={`/projects/${projectId}/payouts/${p.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => onDelete('Удалить выплату?', `${p.crew?.name} — ${formatMoney(p.amount)}`, () => deletePayout(p.id))} title="Удалить"><IconDelete /></button>
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
        searchFields={(ci) => `${ci.comment || ''} ${ci.date} ${ci.amount}`}
        emptyMessage="Нет входящих платежей" emptyIcon="💰"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderHead={() => <>
          <th>Дата</th><th className="text-right">Сумма</th><th>Комментарий</th>{isAdmin && <th className="text-center">Действия</th>}
        </>}
        renderRow={(ci, sel, toggle) => (
          <tr key={ci.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ci.date)}</td>
            <td className="text-right text-bold">{formatMoney(ci.amount)}</td>
            <td className="text-muted">{ci.comment || '—'}</td>
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

function ExpensesSection({ projectId, expenses, isAdmin, onDelete, onDeleteMany }: {
  projectId: number; expenses: Expense[]; isAdmin: boolean; onDelete: DeleteFn; onDeleteMany: (ids: number[]) => void;
}) {
  return (
    <div>
      <div className="tab-header"><Link to={`/projects/${projectId}/expenses/new`} className="btn btn--primary btn--sm">+ Добавить расход</Link></div>
      <DataTable
        items={expenses}
        searchFields={(e) => `${EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] || e.category} ${e.comment || ''} ${e.date} ${e.amount}`}
        emptyMessage="Нет расходов" emptyIcon="🧾"
        showCheckboxes={isAdmin}
        onDeleteMany={isAdmin ? onDeleteMany : undefined}
        renderHead={() => <>
          <th>Дата</th><th>Категория</th><th className="text-right">Сумма</th><th>Комментарий</th>{isAdmin && <th className="text-center">Действия</th>}
        </>}
        renderRow={(exp, sel, toggle) => (
          <tr key={exp.id} className={sel ? 'table-row--selected' : ''}>
            {isAdmin && <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>}
            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
            <td>{EXPENSE_CATEGORY_LABELS[exp.category as ExpenseCategory] || exp.category}</td>
            <td className="text-right text-bold">{formatMoney(exp.amount)}</td>
            <td className="text-muted">{exp.comment || '—'}</td>
            {isAdmin && <td><div className="table-actions">
              <Link to={`/projects/${projectId}/expenses/${exp.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => onDelete('Удалить расход?', `${formatMoney(exp.amount)}`, () => deleteExpense(exp.id))} title="Удалить"><IconDelete /></button>
            </div></td>}
          </tr>
        )}
      />
    </div>
  );
}

function CrewsTable({ report }: { report: ProjectReport }) {
  if (!report.crews_summary || report.crews_summary.length === 0) return <EmptyState message="Нет данных по бригадам" icon="👷" />;
  return (
    <div className="table-wrap"><table className="table">
      <thead><tr><th>Бригада</th><th className="text-right">Начислено</th><th className="text-right">Выплачено</th><th className="text-right">Долг</th></tr></thead>
      <tbody>{report.crews_summary.map((cs) => (
        <tr key={cs.crew.id}>
          <td><strong>{cs.crew.name}</strong></td>
          <td className="text-right">{formatMoney(cs.accrued)}</td>
          <td className="text-right">{formatMoney(cs.paid)}</td>
          <td className={`text-right ${cs.debt > 0 ? 'text-danger' : 'text-success'}`}>{formatMoney(cs.debt)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}
