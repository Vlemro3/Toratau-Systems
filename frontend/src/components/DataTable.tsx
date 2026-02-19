/**
 * Универсальная таблица: сортировка по столбцам, поиск, пагинация, выбор строк, массовые действия.
 * По умолчанию — от нового к старому (desc по первому сортируемому столбцу).
 */
import { useState, useMemo, useCallback, type ReactNode } from 'react';

const PAGE_SIZES = [50, 100] as const;

const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export interface Column<T> {
  key: string;
  label: string;
  sortValue?: (item: T) => string | number;
  className?: string;
}

export interface DataTableProps<T extends { id: number }> {
  items: T[];
  columns: (Column<T> | null | false)[];
  searchFields: (item: T) => string;
  renderRow: (item: T, selected: boolean, toggle: () => void) => ReactNode;
  onDeleteMany?: (ids: number[]) => void;
  emptyMessage?: string;
  emptyIcon?: string;
  showCheckboxes?: boolean;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
}

export function DataTable<T extends { id: number }>({
  items, columns: rawColumns, searchFields, renderRow,
  onDeleteMany, emptyMessage = 'Нет записей', emptyIcon = '📋',
  showCheckboxes = true,
  defaultSortKey, defaultSortDir = 'desc',
}: DataTableProps<T>) {
  const columns = rawColumns.filter(Boolean) as Column<T>[];

  const firstSortable = defaultSortKey || columns.find((c) => c.sortValue)?.key || '';
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({
    key: firstSortable,
    dir: defaultSortDir,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
    setPage(0);
  }, []);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return items;
    const fn = col.sortValue;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [items, sort.key, sort.dir, columns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((item) => searchFields(item).toLowerCase().includes(q));
  }, [sorted, search, searchFields]);

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
      setSelected((prev) => { const next = new Set(prev); paged.forEach((i) => next.delete(i.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); paged.forEach((i) => next.add(i.id)); return next; });
    }
  }, [allOnPageSelected, paged]);

  const clearSelection = () => setSelected(new Set());

  const handleDeleteSelected = () => {
    if (onDeleteMany && selected.size > 0) { onDeleteMany(Array.from(selected)); clearSelection(); }
  };

  if (items.length === 0) {
    return <div className="empty-state"><div className="empty-state__icon">{emptyIcon}</div><p className="empty-state__message">{emptyMessage}</p></div>;
  }

  return (
    <div className="data-table">
      {/* Toolbar */}
      <div className="data-table__toolbar">
        <div className="data-table__search">
          <input type="text" placeholder="Поиск..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          {search && <button className="data-table__search-clear" onClick={() => setSearch('')} title="Очистить">&times;</button>}
        </div>
        {showCheckboxes && selected.size > 0 && (
          <div className="data-table__bulk">
            <span className="data-table__bulk-count">Выбрано: {selected.size}</span>
            {onDeleteMany && <button className="btn btn--danger btn--sm" onClick={handleDeleteSelected}><IconDelete /> Удалить ({selected.size})</button>}
            <button className="btn btn--ghost btn--sm" onClick={clearSelection}>Снять</button>
          </div>
        )}
      </div>

      {/* Table */}
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
                {columns.map((col) => {
                  const isSortable = !!col.sortValue;
                  const isActive = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`${col.className || ''} ${isSortable ? 'th-sortable' : ''} ${isActive ? 'th-sortable--active' : ''}`}
                      onClick={isSortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="th-sortable__inner">
                        {col.label}
                        {isSortable && (
                          <span className="th-sortable__icon">
                            {isActive ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => renderRow(item, selected.has(item.id), () => toggleOne(item.id)))}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация и выбор размера страницы (всегда внизу справа при наличии записей) */}
      {paged.length > 0 && (
        <div className="data-table__footer">
          <div className="data-table__info">
            <span>{safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} из {filtered.length}</span>
          </div>
          <div className="data-table__pages">
            {totalPages > 1 && (
              <>
                <button className="btn btn--ghost btn--sm" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>&laquo;</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pn = i;
                  if (totalPages > 7) {
                    if (safePage < 3) pn = i;
                    else if (safePage > totalPages - 4) pn = totalPages - 7 + i;
                    else pn = safePage - 3 + i;
                  }
                  return <button key={pn} className={`btn btn--sm ${pn === safePage ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setPage(pn)}>{pn + 1}</button>;
                })}
                <button className="btn btn--ghost btn--sm" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>&raquo;</button>
              </>
            )}
          </div>
          <div className="data-table__pagesize">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / стр</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
