/**
 * Дашборд — список объектов с ключевыми метриками.
 * По умолчанию только активные и новые; архивные — в сворачиваемом блоке.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../api/projects';
import { getProjectReport } from '../api/reports';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../billing/SubscriptionContext';
import { canAddProject } from '../billing/billingConfig';
import { StatusBadge } from '../components/StatusBadge';
import { RiskIndicator } from '../components/RiskIndicator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatMoney } from '../utils/format';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../utils/constants';
import type { Project, ProjectReport, ProjectStatus } from '../types';

const ARCHIVED_STATUSES: ProjectStatus[] = ['completed', 'archived'];

function isArchived(status: ProjectStatus) {
  return ARCHIVED_STATUSES.includes(status);
}

interface ProjectWithMetrics {
  project: Project;
  report: ProjectReport | null;
}

function matchSearch(project: Project, q: string) {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  return project.name.toLowerCase().includes(lower) || project.client.toLowerCase().includes(lower);
}

export function DashboardPage() {
  const { isAdmin, isForeman } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [showArchive, setShowArchive] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const projects = await getProjects();
      const withMetrics: ProjectWithMetrics[] = await Promise.all(
        projects.map(async (project) => {
          try {
            const report = await getProjectReport(project.id);
            return { project, report };
          } catch {
            return { project, report: null };
          }
        })
      );
      setItems(withMetrics);
    } catch (err) {
      // Error already handled by individual report failures
      if (import.meta.env.DEV) {
        console.error('Ошибка загрузки:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeItems = items.filter(({ project }) => !isArchived(project.status));
  const archivedItems = items.filter(({ project }) => isArchived(project.status));

  const filtered = activeItems.filter(({ project }) => {
    if (statusFilter && project.status !== statusFilter) return false;
    if (!matchSearch(project, search)) return false;
    return true;
  });

  const archivedFiltered = archivedItems.filter(({ project }) => matchSearch(project, search));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Объекты</h2>
        {isAdmin && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              if (!canAddProject(subscription, items.length)) {
                setShowUpgradeModal(true);
              } else {
                navigate('/projects/new');
              }
            }}
          >
            + Новый объект
          </button>
        )}
      </div>

      {showUpgradeModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ maxWidth: 400, margin: 16 }}>
            <div className="card__body">
              <h3 style={{ marginTop: 0 }}>Достигнут лимит объектов</h3>
              <p className="text-muted">
                По вашему тарифу нельзя добавить больше объектов. Смените тариф в разделе «Оплата и подписка».
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowUpgradeModal(false)}>
                  Закрыть
                </button>
                <button type="button" className="btn btn--primary" onClick={() => { setShowUpgradeModal(false); navigate('/billing'); }}>
                  Перейти к тарифам
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="filters">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filters__search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
          className="filters__select"
        >
          <option value="">Все статусы</option>
          {Object.entries(PROJECT_STATUS_LABELS)
            .filter(([key]) => !isArchived(key as ProjectStatus))
            .map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
        </select>
      </div>

      {/* Кнопка «Показать архив» */}
      {archivedItems.length > 0 && (
        <div className="objects-archive-toggle">
          <button
            type="button"
            className="btn btn--ghost objects-archive-toggle__btn"
            onClick={() => setShowArchive((v) => !v)}
          >
            <span className={`objects-archive-toggle__arrow ${showArchive ? 'objects-archive-toggle__arrow--open' : ''}`}>▸</span>
            {showArchive ? 'Скрыть архив' : 'Показать архив'}
            <span className="objects-archive-toggle__count">({archivedFiltered.length}{archivedFiltered.length !== archivedItems.length ? ` из ${archivedItems.length}` : ''})</span>
          </button>
        </div>
      )}

      {filtered.length === 0 && !showArchive ? (
        <EmptyState
          message={isForeman ? 'Вам пока не назначены объекты. Обратитесь к администратору.' : 'Активных объектов нет'}
          icon="🏗️"
        />
      ) : (
        <>
          {/* Мобильные карточки — активные */}
          {filtered.length > 0 && (
          <div className="cards cards--mobile-only">
            {filtered.map(({ project, report }) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card__header">
                  <h3 className="project-card__name">{project.name}</h3>
                  <StatusBadge
                    label={PROJECT_STATUS_LABELS[project.status]}
                    color={PROJECT_STATUS_COLORS[project.status]}
                  />
                </div>
                {report && (
                  <div className="project-card__metrics">
                    <div className="metric">
                      <span className="metric__label">Пришло</span>
                      <span className="metric__value metric__value--green">
                        {formatMoney(report.total_cash_in)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Факт расход</span>
                      <span className="metric__value metric__value--red">
                        {formatMoney(report.total_fact_expense)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Баланс</span>
                      <span className={`metric__value ${report.balance >= 0 ? 'metric__value--green' : 'metric__value--red'}`}>
                        {formatMoney(report.balance)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Риск</span>
                      <RiskIndicator balance={report.balance} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* Таблица для десктопа — активные */}
          {filtered.length > 0 && (
            <div className="table-wrap table-wrap--desktop-only">
              <table className="table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Статус</th>
                    <th className="text-right">Пришло</th>
                    <th className="text-right">Факт расход</th>
                    <th className="text-right">Баланс</th>
                    <th className="text-center">Риск</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ project, report }) => (
                    <tr
                      key={project.id}
                      className="table__row--clickable"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <td>
                        <strong>{project.name}</strong>
                        <br />
                        <small className="text-muted">{project.client}</small>
                      </td>
                      <td>
                        <StatusBadge
                          label={PROJECT_STATUS_LABELS[project.status]}
                          color={PROJECT_STATUS_COLORS[project.status]}
                        />
                      </td>
                      <td className="text-right">{report ? formatMoney(report.total_cash_in) : '—'}</td>
                      <td className="text-right">{report ? formatMoney(report.total_fact_expense) : '—'}</td>
                      <td className={`text-right ${report && report.balance < 0 ? 'text-danger' : ''}`}>
                        {report ? formatMoney(report.balance) : '—'}
                      </td>
                      <td className="text-center">
                        {report ? (
                          <RiskIndicator balance={report.balance} />
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Блок архива */}
          {showArchive && archivedItems.length > 0 && (
            <div className="objects-archive">
              <h3 className="objects-archive__title">Архив</h3>
              {archivedFiltered.length === 0 ? (
                <p className="text-muted">В архиве по вашему запросу ничего не найдено</p>
              ) : (
                <>
                  <div className="cards cards--mobile-only">
                    {archivedFiltered.map(({ project, report }) => (
                      <div
                        key={project.id}
                        className="project-card project-card--archived"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="project-card__header">
                          <h3 className="project-card__name">{project.name}</h3>
                          <StatusBadge
                            label={PROJECT_STATUS_LABELS[project.status]}
                            color={PROJECT_STATUS_COLORS[project.status]}
                          />
                        </div>
                        {report && (
                          <div className="project-card__metrics">
                            <div className="metric">
                              <span className="metric__label">Пришло</span>
                              <span className="metric__value metric__value--green">{formatMoney(report.total_cash_in)}</span>
                            </div>
                            <div className="metric">
                              <span className="metric__label">Баланс</span>
                              <span className={`metric__value ${report.balance >= 0 ? 'metric__value--green' : 'metric__value--red'}`}>
                                {formatMoney(report.balance)}
                              </span>
                            </div>
                            <div className="metric">
                              <span className="metric__label">Риск</span>
                              <RiskIndicator balance={report.balance} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="table-wrap table-wrap--desktop-only">
                    <table className="table table--archived">
                      <thead>
                        <tr>
                          <th>Название</th>
                          <th>Статус</th>
                          <th className="text-right">Пришло</th>
                          <th className="text-right">Факт расход</th>
                          <th className="text-right">Баланс</th>
                          <th className="text-center">Риск</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedFiltered.map(({ project, report }) => (
                          <tr
                            key={project.id}
                            className="table__row--clickable"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <td>
                              <strong>{project.name}</strong>
                              <br />
                              <small className="text-muted">{project.client}</small>
                            </td>
                            <td>
                              <StatusBadge
                                label={PROJECT_STATUS_LABELS[project.status]}
                                color={PROJECT_STATUS_COLORS[project.status]}
                              />
                            </td>
                            <td className="text-right">{report ? formatMoney(report.total_cash_in) : '—'}</td>
                            <td className="text-right">{report ? formatMoney(report.total_fact_expense) : '—'}</td>
                            <td className={`text-right ${report && report.balance < 0 ? 'text-danger' : ''}`}>
                              {report ? formatMoney(report.balance) : '—'}
                            </td>
                            <td className="text-center">
                              {report ? <RiskIndicator balance={report.balance} /> : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
