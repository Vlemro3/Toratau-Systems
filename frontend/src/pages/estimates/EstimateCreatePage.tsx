import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEstimate, REGIONS_SORTED } from '../../api/estimates';
import type { EstimateBaseType } from '../../api/estimates';

export function EstimateCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [region, setRegion] = useState(REGIONS_SORTED[0]);
  const [baseType, setBaseType] = useState<EstimateBaseType>('FER');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Введите название'); return; }
    if (!file) { setError('Загрузите файл сметы'); return; }
    setSaving(true);
    setError('');
    try {
      const fileContentBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = r.result as string;
          resolve(s.includes(',') ? s.split(',')[1]! : s);
        };
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const est = await createEstimate(
        { name: name.trim(), region, baseType, fileName: file.name },
        file,
        fileContentBase64
      );
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
            {REGIONS_SORTED.map((r) => <option key={r} value={r}>{r}</option>)}
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
          <span className="form-label" style={{ display: 'block', marginBottom: 8 }}>Загрузка файла сметы *</span>
          <label
            htmlFor="estimate-file-input"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{ border: '2px dashed var(--color-border)', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer', display: 'block' }}
          >
            <input
              id="estimate-file-input"
              type="file"
              accept=".xls,.xlsx,.xml"
              onChange={handleFileChange}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <p style={{ fontWeight: 600 }}>{file.name}</p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>Нажмите или перетащите другой файл</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <p>Перетащите файл сюда или нажмите для выбора</p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>.xls, .xlsx, .xml</p>
              </div>
            )}
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/estimates')}>Отмена</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Загрузка...' : 'Загрузить и заполнить позиции'}
          </button>
        </div>
      </form>
    </div>
  );
}
