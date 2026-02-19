import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCounterparty } from '../api/counterparties';
import { getDocuments, deleteDocument } from '../api/documents';
import { getOrganization } from '../api/organizations';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getDocType, DOCUMENT_TYPES, DOC_CATEGORIES } from '../utils/documentTypes';
import { generateAndDownloadDocx } from '../utils/generateDocx';
import { formatDate } from '../utils/format';
import type { Counterparty, CpDocument } from '../types';

export function CounterpartyDocumentsPage() {
  const { cpId } = useParams<{ cpId: string }>();
  const navigate = useNavigate();
  const [cp, setCp] = useState<Counterparty | null>(null);
  const [docs, setDocs] = useState<CpDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(() => {
    if (!cpId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getCounterparty(Number(cpId)),
      getDocuments(Number(cpId)),
    ])
      .then(([c, d]) => { setCp(c); setDocs(d); })
      .catch((err) => {
        // Error handling - could show user-friendly message
        if (import.meta.env.DEV) {
          console.error('Ошибка загрузки документов:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [cpId]);

  useEffect(() => { load(); }, [load]);

  // Обработка ESC для закрытия модального окна и блокировка скролла
  useEffect(() => {
    if (!showPicker) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [showPicker]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить документ?')) return;
    try {
      await deleteDocument(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления документа');
    }
  };

  const handleDownload = async (doc: CpDocument) => {
    if (!cp) return;
    try {
      let org = null;
      if (doc.organization_id) {
        try {
          org = await getOrganization(doc.organization_id);
        } catch (err) {
          // Organization not found, continue without it
          if (import.meta.env.DEV) {
            console.warn('Организация не найдена:', err);
          }
        }
      }
      await generateAndDownloadDocx(doc, cp, org);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка генерации документа');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!cp) return <div className="page"><p>Контрагент не найден</p></div>;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/counterparties')}>&larr; Назад</button>
          <h2 className="page__title">Документы: {cp.name}</h2>
        </div>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => setShowPicker(true)}>+ Создать документ</button>
        </div>
      </div>

      {/* Document type picker */}
      {showPicker && (
        <div className="doc-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="doc-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-picker-modal__header">
              <h3 className="doc-picker-modal__title">Выберите тип документа</h3>
              <button className="doc-picker-modal__close" onClick={() => setShowPicker(false)} aria-label="Закрыть">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="doc-picker-modal__body">
              {DOC_CATEGORIES.map((cat) => (
                <div key={cat} className="doc-picker__group">
                  <h4 className="doc-picker__category">{cat}</h4>
                  <div className="doc-picker__list">
                    {DOCUMENT_TYPES.filter((d) => d.category === cat).map((dt) => (
                      <Link
                        key={dt.id}
                        to={`/counterparties/${cpId}/documents/new?type=${dt.id}`}
                        className="doc-picker__item"
                        onClick={() => setShowPicker(false)}
                      >
                        {dt.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents table */}
      {docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📄</div>
          <p className="empty-state__message">Нет документов</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Тип документа</th>
                <th>НОМЕР</th>
                <th>ДАТА</th>
                <th className="text-right">СУММА</th>
                <th>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{getDocType(doc.doc_type)?.name || doc.doc_type}</strong></td>
                  <td>{doc.number || '—'}</td>
                  <td>{formatDate(doc.date)}</td>
                  <td className="text-right">{doc.total > 0 ? doc.total.toLocaleString('ru-RU') + ' Р' : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/counterparties/${cpId}/documents/${doc.id}/edit`} className="table-action table-action--edit" title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Link>
                      <button className="table-action" title="Скачать .docx" onClick={() => handleDownload(doc)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button className="table-action table-action--delete" title="Удалить" onClick={() => handleDelete(doc.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
