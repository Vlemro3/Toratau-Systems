import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEstimate, REGIONS_SORTED } from '../../api/estimates';
import type { EstimatePosition } from '../../api/estimates';
import { getWorkTypes, createWorkType } from '../../api/workTypes';
import type { WorkType } from '../../types';

const emptyPosition = (id: number, num: string): EstimatePosition => ({
  id, num, normCode: '', name: '', unit: '', volume: 0, price: 0, total: 0, overhead: 0, profit: 0,
  adjustmentCoeff: '', recalcCoeffNumber: '', laborPersonHours: 0, costPerUnitFromStart: 0,
});

const sheetCSS = `
.mc-sheet { border-collapse: collapse; width: 100%; font-size: 12px; table-layout: fixed; }
.mc-sheet th, .mc-sheet td { border: 1px solid #d0d5dd; padding: 0; height: 28px; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-sheet th { background: #f2f4f7; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.02em; padding: 4px 6px; text-align: center; position: sticky; top: 0; z-index: 2; }
.mc-sheet td input, .mc-sheet td textarea { width: 100%; height: 100%; border: none; outline: none; background: transparent; padding: 2px 6px; font-size: 12px; font-family: inherit; box-sizing: border-box; }
.mc-sheet td input:focus, .mc-sheet td textarea:focus { background: #eff6ff; }
.mc-sheet td input[type="number"] { text-align: right; -moz-appearance: textfield; }
.mc-sheet td input[type="number"]::-webkit-inner-spin-button,
.mc-sheet td input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.mc-sheet td.mc-name { white-space: normal; overflow: visible; height: auto; min-height: 28px; vertical-align: top; }
.mc-sheet td.mc-name textarea { resize: none; overflow: hidden; line-height: 1.4; min-height: 28px; }
.mc-sheet td.mc-del { text-align: center; cursor: pointer; color: #94a3b8; width: 28px; padding: 0; }
.mc-sheet td.mc-del:hover { color: #dc2626; background: #fef2f2; }
.mc-sheet tbody tr:hover td { background: #f8fafc; }
.mc-sheet tbody tr:hover td input, .mc-sheet tbody tr:hover td textarea { background: #f8fafc; }
.mc-sheet tbody tr:hover td input:focus, .mc-sheet tbody tr:hover td textarea:focus { background: #eff6ff; }
.mc-sheet tfoot td { background: #f2f4f7; font-weight: 700; padding: 4px 6px; font-size: 12px; }
.mc-sheet .c-num { width: 40px; }
.mc-sheet .c-name { width: auto; min-width: 200px; }
.mc-sheet .c-unit { width: 55px; }
.mc-sheet .c-vol { width: 70px; }
.mc-sheet .c-price { width: 80px; }
.mc-sheet .c-total { width: 90px; }
.mc-sheet .c-oh { width: 70px; }
.mc-sheet .c-pr { width: 70px; }
`;

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₽';
}

function fmtNum(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadEstimateCSV(estName: string, region: string, positions: EstimatePosition[], totals: { totalSum: number; totalOverhead: number; totalProfit: number; grandTotal: number }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const sep = ';';
  const lines: string[] = [];

  lines.push(`ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЁТ`);
  lines.push(``);
  lines.push(`Объект: ${estName}`);
  lines.push(`Регион: ${region}`);
  lines.push(`Дата составления: ${dateStr}`);
  lines.push(``);
  lines.push(`Составлена в системе Стройтранс`);
  lines.push(``);

  lines.push(['№ п/п', 'Наименование работ и затрат', 'Ед. изм.', 'Кол-во', 'Цена за ед. руб.', 'ВСЕГО руб.', 'Накладные расходы руб.', 'Сметная прибыль руб.'].join(sep));

  for (const p of positions) {
    lines.push([
      p.num,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.unit,
      fmtNum(p.volume),
      fmtNum(p.price),
      fmtNum(p.total),
      fmtNum(p.overhead),
      fmtNum(p.profit),
    ].join(sep));
  }

  lines.push(``);
  lines.push(['', 'ИТОГО прямые затраты', '', '', '', fmtNum(totals.totalSum), '', ''].join(sep));
  lines.push(['', 'Накладные расходы', '', '', '', '', fmtNum(totals.totalOverhead), ''].join(sep));
  lines.push(['', 'Сметная прибыль', '', '', '', '', '', fmtNum(totals.totalProfit)].join(sep));
  lines.push(``);
  lines.push(['', 'ИТОГО ПО СМЕТЕ', '', '', '', fmtNum(totals.grandTotal), '', ''].join(sep));
  lines.push(``);
  lines.push(`Составил:;________________;`);
  lines.push(`Проверил:;________________;`);

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Смета_${estName.replace(/[^а-яА-Яa-zA-Z0-9 _-]/g, '').substring(0, 50)}_${dateStr.replace(/\./g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EstimateManualCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [region, setRegion] = useState(REGIONS_SORTED[0]);
  const [positions, setPositions] = useState<EstimatePosition[]>([
    emptyPosition(1, '1'),
    emptyPosition(2, '2'),
    emptyPosition(3, '3'),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [rateSearch, setRateSearch] = useState('');
  const [addingToRates, setAddingToRates] = useState(false);

  const update = useCallback((index: number, field: keyof EstimatePosition, value: string | number) => {
    setPositions((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      if (field === 'volume' || field === 'price') {
        const row = next[index];
        row.total = Math.round(Number(row.volume) * Number(row.price) * 100) / 100;
      }
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setPositions((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      return [...prev, emptyPosition(nextId, String(prev.length + 1))];
    });
  }, []);

  const deleteRow = useCallback((index: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, num: String(i + 1) })));
  }, []);

  const openRatesModal = useCallback(() => {
    setRatesModalOpen(true);
    setRateSearch('');
    getWorkTypes().then((list) => setWorkTypes(list.filter((w) => w.is_active))).catch(() => setWorkTypes([]));
  }, []);

  const addFromRate = useCallback((wt: WorkType) => {
    setPositions((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const newPos: EstimatePosition = {
        id: nextId, num: String(prev.length + 1), normCode: '', name: wt.name,
        unit: wt.unit || 'шт', volume: 1, price: wt.rate, total: wt.rate,
        overhead: 0, profit: 0, adjustmentCoeff: '', recalcCoeffNumber: '',
        laborPersonHours: 0, costPerUnitFromStart: 0,
      };
      return [...prev, newPos];
    });
    setRatesModalOpen(false);
  }, []);

  const filteredRates = useMemo(() => {
    if (!rateSearch.trim()) return workTypes;
    const q = rateSearch.toLowerCase();
    return workTypes.filter((w) => w.name.toLowerCase().includes(q) || (w.unit && w.unit.toLowerCase().includes(q)));
  }, [workTypes, rateSearch]);

  const handleAddToRates = useCallback(async () => {
    const filled = positions.filter((p) => p.name.trim() && p.total > 0);
    if (!filled.length) { alert('Нет заполненных позиций для добавления в расценки'); return; }
    setAddingToRates(true);
    try {
      const existingRates = await getWorkTypes();
      const existingSet = new Set(existingRates.map((w) => `${w.name.trim().toLowerCase()}|${(w.unit || '').trim().toLowerCase()}`));
      const toCreate = filled.filter((p) => !existingSet.has(`${p.name.trim().toLowerCase()}|${(p.unit || 'шт').trim().toLowerCase()}`));
      const skipped = filled.length - toCreate.length;
      if (!toCreate.length) { alert(`Все ${filled.length} позиций уже есть в расценках`); return; }
      const msg = skipped > 0
        ? `Добавить ${toCreate.length} новых расценок? (${skipped} уже существуют и будут пропущены)`
        : `Добавить ${toCreate.length} позиций в расценки?`;
      if (!confirm(msg)) return;
      let created = 0;
      for (const p of toCreate) {
        await createWorkType({ name: p.name, unit: p.unit || 'шт', rate: p.price || (p.volume ? Math.round(p.total / p.volume * 100) / 100 : p.total), category: 'Из сметы', is_active: true });
        created++;
      }
      alert(skipped > 0 ? `Добавлено ${created} расценок, ${skipped} пропущено (уже существуют)` : `Добавлено ${created} расценок`);
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    } finally {
      setAddingToRates(false);
    }
  }, [positions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Введите название объекта'); return; }
    const filled = positions.filter((p) => p.name.trim());
    if (!filled.length) { setError('Добавьте хотя бы одну позицию с наименованием'); return; }
    setSaving(true);
    setError('');
    try {
      const est = await createEstimate(
        { name: name.trim(), region, baseType: 'FER', fileName: 'Ручной ввод' },
        undefined,
        undefined,
      );
      const all = JSON.parse(localStorage.getItem('estimates') || '[]');
      const idx = all.findIndex((x: { id: number }) => x.id === est.id);
      if (idx >= 0) {
        all[idx].positions = filled.map((p, i) => ({ ...p, id: i + 1, num: String(i + 1) }));
        all[idx].status = 'parsed';
        localStorage.setItem('estimates', JSON.stringify(all));
      }
      navigate(`/estimates/${est.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const totalSum = positions.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const totalOverhead = positions.reduce((s, p) => s + (Number(p.overhead) || 0), 0);
  const totalProfit = positions.reduce((s, p) => s + (Number(p.profit) || 0), 0);
  const grandTotal = totalSum + totalOverhead + totalProfit;

  const handleDownload = () => {
    const filled = positions.filter((p) => p.name.trim());
    if (!filled.length) { alert('Нет заполненных позиций для скачивания'); return; }
    downloadEstimateCSV(name || 'Без названия', region, filled, { totalSum, totalOverhead, totalProfit, grandTotal });
  };

  return (
    <div className="page">
      <style>{sheetCSS}</style>
      <div className="page__header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/estimates')}>← Назад</button>
          <h2 className="page__title" style={{ marginTop: 8 }}>Создать смету</h2>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Название объекта *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: ЖК «Солнечный» — Общестрой" />
          </div>
          <div className="form-group">
            <label className="form-label">Регион</label>
            <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS_SORTED.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* KPI */}
        <div className="dash-kpis" style={{ marginBottom: 12 }}>
          <div className="dash-kpi"><div className="dash-kpi__icon">📋</div><div className="dash-kpi__body"><div className="dash-kpi__value">{positions.filter((p) => p.name.trim()).length}</div><div className="dash-kpi__label">Позиций</div></div></div>
          <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(grandTotal)}</div><div className="dash-kpi__label">Общая сумма</div></div></div>
        </div>

        {/* Кнопки над таблицей */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={addRow}>+ Добавить позицию</button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={openRatesModal}>Из расценок</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleAddToRates} disabled={addingToRates}>
              {addingToRates ? 'Добавление...' : 'Добавить в расценки'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleDownload}>Скачать смету</button>
          </div>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Создать смету'}
          </button>
        </div>

        {/* Таблица позиций */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 380px)', border: '1px solid #d0d5dd', borderRadius: 6 }}>
          <table className="mc-sheet">
            <thead>
              <tr>
                <th className="c-num">№</th>
                <th className="c-name">Наименование работ и затрат</th>
                <th className="c-unit">Ед.</th>
                <th className="c-vol">Кол-во</th>
                <th className="c-price">Цена, ₽</th>
                <th className="c-total">Всего, ₽</th>
                <th className="c-oh">НР, ₽</th>
                <th className="c-pr">СП, ₽</th>
                <th className="mc-del"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, index) => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center', padding: '0 4px', fontSize: 12, color: '#64748b' }}>{p.num}</td>
                  <td className="mc-name">
                    <textarea
                      rows={1}
                      value={p.name}
                      onChange={(e) => update(index, 'name', e.target.value)}
                      placeholder="Наименование работы"
                      onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                    />
                  </td>
                  <td><input value={p.unit} onChange={(e) => update(index, 'unit', e.target.value)} placeholder="м³" /></td>
                  <td><input type="number" value={p.volume || ''} onChange={(e) => update(index, 'volume', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td><input type="number" value={p.price || ''} onChange={(e) => update(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td><input type="number" value={p.total || ''} onChange={(e) => update(index, 'total', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td><input type="number" value={p.overhead || ''} onChange={(e) => update(index, 'overhead', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td><input type="number" value={p.profit || ''} onChange={(e) => update(index, 'profit', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td className="mc-del" onClick={() => deleteRow(index)} title="Удалить">✕</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign: 'right', paddingRight: 8 }}>ИТОГО</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(totalSum)}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(totalOverhead)}</td>
                <td style={{ textAlign: 'right' }}>{formatMoney(totalProfit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </form>

      {/* Модальное окно: выбор из расценок */}
      {ratesModalOpen && (
        <div
          onClick={() => setRatesModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Добавить из расценок</h3>
              <button type="button" onClick={() => setRatesModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px 8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Поиск по наименованию или ед. изм..."
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                autoFocus
                style={{ fontSize: 14 }}
              />
            </div>
            <div style={{ padding: '0 24px 20px', overflowY: 'auto', flex: 1 }}>
              {filteredRates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                  <p style={{ margin: 0, fontSize: 14 }}>Нет расценок. Создайте в разделе «Расценки».</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredRates.map((wt) => (
                    <div
                      key={wt.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fafbfc', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fafbfc')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{wt.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{wt.unit}{wt.category ? ` · ${wt.category}` : ''}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', color: '#1e293b', minWidth: 80, textAlign: 'right' }}>{formatMoney(wt.rate)}</div>
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => addFromRate(wt)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>+ Добавить</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
