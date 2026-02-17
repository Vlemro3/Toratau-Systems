/**
 * Селектор объекта в хедере.
 * - Активные объекты показываются сразу
 * - Завершённые/архивные скрыты в сворачиваемом блоке «Архив»
 * - Поиск работает по всем объектам
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProjects } from '../api/projects';
import { useAuth } from '../hooks/useAuth';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../utils/constants';
import type { Project, ProjectStatus } from '../types';

const ARCHIVED_STATUSES: ProjectStatus[] = ['completed', 'archived'];

function isArchived(status: ProjectStatus) {
  return ARCHIVED_STATUSES.includes(status);
}

export function ProjectSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentProjectId = (() => {
    const match = location.pathname.match(/\/projects\/(\d+)/);
    return match ? Number(match[1]) : null;
  })();

  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  const loadProjects = useCallback(async () => {
    try { setProjects(await getProjects()); } catch { /* */ }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const toggle = () => {
    if (!open) loadProjects();
    setOpen((v) => !v);
    setSearch('');
    setArchiveOpen(false);
  };

  const selectProject = (id: number) => {
    setOpen(false);
    setSearch('');
    navigate(`/projects/${id}`);
  };

  const goCreateProject = () => {
    setOpen(false);
    setSearch('');
    navigate('/projects/new');
  };

  const q = search.toLowerCase();
  const matchesSearch = (p: Project) => p.name.toLowerCase().includes(q);

  const activeFiltered = projects.filter((p) => !isArchived(p.status) && matchesSearch(p));
  const archivedFiltered = projects.filter((p) => isArchived(p.status) && matchesSearch(p));

  /* При поиске автоматически раскрываем архив если есть совпадения */
  const showArchive = archiveOpen || (search.length > 0 && archivedFiltered.length > 0);

  const renderItem = (p: Project) => (
    <button
      key={p.id}
      className={`project-selector__item ${p.id === currentProjectId ? 'project-selector__item--active' : ''}`}
      onClick={() => selectProject(p.id)}
    >
      <div className="project-selector__item-name">{p.name}</div>
      <div className="project-selector__item-meta">
        <span className="project-selector__item-status" style={{ color: PROJECT_STATUS_COLORS[p.status] }}>
          {PROJECT_STATUS_LABELS[p.status]}
        </span>
        <span className="project-selector__item-client">{p.client}</span>
      </div>
    </button>
  );

  const noResults = activeFiltered.length === 0 && archivedFiltered.length === 0;

  return (
    <div className="project-selector" ref={ref}>
      <button className="project-selector__trigger" onClick={toggle}>
        <span className="project-selector__icon">🏗️</span>
        <span className="project-selector__label">
          {currentProject ? currentProject.name : 'Выберите объект'}
        </span>
        <span className={`project-selector__arrow ${open ? 'project-selector__arrow--open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="project-selector__dropdown">
          <div className="project-selector__search">
            <input
              ref={inputRef}
              type="text"
              placeholder="Поиск объекта..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="project-selector__list">
            {noResults && (
              <div className="project-selector__empty">Ничего не найдено</div>
            )}

            {/* Активные */}
            {activeFiltered.length > 0 && activeFiltered.map(renderItem)}

            {/* Архив */}
            {archivedFiltered.length > 0 && (
              <>
                <button
                  className="project-selector__archive-toggle"
                  onClick={(e) => { e.stopPropagation(); setArchiveOpen((v) => !v); }}
                >
                  <span className={`project-selector__archive-arrow ${showArchive ? 'project-selector__archive-arrow--open' : ''}`}>▸</span>
                  Архив ({archivedFiltered.length})
                </button>
                {showArchive && (
                  <div className="project-selector__archive-list">
                    {archivedFiltered.map(renderItem)}
                  </div>
                )}
              </>
            )}
          </div>

          {isAdmin && (
            <button className="project-selector__create" onClick={goCreateProject}>
              + Создать объект
            </button>
          )}
        </div>
      )}
    </div>
  );
}
