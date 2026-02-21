import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEstimate, REGIONS } from '../../api/estimates';
import type { EstimateBaseType } from '../../api/estimates';

export function EstimateCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [baseType, setBaseType] = useState<EstimateBaseType>('FER');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Введите название'); return; }
    if (!fileName) { setError('Загрузите файл сметы'); return; }
    setSaving(true);
    setError('');
    try {
      const est = await createEstimate({ name: name.trim(), region, baseType, fileName });
      navigate(`/estimates/${est.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/estimates')}>← Назад</button>
          <h2 className="page__title" style={{ marginTop: 8 }}>Добавить смету</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Название объекта *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: ЖК «Солнечный» — Общестрой" />
        </div>

        <div className="form-group">
          <label className="form-label">Регион выполнения работ *</label>
          <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Тип нормативной базы *</label>
          <select className="input" value={baseType} onChange={(e) => setBaseType(e.target.value as EstimateBaseType)}>
            <option value="FER">ФЕР (Федеральные единичные расценки)</option>
            <option value="TER">ТЕР (Территориальные единичные расценки)</option>
            <option value="GESN">ГЭСН (Государственные элементные сметные нормы)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Загрузка файла сметы *</label>
          <div style={{ border: '2px dashed var(--color-border)', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
            <input
              type="file"
              accept=".xls,.xlsx,.xml,.pdf"
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
            {fileName ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <p style={{ fontWeight: 600 }}>{fileName}</p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>Нажмите, чтобы заменить</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <p>Перетащите файл или нажмите для выбора</p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>.xls, .xlsx, .xml, .pdf</p>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/estimates')}>Отмена</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Загрузка...' : 'Загрузить и распознать'}
          </button>
        </div>
      </form>
    </div>
  );
}
