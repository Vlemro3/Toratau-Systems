/**
 * Универсальная обёртка таблицы: поиск, пагинация, выбор строк, массовые действия.
 */
import { useState, useMemo, useCallback, type ReactNode } from 'react';

const PAGE_SIZES = [50, 100] as const;

/* SVG-иконки */
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export interface DataTableProps<T extends { id: number }> {
  items: T[];
  searchFields: (item: T) => string;
  renderHead: () => ReactNode;
  renderRow: (item: T, selected: boolean, toggle: () => void) => ReactNode;
  onDeleteMany?: (ids: number[]) => void;
  emptyMessage?: string;
  emptyIcon?: string;
  showCheckboxes?: boolean;
}

export function DataTable<T extends { id: number }>({
  items, searchFields, renderHead, renderRow,
  onDeleteMany, emptyMessage = 'Нет записей', emptyIcon = '📋',
  showCheckboxes = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => searchFields(item).toLowerCase().includes(q));
  }, [items, search, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const allOnPageSelected = paged.length > 0 && paged.every((i) => selected.has(i.id));

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((i) => next.add(i.id));
        return next;
      });
    }
  }, [allOnPageSelected, paged]);

  const clearSelection = () => setSelected(new Set());

  const handleDeleteSelected = () => {
    if (onDeleteMany && selected.size > 0) {
      onDeleteMany(Array.from(selected));
      clearSelection();
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">{emptyIcon}</div>
        <p className="empty-state__message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table">
      {/* Поиск + массовые действия */}
      <div className="data-table__toolbar">
        <div className="data-table__search">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          {search && (
            <button className="data-table__search-clear" onClick={() => setSearch('')} title="Очистить">&times;</button>
          )}
        </div>
        {showCheckboxes && selected.size > 0 && (
          <div className="data-table__bulk">
            <span className="data-table__bulk-count">Выбрано: {selected.size}</span>
            {onDeleteMany && (
              <button className="btn btn--danger btn--sm" onClick={handleDeleteSelected}>
                <IconDelete /> Удалить ({selected.size})
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={clearSelection}>Снять</button>
          </div>
        )}
      </div>

      {/* Таблица */}
      {paged.length === 0 ? (
        <p className="text-muted" style={{ padding: 24, textAlign: 'center' }}>Ничего не найдено</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {showCheckboxes && (
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} title="Выбрать все" />
                  </th>
                )}
                {renderHead()}
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => renderRow(item, selected.has(item.id), () => toggleOne(item.id)))}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {filtered.length > PAGE_SIZES[0] || page > 0 ? (
        <div className="data-table__footer">
          <div className="data-table__info">
            {filtered.length > 0 && (
              <span>{safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} из {filtered.length}</span>
            )}
          </div>
          <div className="data-table__pages">
            <button className="btn btn--ghost btn--sm" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>&laquo;</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum = i;
              if (totalPages > 7) {
                if (safePage < 3) pageNum = i;
                else if (safePage > totalPages - 4) pageNum = totalPages - 7 + i;
                else pageNum = safePage - 3 + i;
              }
              return (
                <button key={pageNum} className={`btn btn--sm ${pageNum === safePage ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setPage(pageNum)}>{pageNum + 1}</button>
              );
            })}
            <button className="btn btn--ghost btn--sm" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>&raquo;</button>
          </div>
          <div className="data-table__pagesize">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / стр</option>)}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
