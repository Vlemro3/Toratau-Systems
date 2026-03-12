/**
 * Страница «Документы» — все документы из всех контрагентов.
 * Поиск, создание документов, загрузка файлов для хранения.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../api/documents';
import { getCounterparties } from '../api/counterparties';
import { getOrganization } from '../api/organizations';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getDocType, DOCUMENT_TYPES, DOC_CATEGORIES } from '../utils/documentTypes';
import { generateAndDownloadDocx } from '../utils/generateDocx';
import { formatDate } from '../utils/format';
import type { Counterparty, CpDocument } from '../types';

/* ---- Локальное хранилище загруженных файлов ---- */

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
  counterpartyId?: number;
  comment?: string;
}

function _getPortalId(): string {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.portal_id) return String(u.portal_id);
    }
  } catch { /* ignore */ }
  return 'default';
}

const FILES_LS_KEY = () => `toratau_uploaded_files_${_getPortalId()}`;

function loadUploadedFiles(): UploadedFile[] {
  try {
    const raw = localStorage.getItem(FILES_LS_KEY());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveUploadedFiles(files: UploadedFile[]) {
  localStorage.setItem(FILES_LS_KEY(), JSON.stringify(files));
}

/* ---- SVG Icons ---- */

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

type ViewTab = 'documents' | 'files';

export function DocumentsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<CpDocument[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCpId, setSelectedCpId] = useState<number | null>(null);
  const [tab, setTab] = useState<ViewTab>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadComment, setUploadComment] = useState('');
  const [uploadCpId, setUploadCpId] = useState<number | ''>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const cpMap = useMemo(() => {
    const m: Record<number, Counterparty> = {};
    counterparties.forEach((c) => { m[c.id] = c; });
    return m;
  }, [counterparties]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getDocuments(),
      getCounterparties(),
    ])
      .then(([d, c]) => {
        setDocs(d);
        setCounterparties(c);
        setUploadedFiles(loadUploadedFiles());
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('Ошибка загрузки документов:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ESC to close modals
  useEffect(() => {
    if (!showPicker && !showUploadModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowPicker(false); setShowUploadModal(false); }
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [showPicker, showUploadModal]);

  /* ---- Search ---- */
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter((doc) => {
      const cpName = cpMap[doc.counterparty_id]?.name || '';
      const typeName = getDocType(doc.doc_type)?.name || doc.doc_type;
      return (
        cpName.toLowerCase().includes(q) ||
        typeName.toLowerCase().includes(q) ||
        (doc.number || '').toLowerCase().includes(q) ||
        (doc.date || '').includes(q) ||
        (doc.notes || '').toLowerCase().includes(q)
      );
    });
  }, [docs, search, cpMap]);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return uploadedFiles;
    const q = search.toLowerCase();
    return uploadedFiles.filter((f) => {
      const cpName = f.counterpartyId ? (cpMap[f.counterpartyId]?.name || '') : '';
      return (
        f.name.toLowerCase().includes(q) ||
        cpName.toLowerCase().includes(q) ||
        (f.comment || '').toLowerCase().includes(q)
      );
    });
  }, [uploadedFiles, search, cpMap]);

  /* ---- Actions ---- */
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
    const cp = cpMap[doc.counterparty_id];
    if (!cp) { alert('Контрагент не найден'); return; }
    try {
      let org = null;
      if (doc.organization_id) {
        try { org = await getOrganization(doc.organization_id); } catch { /* ignore */ }
      }
      await generateAndDownloadDocx(doc, cp, org);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка генерации документа');
    }
  };

  /* ---- Create document flow ---- */
  const openCreatePicker = () => {
    if (counterparties.length === 0) {
      alert('Сначала создайте контрагента');
      return;
    }
    setSelectedCpId(null);
    setShowPicker(true);
  };

  /* ---- File upload ---- */
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setUploadComment('');
    setUploadCpId('');
    setShowUploadModal(true);
    e.target.value = '';
  };

  const handleUploadConfirm = () => {
    if (!pendingFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newFile: UploadedFile = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: pendingFile.name,
        size: pendingFile.size,
        type: pendingFile.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
        counterpartyId: uploadCpId ? Number(uploadCpId) : undefined,
        comment: uploadComment.trim() || undefined,
      };
      const updated = [...uploadedFiles, newFile];
      setUploadedFiles(updated);
      saveUploadedFiles(updated);
      setShowUploadModal(false);
      setPendingFile(null);
      setTab('files');
    };
    reader.readAsDataURL(pendingFile);
  };

  const handleFileDownload = (f: UploadedFile) => {
    const a = document.createElement('a');
    a.href = f.dataUrl;
    a.download = f.name;
    a.click();
  };

  const handleFileView = (f: UploadedFile) => {
    const w = window.open('', '_blank');
    if (!w) { alert('Не удалось открыть окно. Разрешите всплывающие окна.'); return; }
    if (f.type.startsWith('image/')) {
      w.document.write(`<html><head><title>${f.name}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a1a"><img src="${f.dataUrl}" style="max-width:100%;max-height:100vh" /></body></html>`);
    } else if (f.type === 'application/pdf') {
      w.document.write(`<html><head><title>${f.name}</title></head><body style="margin:0"><iframe src="${f.dataUrl}" style="width:100%;height:100vh;border:none"></iframe></body></html>`);
    } else {
      // Для прочих типов — скачивание
      w.close();
      handleFileDownload(f);
    }
  };

  const handleFileDelete = (id: string) => {
    if (!confirm('Удалить файл?')) return;
    const updated = uploadedFiles.filter((f) => f.id !== id);
    setUploadedFiles(updated);
    saveUploadedFiles(updated);
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-left">
          <h2 className="page__title">Документы</h2>
        </div>
        <div className="page__actions" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--secondary" onClick={handleFileSelect}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconUpload /> Загрузить файл</span>
          </button>
          <button className="btn btn--primary" onClick={openCreatePicker}>+ Создать документ</button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Search */}
      <div className="data-table__search" style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="data-table__search-clear" onClick={() => setSearch('')} title="Очистить">&times;</button>}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab ${tab === 'documents' ? 'tab--active' : ''}`} onClick={() => setTab('documents')}>
          Документы ({filteredDocs.length})
        </button>
        <button type="button" className={`tab ${tab === 'files' ? 'tab--active' : ''}`} onClick={() => setTab('files')}>
          Загруженные файлы ({filteredFiles.length})
        </button>
      </div>

      {/* Documents tab */}
      {tab === 'documents' && (
        <>
          {filteredDocs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📄</div>
              <p className="empty-state__message">{search ? 'Ничего не найдено' : 'Нет документов'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Контрагент</th>
                    <th>Тип документа</th>
                    <th>Номер</th>
                    <th>Дата</th>
                    <th className="text-right">Сумма</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => {
                    const cpName = cpMap[doc.counterparty_id]?.name || `#${doc.counterparty_id}`;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <Link to={`/counterparties/${doc.counterparty_id}/documents`} className="link" title="Перейти к документам контрагента">
                            {cpName}
                          </Link>
                        </td>
                        <td><strong>{getDocType(doc.doc_type)?.name || doc.doc_type}</strong></td>
                        <td>{doc.number || '—'}</td>
                        <td>{formatDate(doc.date)}</td>
                        <td className="text-right">{doc.total > 0 ? doc.total.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                        <td>
                          <div className="table-actions">
                            <Link to={`/counterparties/${doc.counterparty_id}/documents/${doc.id}/edit`} className="table-action table-action--edit" title="Редактировать">
                              <IconEdit />
                            </Link>
                            <button className="table-action" title="Скачать .docx" onClick={() => handleDownload(doc)}>
                              <IconDownload />
                            </button>
                            <button className="table-action table-action--delete" title="Удалить" onClick={() => handleDelete(doc.id)}>
                              <IconDelete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Files tab */}
      {tab === 'files' && (
        <>
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📁</div>
              <p className="empty-state__message">{search ? 'Ничего не найдено' : 'Нет загруженных файлов'}</p>
              <button className="btn btn--primary" onClick={handleFileSelect} style={{ marginTop: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconUpload /> Загрузить файл</span>
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Файл</th>
                    <th>Контрагент</th>
                    <th>Комментарий</th>
                    <th>Размер</th>
                    <th>Дата загрузки</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconFile />
                          <strong style={{ wordBreak: 'break-all' }}>{f.name}</strong>
                        </div>
                      </td>
                      <td>{f.counterpartyId ? (cpMap[f.counterpartyId]?.name || `#${f.counterpartyId}`) : '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.comment || '—'}</td>
                      <td>{formatFileSize(f.size)}</td>
                      <td>{formatDate(f.uploadedAt)}</td>
                      <td>
                        <div className="table-actions">
                          {(f.type.startsWith('image/') || f.type === 'application/pdf') && (
                            <button className="table-action" title="Просмотр" onClick={() => handleFileView(f)}>
                              <IconEye />
                            </button>
                          )}
                          <button className="table-action" title="Скачать" onClick={() => handleFileDownload(f)}>
                            <IconDownload />
                          </button>
                          <button className="table-action table-action--delete" title="Удалить" onClick={() => handleFileDelete(f.id)}>
                            <IconDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Document type picker with counterparty selection */}
      {showPicker && (
        <div className="doc-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="doc-picker-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="doc-picker-modal__header">
              <h3 className="doc-picker-modal__title">Создать документ</h3>
              <button className="doc-picker-modal__close" onClick={() => setShowPicker(false)} aria-label="Закрыть">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="doc-picker-modal__body">
              {/* Counterparty selector */}
              <div style={{ marginBottom: 20, padding: '0 0 16px', borderBottom: '1px solid #e2e8f0' }}>
                <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Контрагент *</label>
                <select
                  className="input"
                  value={selectedCpId ?? ''}
                  onChange={(e) => setSelectedCpId(e.target.value ? Number(e.target.value) : null)}
                  style={{ fontSize: 14 }}
                >
                  <option value="">— Выберите контрагента —</option>
                  {counterparties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {!selectedCpId ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Выберите контрагента для создания документа</p>
              ) : (
                <>
                  {DOC_CATEGORIES.map((cat) => (
                    <div key={cat} className="doc-picker__group">
                      <h4 className="doc-picker__category">{cat}</h4>
                      <div className="doc-picker__list">
                        {DOCUMENT_TYPES.filter((d) => d.category === cat).map((dt) => (
                          <Link
                            key={dt.id}
                            to={`/counterparties/${selectedCpId}/documents/new?type=${dt.id}`}
                            className="doc-picker__item"
                            onClick={() => setShowPicker(false)}
                          >
                            {dt.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File upload modal */}
      {showUploadModal && pendingFile && (
        <div className="doc-picker-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="doc-picker-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="doc-picker-modal__header">
              <h3 className="doc-picker-modal__title">Загрузить файл</h3>
              <button className="doc-picker-modal__close" onClick={() => setShowUploadModal(false)} aria-label="Закрыть">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="doc-picker-modal__body" style={{ padding: '16px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                <IconFile />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, wordBreak: 'break-all' }}>{pendingFile.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{formatFileSize(pendingFile.size)}</div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Контрагент (необязательно)</label>
                <select className="input" value={uploadCpId} onChange={(e) => setUploadCpId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Без привязки —</option>
                  {counterparties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Комментарий (необязательно)</label>
                <input type="text" className="input" placeholder="Например: Договор подряда №123" value={uploadComment} onChange={(e) => setUploadComment(e.target.value)} />
              </div>
              <button className="btn btn--primary" style={{ width: '100%' }} onClick={handleUploadConfirm}>
                Загрузить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
