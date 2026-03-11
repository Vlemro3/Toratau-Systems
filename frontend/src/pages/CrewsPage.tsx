/**
 * Контакты подрядчиков — таблица с поиском, пагинацией, массовым удалением.
 * Телефон в списке — кликабельная ссылка tel: для звонка с мобильного.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCrews, deleteCrew } from '../api/crews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { toTelHref, formatPhone } from '../utils/format';
import type { Crew } from '../types';

/** Разделение имени и телефона для отображения (поддержка старого формата "Имя, +7 ...") */
function getDisplayContact(crew: Crew): { name: string; phone: string } {
  const contact = (crew.contact || '').trim();
  const phone = (crew.phone || '').trim();
  if (phone) return { name: contact || '—', phone };
  const commaIdx = contact.indexOf(',');
  if (commaIdx > 0) {
    const part1 = contact.slice(0, commaIdx).trim();
    const part2 = contact.slice(commaIdx + 1).trim();
    if (/\d/.test(part2)) return { name: part1 || '—', phone: part2 };
  }
  return { name: contact || '—', phone: '' };
}

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

export function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);

  useEffect(() => { loadCrews(); }, []);

  async function loadCrews() {
    try { setCrews(await getCrews()); }
    finally { setLoading(false); }
  }

  const askDelete = (crew: Crew) => {
    setConfirmAction({
      title: 'Удалить подрядчика?',
      message: `Вы уверены, что хотите удалить «${crew.name}»?`,
      action: async () => { await deleteCrew(crew.id); await loadCrews(); },
    });
  };

  const askDeleteMany = (ids: number[]) => {
    setConfirmAction({
      title: 'Удалить подрядчиков?',
      message: `Удалить выбранных подрядчиков (${ids.length})?`,
      action: async () => { for (const id of ids) await deleteCrew(id); await loadCrews(); },
    });
  };

  const doConfirm = async () => {
    if (!confirmAction) return;
    try { await confirmAction.action(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Ошибка'); }
    setConfirmAction(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Контакты подрядчиков</h2>
      </div>

      <div className="tab-header">
        <Link to="/contacts/new" className="btn btn--primary btn--sm">+ Добавить</Link>
      </div>

      <DataTable
        items={crews}
        columns={[
          { key: 'name', label: 'Название', sortValue: (c) => c.name },
          { key: 'contact', label: 'Контактное лицо', sortValue: (c) => getDisplayContact(c).name },
          { key: 'phone', label: 'Телефон', sortValue: (c) => getDisplayContact(c).phone },
          { key: 'notes', label: 'Примечание' },
          { key: 'status', label: 'Статус', className: 'text-center', sortValue: (c) => c.is_active ? 1 : 0 },
          { key: 'actions', label: 'Действия', className: 'text-center' },
        ]}
        defaultSortKey="name"
        defaultSortDir="asc"
        searchFields={(c) => `${c.name} ${c.contact || ''} ${c.phone || ''} ${c.notes || ''}`}
        emptyMessage="Подрядчики не добавлены" emptyIcon="📇"
        onDeleteMany={askDeleteMany}
        renderRow={(crew, sel, toggle) => {
          const { name: contactName, phone: contactPhone } = getDisplayContact(crew);
          return (
          <tr key={crew.id} className={sel ? 'table-row--selected' : ''}>
            <td style={{ textAlign: 'center' }}><input type="checkbox" checked={sel} onChange={toggle} /></td>
            <td><strong>{crew.name}</strong></td>
            <td>{contactName}</td>
            <td>
              {contactPhone ? (
                <a href={toTelHref(contactPhone)} className="table-link-tel" onClick={(e) => e.stopPropagation()}>
                  {formatPhone(contactPhone)}
                </a>
              ) : (
                '—'
              )}
            </td>
            <td className="text-muted">{crew.notes || '—'}</td>
            <td className="text-center">
              <span className={`status-dot ${crew.is_active ? 'status-dot--green' : 'status-dot--gray'}`} />
              {crew.is_active ? 'Активен' : 'Неактивен'}
            </td>
            <td><div className="table-actions">
              <Link to={`/contacts/${crew.id}/edit`} className="table-action table-action--edit" title="Редактировать"><IconEdit /></Link>
              <button className="table-action table-action--delete" onClick={() => askDelete(crew)} title="Удалить"><IconDelete /></button>
            </div></td>
          </tr>
          );
        }}
      />

      <ConfirmDialog
        open={!!confirmAction} title={confirmAction?.title || ''} message={confirmAction?.message || ''}
        onConfirm={doConfirm} onCancel={() => setConfirmAction(null)} danger
      />
    </div>
  );
}
