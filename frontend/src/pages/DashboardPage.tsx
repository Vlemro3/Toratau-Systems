/**
 * Дашборд — список объектов с ключевыми метриками
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects } from '../api/projects';
import { getProjectReport } from '../api/reports';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { RiskIndicator } from '../components/RiskIndicator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { formatMoney } from '../utils/format';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../utils/constants';
import type { Project, ProjectReport, ProjectStatus } from '../types';

interface ProjectWithMetrics {
  project: Project;
  report: ProjectReport | null;
}

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(({ project }) => {
    if (statusFilter && project.status !== statusFilter) return false;
    if (search && !project.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Объекты</h2>
        {isAdmin && (
          <Link to="/projects/new" className="btn btn--primary">
            + Новый объект
          </Link>
        )}
      </div>

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
          {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Объекты не найдены" icon="🏗️" />
      ) : (
        <>
          {/* Мобильные карточки */}
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
                      <span className="metric__label">Прогноз прибыли</span>
                      <span className={`metric__value ${report.forecast_profit >= 0 ? 'metric__value--green' : 'metric__value--red'}`}>
                        {formatMoney(report.forecast_profit)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric__label">Риск</span>
                      <RiskIndicator deviation={report.plan_deviation} plannedCost={project.planned_cost} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Таблица для десктопа */}
          <div className="table-wrap table-wrap--desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th className="text-right">Пришло</th>
                  <th className="text-right">Факт расход</th>
                  <th className="text-right">Баланс</th>
                  <th className="text-right">Прогноз прибыли</th>
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
                    <td className={`text-right ${report && report.forecast_profit < 0 ? 'text-danger' : ''}`}>
                      {report ? formatMoney(report.forecast_profit) : '—'}
                    </td>
                    <td className="text-center">
                      {report ? (
                        <RiskIndicator deviation={report.plan_deviation} plannedCost={project.planned_cost} />
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
