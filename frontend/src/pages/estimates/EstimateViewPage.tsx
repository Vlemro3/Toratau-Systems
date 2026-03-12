import { useState, useEffect, useCallback, useMemo, type SetStateAction } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEstimate, generateLSR, runCompare, updateEstimateLSR,
  updateEstimatePositions, updateEstimateCompare, normalizeCompareResult,
  downloadEstimatePositions, downloadLSRWithResult, downloadCompare,
  STATUS_LABELS, STATUS_COLORS,
} from '../../api/estimates';
import type { Estimate, EstimatePosition, LSRPosition, LSRResult, CompareRow } from '../../api/estimates';
import { getWorkTypes, createWorkType } from '../../api/workTypes';
import type { WorkType, WorkTypeCreate } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₽';
}

type Tab = 'positions' | 'lsr' | 'compare';

export function EstimateViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const estId = Number(id);

  const [est, setEst] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [tab, setTab] = useState<Tab>('positions');
  const [savingLSR, setSavingLSR] = useState(false);
  /** Текущие позиции ЛСР (при редактировании в таблице); при скачивании берём отсюда */
  const [lsrPositions, setLsrPositions] = useState<LSRPosition[] | null>(null);
  /** Редактируемые позиции сметы (вкладка Позиции) */
  const [editPositions, setEditPositions] = useState<EstimatePosition[]>([]);
  const [positionsDirty, setPositionsDirty] = useState(false);
  const [savingPositions, setSavingPositions] = useState(false);
  /** Редактируемые строки сравнения (вкладка Сравнение) */
  const [editCompareRows, setEditCompareRows] = useState<CompareRow[]>([]);
  const [compareDirty, setCompareDirty] = useState(false);
  const [savingCompare, setSavingCompare] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getEstimate(estId).then(setEst).finally(() => setLoading(false));
  }, [estId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (est?.lsr) setLsrPositions(est.lsr.positions.map((p) => ({ ...p })));
    else setLsrPositions(null);
  }, [est?.id, est?.lsr]);

  useEffect(() => {
    if (est && !positionsDirty) setEditPositions(est.positions.map((p) => ({ ...p })));
  }, [est?.id, est?.positions, positionsDirty]);

  useEffect(() => {
    if (est?.compare && !compareDirty) setEditCompareRows(est.compare.rows.map((r) => ({ ...r })));
  }, [est?.id, est?.compare, compareDirty]);

  /** Обёртка для LSRTab: он ожидает setter для LSRPosition[], у нас — LSRPosition[] | null */
  const setLsrPositionsForTab = useCallback((action: SetStateAction<LSRPosition[]>) => {
    setLsrPositions((prev) => (typeof action === 'function' ? action(prev ?? []) : action));
  }, []);

  const handleLSR = async () => {
    setProcessing('Формируем ЛСР...');
    await generateLSR(estId);
    await load();
    setProcessing('');
    setTab('lsr');
  };

  const handleCompare = async () => {
    setProcessing('Сравниваем...');
    await runCompare(estId);
    await load();
    setProcessing('');
    setTab('compare');
  };


  const handleSaveLSR = async () => {
    if (!est?.lsr) return;
    const positions = lsrPositions ?? est.lsr.positions;
    setSavingLSR(true);
    try {
      const result: LSRResult = {
        positions,
        totalMaterials: positions.reduce((s, p) => s + p.materials, 0),
        totalLabor: positions.reduce((s, p) => s + p.labor, 0),
        totalMachines: positions.reduce((s, p) => s + p.machines, 0),
        totalDirect: positions.reduce((s, p) => s + p.directCost, 0),
        totalOverhead: positions.reduce((s, p) => s + p.overhead, 0),
        totalProfit: positions.reduce((s, p) => s + p.profit, 0),
        grandTotal: positions.reduce((s, p) => s + p.total, 0),
      };
      await updateEstimateLSR(estId, result);
      await load();
    } finally {
      setSavingLSR(false);
    }
  };

  const lsrDirty = useMemo(() => {
    if (!est?.lsr || !lsrPositions) return false;
    return JSON.stringify(lsrPositions) !== JSON.stringify(est.lsr.positions);
  }, [est?.lsr, lsrPositions]);

  const handleSavePositions = async () => {
    setSavingPositions(true);
    try {
      await updateEstimatePositions(estId, editPositions);
      setPositionsDirty(false);
      await load();
    } finally {
      setSavingPositions(false);
    }
  };

  const handleSaveCompare = async () => {
    const normalized = normalizeCompareResult({
      rows: editCompareRows,
      totalCustomer: 0,
      totalOur: 0,
      totalDiff: 0,
      marginality: 0,
      possibleProfit: 0,
    });
    setSavingCompare(true);
    try {
      await updateEstimateCompare(estId, normalized);
      setCompareDirty(false);
      await load();
    } finally {
      setSavingCompare(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!est) return <div className="page"><p className="text-muted">Смета не найдена</p></div>;

  const totalSum = est.positions.reduce((s, p) => s + p.total + p.overhead + p.profit, 0);

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'positions', label: 'Позиции' },
    { key: 'lsr', label: 'ЛСР', disabled: !est.lsr },
    { key: 'compare', label: 'Сравнение', disabled: !est.compare },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/estimates')}>← К списку смет</button>
          <h2 className="page__title" style={{ marginTop: 8 }}>{est.name}</h2>
          <p className="text-muted">
            {est.region} · {est.baseType} · {est.fileName}{' '}
            <StatusBadge label={STATUS_LABELS[est.status]} color={STATUS_COLORS[est.status]} />
          </p>
        </div>
      </div>

      {processing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
          <LoadingSpinner />
          <span>{processing}</span>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="dash-quick-actions" style={{ marginBottom: 16 }}>
        <button className="btn btn--primary btn--sm" onClick={handleLSR} disabled={!!processing}>
          Сформировать ЛСР
        </button>
        <button className="btn btn--primary btn--sm" onClick={handleCompare} disabled={!!processing || !est.lsr}>
          Сравнить
        </button>
        <button className="btn btn--secondary btn--sm" onClick={() => downloadEstimatePositions(est)} title="Скачать исходный файл сметы">
          Скачать смету
        </button>
        <button
          className="btn btn--secondary btn--sm"
          title={est.lsr ? 'Скачать ЛСР' : 'Сначала сформируйте ЛСР'}
          disabled={!est.lsr}
          onClick={() => {
            if (!est.lsr) return;
            const positions = lsrPositions ?? est.lsr!.positions;
            const result: LSRResult = {
              positions,
              totalMaterials: positions.reduce((s, p) => s + p.materials, 0),
              totalLabor: positions.reduce((s, p) => s + p.labor, 0),
              totalMachines: positions.reduce((s, p) => s + p.machines, 0),
              totalDirect: positions.reduce((s, p) => s + p.directCost, 0),
              totalOverhead: positions.reduce((s, p) => s + p.overhead, 0),
              totalProfit: positions.reduce((s, p) => s + p.profit, 0),
              grandTotal: positions.reduce((s, p) => s + p.total, 0),
            };
            downloadLSRWithResult(est, result);
          }}
        >
          Скачать ЛСР
        </button>
        {est.compare && (
          <button className="btn btn--secondary btn--sm" onClick={() => downloadCompare(est)}>Скачать сравнение</button>
        )}
      </div>

      {/* Вкладки */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'tab--active' : ''}`}
            disabled={t.disabled}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент вкладок */}
      {tab === 'positions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                const nextId = editPositions.length ? Math.max(...editPositions.map((p) => p.id)) + 1 : 1;
                setEditPositions((prev) => [...prev, { id: nextId, num: String(prev.length + 1), normCode: '', name: '', unit: '', volume: 0, price: 0, total: 0, overhead: 0, profit: 0 }]);
                setPositionsDirty(true);
              }}
            >
              + Добавить позицию
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={handleSavePositions} disabled={!positionsDirty || savingPositions}>
              {savingPositions ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          <PositionsTab
            positions={editPositions}
            setPositions={setEditPositions}
            setDirty={setPositionsDirty}
            totalSum={editPositions.reduce((s, p) => s + p.total + p.overhead + p.profit, 0)}
          />
        </>
      )}
      {tab === 'lsr' && est.lsr && (
        <>
          <LSRTab
            positions={lsrPositions ?? est.lsr.positions}
            setPositions={setLsrPositionsForTab}
            saveButton={
              <button type="button" className="btn btn--primary btn--sm" onClick={handleSaveLSR} disabled={!lsrDirty || savingLSR}>
                {savingLSR ? 'Сохранение...' : 'Сохранить'}
              </button>
            }
          />
        </>
      )}
      {tab === 'compare' && est.compare && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setEditCompareRows((prev) => [...prev, { num: String(prev.length + 1), name: '', customerSum: 0, ourSum: 0, diffRub: 0, diffPct: 0 }]);
                setCompareDirty(true);
              }}
            >
              + Добавить позицию
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={handleSaveCompare} disabled={!compareDirty || savingCompare}>
              {savingCompare ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          <CompareTab
            rows={editCompareRows}
            setRows={setEditCompareRows}
            setDirty={setCompareDirty}
            totalCustomer={editCompareRows.reduce((s, r) => s + r.customerSum, 0)}
            totalOur={editCompareRows.reduce((s, r) => s + r.ourSum, 0)}
          />
        </>
      )}
    </div>
  );
}

/* ==== Вкладка «Позиции» (редактируемая, компактная spreadsheet-таблица) ==== */

const spreadsheetStyles = `
.est-sheet { border-collapse: collapse; width: 100%; font-size: 12px; table-layout: fixed; }
.est-sheet th, .est-sheet td { border: 1px solid #d0d5dd; padding: 0; height: 28px; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.est-sheet td.col-name-cell { white-space: normal; overflow: visible; height: auto; min-height: 28px; vertical-align: top; }
.est-sheet td.col-name-cell textarea { width: 100%; border: none; outline: none; background: transparent; padding: 4px 6px; font-size: 12px; font-family: inherit; box-sizing: border-box; resize: none; overflow: hidden; line-height: 1.4; min-height: 28px; }
.est-sheet td.col-name-cell textarea:focus { background: #eff6ff; }
.est-sheet tbody tr:hover td.col-name-cell textarea { background: #f8fafc; }
.est-sheet tbody tr:hover td.col-name-cell textarea:focus { background: #eff6ff; }
.est-sheet th { background: #f2f4f7; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.02em; padding: 4px 6px; text-align: center; position: sticky; top: 0; z-index: 2; }
.est-sheet td input { width: 100%; height: 100%; border: none; outline: none; background: transparent; padding: 2px 6px; font-size: 12px; font-family: inherit; box-sizing: border-box; }
.est-sheet td input:focus { background: #eff6ff; }
.est-sheet td input[type="number"] { text-align: right; -moz-appearance: textfield; }
.est-sheet td input[type="number"]::-webkit-inner-spin-button,
.est-sheet td input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.est-sheet td.est-del { text-align: center; cursor: pointer; color: #94a3b8; width: 28px; padding: 0; }
.est-sheet td.est-del:hover { color: #dc2626; background: #fef2f2; }
.est-sheet tbody tr:hover td { background: #f8fafc; }
.est-sheet tbody tr:hover td input { background: #f8fafc; }
.est-sheet tbody tr:hover td input:focus { background: #eff6ff; }
.est-sheet tfoot td { background: #f2f4f7; font-weight: 700; padding: 4px 6px; font-size: 12px; }
.est-sheet .col-num { width: 40px; }
.est-sheet .col-code { width: 160px; }
.est-sheet .col-name { width: auto; min-width: 200px; }
.est-sheet .col-unit { width: 55px; }
.est-sheet .col-vol { width: 70px; }
.est-sheet .col-price { width: 80px; }
.est-sheet .col-coeff { width: 65px; }
.est-sheet .col-total { width: 90px; }
.est-sheet .col-labor { width: 65px; }
.est-sheet .col-cost { width: 75px; }
`;

function PositionsTab({
  positions,
  setPositions,
  setDirty,
  totalSum,
}: {
  positions: EstimatePosition[];
  setPositions: React.Dispatch<React.SetStateAction<EstimatePosition[]>>;
  setDirty: (d: boolean) => void;
  totalSum: number;
}) {
  const update = useCallback(
    (index: number, field: keyof EstimatePosition, value: string | number) => {
      setPositions((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
      setDirty(true);
    },
    [setPositions, setDirty]
  );

  const deleteRow = useCallback(
    (index: number) => {
      if (!confirm('Удалить позицию?')) return;
      setPositions((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, num: String(i + 1) })));
      setDirty(true);
    },
    [setPositions, setDirty]
  );

  return (
    <div>
      <style>{spreadsheetStyles}</style>
      <div className="dash-kpis" style={{ marginBottom: 12 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">📋</div><div className="dash-kpi__body"><div className="dash-kpi__value">{positions.length}</div><div className="dash-kpi__label">Позиций</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totalSum)}</div><div className="dash-kpi__label">Общая сумма</div></div></div>
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)', border: '1px solid #d0d5dd', borderRadius: 6 }}>
        <table className="est-sheet">
          <thead>
            <tr>
              <th className="col-num">№</th>
              <th className="col-code">Шифр / Код</th>
              <th className="col-name">Наименование работ и затрат</th>
              <th className="col-unit">Ед.</th>
              <th className="col-vol">Кол-во</th>
              <th className="col-price">Цена, ₽</th>
              <th className="col-coeff">Попр. К</th>
              <th className="col-coeff">Пересч.</th>
              <th className="col-total">Всего, ₽</th>
              <th className="col-labor">ЗТР</th>
              <th className="col-cost">Ст. ед.</th>
              <th className="est-del"></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, index) => (
              <tr key={p.id}>
                <td><input value={p.num} onChange={(e) => update(index, 'num', e.target.value)} /></td>
                <td><input value={p.normCode} onChange={(e) => update(index, 'normCode', e.target.value)} /></td>
                <td className="col-name-cell"><textarea rows={1} value={p.name} onChange={(e) => update(index, 'name', e.target.value)} onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} /></td>
                <td><input value={p.unit} onChange={(e) => update(index, 'unit', e.target.value)} /></td>
                <td><input type="number" value={p.volume || ''} onChange={(e) => update(index, 'volume', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input type="number" value={p.price || ''} onChange={(e) => update(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input value={p.adjustmentCoeff ?? ''} onChange={(e) => update(index, 'adjustmentCoeff', e.target.value)} /></td>
                <td><input value={p.recalcCoeffNumber ?? ''} onChange={(e) => update(index, 'recalcCoeffNumber', e.target.value)} /></td>
                <td><input type="number" value={p.total || ''} onChange={(e) => update(index, 'total', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input type="number" value={(p.laborPersonHours ?? 0) || ''} onChange={(e) => update(index, 'laborPersonHours', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input type="number" value={(p.costPerUnitFromStart ?? 0) || ''} onChange={(e) => update(index, 'costPerUnitFromStart', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td className="est-del" onClick={() => deleteRow(index)} title="Удалить">✕</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} style={{ textAlign: 'right', paddingRight: 8 }}>ИТОГО</td>
              <td style={{ textAlign: 'right' }}>{formatMoney(positions.reduce((s, p) => s + p.total, 0))}</td>
              <td style={{ textAlign: 'right' }}>{positions.reduce((s, p) => s + (p.laborPersonHours ?? 0), 0).toLocaleString('ru-RU')}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* Пересчёт строки ЛСР: прямые = материалы + труд + машины, итого = прямые + НР + СП */
function recalcLSRRow(p: LSRPosition): LSRPosition {
  const directCost = p.materials + p.labor + p.machines;
  const total = directCost + p.overhead + p.profit;
  return { ...p, directCost, total };
}

/** Создать позицию ЛСР из расценки (WorkType) */
function lsrPositionFromWorkType(wt: WorkType, volume = 1, nextId: number): LSRPosition {
  const direct = Math.round(wt.rate * volume);
  const materials = Math.round(direct * 0.55);
  const labor = Math.round(direct * 0.3);
  const machines = direct - materials - labor;
  const overhead = Math.round(direct * 0.1);
  const profit = Math.round(direct * 0.08);
  const total = direct + overhead + profit;
  return {
    id: nextId,
    num: '',
    name: wt.name,
    unit: wt.unit,
    volume,
    materials,
    labor,
    machines,
    directCost: direct,
    overhead,
    profit,
    total,
  };
}

/** Перенумеровать позиции после перестановки/удаления/добавления */
function renumberPositions(positions: LSRPosition[]): LSRPosition[] {
  return positions.map((p, i) => ({ ...p, num: String(i + 1) }));
}

/* ==== Вкладка «ЛСР» (редактирование наименования, перестановка, удаление, добавление из расценок) ==== */
function LSRTab({
  positions,
  setPositions,
  saveButton,
}: {
  positions: LSRPosition[];
  setPositions: React.Dispatch<React.SetStateAction<LSRPosition[]>>;
  saveButton?: React.ReactNode;
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'from_rates' | 'new_rate'>('from_rates');
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [rateSearch, setRateSearch] = useState('');
  const [newRateForm, setNewRateForm] = useState<WorkTypeCreate>({ name: '', unit: 'м²', rate: 0, category: '', is_active: true });
  const [savingRate, setSavingRate] = useState(false);
  const [addingToRates, setAddingToRates] = useState(false);

  const totals = useMemo(() => ({
    totalMaterials: positions.reduce((s, p) => s + p.materials, 0),
    totalLabor: positions.reduce((s, p) => s + p.labor, 0),
    totalMachines: positions.reduce((s, p) => s + p.machines, 0),
    totalDirect: positions.reduce((s, p) => s + p.directCost, 0),
    totalOverhead: positions.reduce((s, p) => s + p.overhead, 0),
    totalProfit: positions.reduce((s, p) => s + p.profit, 0),
    grandTotal: positions.reduce((s, p) => s + p.total, 0),
  }), [positions]);

  const updateCell = useCallback((index: number, field: keyof LSRPosition, value: number) => {
    setPositions((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      next[index] = recalcLSRRow(next[index]);
      return next;
    });
  }, [setPositions]);

  const updateName = useCallback((index: number, value: string) => {
    setPositions((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  }, [setPositions]);

  const moveRow = useCallback((index: number, dir: -1 | 1) => {
    setPositions((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return renumberPositions(next);
    });
  }, [setPositions]);

  const deleteRow = useCallback((index: number) => {
    if (!confirm('Удалить позицию из ЛСР?')) return;
    setPositions((prev) => renumberPositions(prev.filter((_, i) => i !== index)));
  }, [setPositions]);

  const addPositionFromRate = useCallback((wt: WorkType, volume = 1) => {
    const nextId = Math.max(0, ...positions.map((p) => p.id)) + 1;
    const newRow = lsrPositionFromWorkType(wt, volume, nextId);
    setPositions((prev) => renumberPositions([...prev, newRow]));
    setAddModalOpen(false);
  }, [positions, setPositions]);

  const openAddModal = useCallback(() => {
    setAddModalOpen(true);
    setAddMode('from_rates');
    setRateSearch('');
    setNewRateForm({ name: '', unit: 'м²', rate: 0, category: '', is_active: true });
    getWorkTypes().then((list) => setWorkTypes(list.filter((w) => w.is_active))).catch(() => setWorkTypes([]));
  }, []);

  const handleCreateRateAndAdd = useCallback(async () => {
    if (!newRateForm.name.trim() || newRateForm.rate <= 0) {
      alert('Заполните наименование и расценку');
      return;
    }
    setSavingRate(true);
    try {
      const wt = await createWorkType(newRateForm);
      addPositionFromRate(wt);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка создания расценки');
    } finally {
      setSavingRate(false);
    }
  }, [newRateForm, addPositionFromRate]);

  const handleAddToRates = useCallback(async () => {
    const filled = positions.filter((p) => p.name.trim() && p.total > 0);
    if (!filled.length) {
      alert('Нет заполненных позиций для добавления в расценки');
      return;
    }
    setAddingToRates(true);
    try {
      const existingRates = await getWorkTypes();
      const existingSet = new Set(existingRates.map((w) => `${w.name.trim().toLowerCase()}|${(w.unit || '').trim().toLowerCase()}`));
      const toCreate = filled.filter((p) => !existingSet.has(`${p.name.trim().toLowerCase()}|${(p.unit || 'шт').trim().toLowerCase()}`));
      const skipped = filled.length - toCreate.length;
      if (!toCreate.length) {
        alert(`Все ${filled.length} позиций уже есть в расценках`);
        return;
      }
      const msg = skipped > 0
        ? `Добавить ${toCreate.length} новых расценок? (${skipped} уже существуют и будут пропущены)`
        : `Добавить ${toCreate.length} позиций в расценки?`;
      if (!confirm(msg)) return;
      let created = 0;
      for (const p of toCreate) {
        await createWorkType({
          name: p.name,
          unit: p.unit || 'шт',
          rate: p.volume ? Math.round(p.total / p.volume * 100) / 100 : p.total,
          category: 'Из ЛСР',
          is_active: true,
        });
        created++;
      }
      alert(skipped > 0
        ? `Добавлено ${created} расценок, ${skipped} пропущено (уже существуют)`
        : `Добавлено ${created} расценок`);
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    } finally {
      setAddingToRates(false);
    }
  }, [positions]);

  const filteredRates = useMemo(() => {
    if (!rateSearch.trim()) return workTypes;
    const q = rateSearch.toLowerCase();
    return workTypes.filter((w) => w.name.toLowerCase().includes(q) || (w.unit && w.unit.toLowerCase().includes(q)));
  }, [workTypes, rateSearch]);

  return (
    <div>
      <style>{spreadsheetStyles}{`
.est-sheet .col-lsr-num { width: 36px; }
.est-sheet .col-lsr-name { width: auto; min-width: 180px; }
.est-sheet .col-lsr-unit { width: 50px; }
.est-sheet .col-lsr-n { width: 75px; }
.est-sheet .col-lsr-ro { width: 70px; text-align: right; }
.est-sheet .col-lsr-act { width: 68px; }
.est-sheet td.est-lsr-actions { text-align: center; padding: 0 2px; white-space: nowrap; }
.est-sheet td.est-lsr-actions button { background: none; border: none; cursor: pointer; padding: 0 2px; font-size: 12px; color: #94a3b8; line-height: 1; }
.est-sheet td.est-lsr-actions button:hover { color: #3b82f6; }
.est-sheet td.est-lsr-actions button.del:hover { color: #dc2626; }
.est-sheet td.est-lsr-ro { text-align: right; padding: 0 6px; font-size: 12px; font-weight: 600; }
      `}</style>
      <div className="dash-kpis" style={{ marginBottom: 12 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">🧱</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalMaterials)}</div><div className="dash-kpi__label">Материалы</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">👷</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalLabor)}</div><div className="dash-kpi__label">Труд</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">🚜</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalMachines)}</div><div className="dash-kpi__label">Машины</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.grandTotal)}</div><div className="dash-kpi__label">Итого ЛСР</div></div></div>
      </div>

      <div className="tab-header" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={openAddModal}>+ Добавить позицию</button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleAddToRates} disabled={addingToRates}>
            {addingToRates ? 'Добавление...' : 'Добавить в расценки'}
          </button>
        </div>
        {saveButton}
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)', border: '1px solid #d0d5dd', borderRadius: 6 }}>
        <table className="est-sheet">
          <thead>
            <tr>
              <th className="col-lsr-num">№</th>
              <th className="col-lsr-name">Наименование</th>
              <th className="col-lsr-unit">Ед.</th>
              <th className="col-lsr-n">Объём</th>
              <th className="col-lsr-n">Матер.</th>
              <th className="col-lsr-n">Труд</th>
              <th className="col-lsr-n">Маш.</th>
              <th className="col-lsr-ro">Прямые</th>
              <th className="col-lsr-n">НР</th>
              <th className="col-lsr-n">СП</th>
              <th className="col-lsr-ro">Итого</th>
              <th className="col-lsr-act"></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, index) => (
              <tr key={p.id}>
                <td style={{ textAlign: 'center', padding: '0 4px', fontSize: 12 }}>{p.num}</td>
                <td className="col-name-cell"><textarea rows={1} value={p.name} onChange={(e) => updateName(index, e.target.value)} onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} /></td>
                <td><input value={p.unit} readOnly style={{ textAlign: 'center' }} /></td>
                <td><input type="number" value={p.volume === 0 ? '' : p.volume} onChange={(e) => updateCell(index, 'volume', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input type="number" value={p.materials === 0 ? '' : p.materials} onChange={(e) => updateCell(index, 'materials', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} /></td>
                <td><input type="number" value={p.labor === 0 ? '' : p.labor} onChange={(e) => updateCell(index, 'labor', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} /></td>
                <td><input type="number" value={p.machines === 0 ? '' : p.machines} onChange={(e) => updateCell(index, 'machines', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} /></td>
                <td className="est-lsr-ro">{formatMoney(p.directCost)}</td>
                <td><input type="number" value={p.overhead === 0 ? '' : p.overhead} onChange={(e) => updateCell(index, 'overhead', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} /></td>
                <td><input type="number" value={p.profit === 0 ? '' : p.profit} onChange={(e) => updateCell(index, 'profit', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} /></td>
                <td className="est-lsr-ro">{formatMoney(p.total)}</td>
                <td className="est-lsr-actions">
                  <button type="button" title="Вверх" onClick={() => moveRow(index, -1)} disabled={index === 0}>▲</button>
                  <button type="button" title="Вниз" onClick={() => moveRow(index, 1)} disabled={index === positions.length - 1}>▼</button>
                  <button type="button" className="del" title="Удалить" onClick={() => deleteRow(index)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', paddingRight: 8 }}>ИТОГО</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalMaterials)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalLabor)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalMachines)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalDirect)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalOverhead)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.totalProfit)}</td>
              <td style={{ textAlign: 'right', padding: '0 6px' }}>{formatMoney(totals.grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Модальное окно: добавить позицию из расценок или создать новую расценку */}
      {addModalOpen && (
        <div
          onClick={() => setAddModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Добавить позицию</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '12px 24px 0' }}>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button type="button" className={`tab ${addMode === 'from_rates' ? 'tab--active' : ''}`} onClick={() => setAddMode('from_rates')}>Из расценок</button>
                <button type="button" className={`tab ${addMode === 'new_rate' ? 'tab--active' : ''}`} onClick={() => setAddMode('new_rate')}>Новая расценка</button>
              </div>
            </div>

            <div style={{ padding: '16px 24px 20px', overflowY: 'auto', flex: 1 }}>
              {addMode === 'from_rates' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <input type="text" className="input" placeholder="Поиск по наименованию или ед. изм..." value={rateSearch} onChange={(e) => setRateSearch(e.target.value)} autoFocus style={{ fontSize: 14 }} />
                  </div>
                  {filteredRates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                      <p style={{ margin: 0, fontSize: 14 }}>Нет расценок. Создайте новую во вкладке «Новая расценка».</p>
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
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => addPositionFromRate(wt)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>+ Добавить</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {addMode === 'new_rate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Наименование *</label>
                    <input type="text" className="input" value={newRateForm.name} onChange={(e) => setNewRateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Вид работ" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Единица измерения *</label>
                      <input type="text" className="input" value={newRateForm.unit} onChange={(e) => setNewRateForm((f) => ({ ...f, unit: e.target.value }))} placeholder="м², м³, шт." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Расценка (₽) *</label>
                      <input type="number" className="input" min={0} step={0.01} value={newRateForm.rate === 0 ? '' : newRateForm.rate} onChange={(e) => setNewRateForm((f) => ({ ...f, rate: e.target.value === '' ? 0 : Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Категория</label>
                    <input type="text" className="input" value={newRateForm.category || ''} onChange={(e) => setNewRateForm((f) => ({ ...f, category: e.target.value }))} placeholder="Опционально" />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8125rem', margin: 0 }}>Расценка будет создана в справочнике и добавлена в ЛСР с объёмом 1.</p>
                  <button type="button" className="btn btn--primary" onClick={handleCreateRateAndAdd} disabled={savingRate}>
                    {savingRate ? 'Создание...' : 'Создать расценку и добавить в ЛСР'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==== Вкладка «Сравнение» (редактируемая) ==== */
const compareInputStyle = { width: 100, padding: '4px 6px', fontSize: '0.8125rem' };

function CompareTab({
  rows,
  setRows,
  setDirty,
  totalCustomer,
  totalOur,
}: {
  rows: CompareRow[];
  setRows: React.Dispatch<React.SetStateAction<CompareRow[]>>;
  setDirty: (d: boolean) => void;
  totalCustomer: number;
  totalOur: number;
}) {
  const totalDiff = totalCustomer - totalOur;
  const possibleProfit = totalDiff;
  const totalDiffPct = totalCustomer > 0 ? Math.round((totalDiff / totalCustomer) * 100) : 0;
  const marginality = totalDiffPct;

  const updateRow = useCallback(
    (index: number, field: 'customerSum' | 'ourSum' | 'name' | 'num', value: number | string) => {
      setRows((prev) =>
        prev.map((r, i) => {
          if (i !== index) return r;
          const row = { ...r, [field]: value };
          const cust = typeof row.customerSum === 'number' ? row.customerSum : 0;
          const our = typeof row.ourSum === 'number' ? row.ourSum : 0;
          return { ...row, diffRub: cust - our, diffPct: cust > 0 ? Math.round(((cust - our) / cust) * 100) : 0 };
        })
      );
      setDirty(true);
    },
    [setRows, setDirty]
  );

  const deleteRow = useCallback(
    (index: number) => {
      if (!confirm('Удалить позицию из сравнения?')) return;
      setRows((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, num: String(i + 1) })));
      setDirty(true);
    },
    [setRows, setDirty]
  );

  return (
    <div>
      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">📄</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totalCustomer)}</div><div className="dash-kpi__label">Смета заказчика</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">📐</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totalOur)}</div><div className="dash-kpi__label">Наш ЛСР</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">📊</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totalDiff)}</div><div className="dash-kpi__label">Общая разница</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">💹</div><div className="dash-kpi__body"><div className="dash-kpi__value">{marginality}%</div><div className="dash-kpi__label">Маржинальность</div></div></div>
      </div>
      <div className="dash-cols" style={{ marginBottom: 20 }}>
        <div className="dash-card">
          <h3 className="dash-card__title">Итоги сравнения</h3>
          <div style={{ fontSize: '0.875rem' }}>
            <div className="summary-row"><span className="summary-row__label">Возможная прибыль</span><span className={`summary-row__value text-bold ${possibleProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(possibleProfit)}</span></div>
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>№</th>
              <th>Позиция</th>
              <th className="text-right">Смета заказчика</th>
              <th className="text-right">Наш ЛСР</th>
              <th className="text-right">Разница ₽</th>
              <th className="text-right">Разница %</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const diffRub = row.customerSum - row.ourSum;
              const diffPct = row.customerSum > 0 ? Math.round((diffRub / row.customerSum) * 100) : 0;
              return (
                <tr key={`${row.num}-${index}`}>
                  <td><input className="input" style={compareInputStyle} value={row.num} onChange={(e) => updateRow(index, 'num', e.target.value)} /></td>
                  <td><input className="input" style={{ ...compareInputStyle, minWidth: 180 }} value={row.name} onChange={(e) => updateRow(index, 'name', e.target.value)} /></td>
                  <td className="text-right"><input type="number" className="input text-right" style={compareInputStyle} value={row.customerSum || ''} onChange={(e) => updateRow(index, 'customerSum', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td className="text-right"><input type="number" className="input text-right" style={compareInputStyle} value={row.ourSum || ''} onChange={(e) => updateRow(index, 'ourSum', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                  <td className={`text-right text-bold ${diffRub > 0 ? 'text-success' : diffRub < 0 ? 'text-danger' : ''}`}>{diffRub >= 0 ? '+' : ''}{formatMoney(diffRub)}</td>
                  <td className={`text-right ${diffPct > 0 ? 'text-success' : diffPct < 0 ? 'text-danger' : ''}`}>{diffPct >= 0 ? '+' : ''}{diffPct}%</td>
                  <td><button type="button" className="table-action table-action--delete" title="Удалить" onClick={() => deleteRow(index)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={2}>ИТОГО</td>
              <td className="text-right">{formatMoney(totalCustomer)}</td>
              <td className="text-right">{formatMoney(totalOur)}</td>
              <td className={`text-right ${totalDiff > 0 ? 'text-success' : 'text-danger'}`}>{totalDiff >= 0 ? '+' : ''}{formatMoney(totalDiff)}</td>
              <td className={`text-right ${totalDiffPct > 0 ? 'text-success' : totalDiffPct < 0 ? 'text-danger' : ''}`}>{totalDiffPct >= 0 ? '+' : ''}{totalDiffPct}%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
