import { useState, useEffect, useCallback, useMemo, type SetStateAction } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEstimate, runCheck, generateLSR, runCompare, setStrategy, updateEstimateLSR,
  updateEstimatePositions, updateEstimateCompare, normalizeCompareResult,
  downloadEstimatePositions, downloadLSRWithResult, downloadCompare,
  STATUS_LABELS, STATUS_COLORS, STRATEGY_LABELS,
} from '../../api/estimates';
import type { Estimate, EstimatePosition, CalcStrategy, LSRPosition, LSRResult, CompareRow } from '../../api/estimates';
import { getWorkTypes, createWorkType } from '../../api/workTypes';
import type { WorkType, WorkTypeCreate } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₽';
}

type Tab = 'positions' | 'check' | 'lsr' | 'compare';

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

  const handleCheck = async () => {
    setProcessing('Проверяем расчёт...');
    await runCheck(estId);
    await load();
    setProcessing('');
    setTab('check');
  };

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

  const handleStrategy = async (s: CalcStrategy) => {
    await setStrategy(estId, s);
    load();
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
    { key: 'check', label: 'Проверка', disabled: !est.checkResult },
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
        <button className="btn btn--primary btn--sm" onClick={handleCheck} disabled={!!processing}>
          Проверить расчёт
        </button>
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
        {isAdmin && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Стратегия:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.875rem' }}
              value={est.strategy}
              onChange={(e) => handleStrategy(e.target.value as CalcStrategy)}
            >
              {(Object.entries(STRATEGY_LABELS) as [CalcStrategy, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
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
      {tab === 'check' && est.checkResult && <CheckTab est={est} />}
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

/* ==== Вкладка «Позиции» (редактируемая) ==== */
const posInputStyle = { width: '100%', minWidth: 60, padding: '4px 6px', fontSize: '0.8125rem' };

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
      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">📋</div><div className="dash-kpi__body"><div className="dash-kpi__value">{positions.length}</div><div className="dash-kpi__label">Позиций</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totalSum)}</div><div className="dash-kpi__label">Общая сумма</div></div></div>
      </div>
      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>№пп</th>
              <th>Шифр, номера нормативов и коды ресурсов</th>
              <th>Наименование работ и затрат</th>
              <th>Ед. изм.</th>
              <th className="text-right">Кол-во единиц</th>
              <th className="text-right">Цена на единицу измерения, руб.</th>
              <th>Поправочные коэффициенты</th>
              <th>Коэффициенты пересчета, номер</th>
              <th className="text-right">ВСЕГО затрат, руб.</th>
              <th colSpan={2}>Справ.</th>
              <th style={{ width: 60 }}></th>
            </tr>
            <tr>
              <th colSpan={9} style={{ borderTop: 'none' }} />
              <th className="text-right" style={{ fontSize: '0.8rem', fontWeight: 600 }}>ЗТР, всего чел-ч</th>
              <th className="text-right" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Стоим. ед. с нач., руб.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {positions.map((p, index) => (
              <tr key={p.id}>
                <td><input className="input" style={posInputStyle} value={p.num} onChange={(e) => update(index, 'num', e.target.value)} /></td>
                <td><input className="input" style={posInputStyle} value={p.normCode} onChange={(e) => update(index, 'normCode', e.target.value)} /></td>
                <td><input className="input" style={{ ...posInputStyle, minWidth: 200 }} value={p.name} onChange={(e) => update(index, 'name', e.target.value)} /></td>
                <td><input className="input" style={posInputStyle} value={p.unit} onChange={(e) => update(index, 'unit', e.target.value)} /></td>
                <td className="text-right"><input type="number" className="input text-right" style={posInputStyle} value={p.volume || ''} onChange={(e) => update(index, 'volume', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td className="text-right"><input type="number" className="input text-right" style={posInputStyle} value={p.price || ''} onChange={(e) => update(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><input className="input" style={posInputStyle} value={p.adjustmentCoeff ?? ''} onChange={(e) => update(index, 'adjustmentCoeff', e.target.value)} /></td>
                <td><input className="input" style={posInputStyle} value={p.recalcCoeffNumber ?? ''} onChange={(e) => update(index, 'recalcCoeffNumber', e.target.value)} /></td>
                <td className="text-right"><input type="number" className="input text-right" style={posInputStyle} value={p.total || ''} onChange={(e) => update(index, 'total', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td className="text-right"><input type="number" className="input text-right" style={posInputStyle} value={(p.laborPersonHours ?? 0) || ''} onChange={(e) => update(index, 'laborPersonHours', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td className="text-right"><input type="number" className="input text-right" style={posInputStyle} value={(p.costPerUnitFromStart ?? 0) || ''} onChange={(e) => update(index, 'costPerUnitFromStart', e.target.value === '' ? 0 : Number(e.target.value))} /></td>
                <td><button type="button" className="table-action table-action--delete" title="Удалить" onClick={() => deleteRow(index)}>✕</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={8}>ИТОГО</td>
              <td className="text-right">{formatMoney(positions.reduce((s, p) => s + p.total, 0))}</td>
              <td className="text-right">{positions.reduce((s, p) => s + (p.laborPersonHours ?? 0), 0).toLocaleString('ru-RU')}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ==== Вкладка «Проверка» ==== */
import { RISK_LABELS, RISK_COLORS, ERROR_TYPE_LABELS } from '../../api/estimates';

function CheckTab({ est }: { est: Estimate }) {
  const r = est.checkResult!;
  return (
    <div>
      {/* Резюме */}
      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(r.totalSum)}</div><div className="dash-kpi__label">Сумма сметы</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">📊</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(r.marketEstimate)}</div><div className="dash-kpi__label">Рыночная оценка</div></div></div>
        <div className="dash-kpi dash-kpi--danger"><div className="dash-kpi__icon">⚠️</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(r.potentialOverprice)} ({r.potentialOverpricePct}%)</div><div className="dash-kpi__label">Потенциальное завышение</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">🐛</div><div className="dash-kpi__body"><div className="dash-kpi__value">{r.errorsCount}</div><div className="dash-kpi__label">Найдено ошибок</div></div></div>
      </div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>Уровень риска:</span>
        <span style={{ background: RISK_COLORS[r.riskLevel], color: '#fff', padding: '4px 12px', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem' }}>
          {RISK_LABELS[r.riskLevel]}
        </span>
      </div>

      {/* Таблица ошибок */}
      <h3 style={{ marginBottom: 12 }}>Найденные ошибки и замечания</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Позиция</th>
              <th>Тип ошибки</th>
              <th>Описание</th>
              <th>Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {r.errors.map((err, i) => {
              const typeColors: Record<string, string> = {
                arithmetic: '#3b82f6', wrong_norm: '#dc2626', wrong_unit: '#f59e0b',
                overpriced: '#dc2626', suspicious_coeff: '#f97316',
              };
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>№{err.positionNum}</td>
                  <td>
                    <span style={{ background: typeColors[err.type] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {ERROR_TYPE_LABELS[err.type]}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{err.description}</td>
                  <td className="text-muted" style={{ fontSize: '0.875rem' }}>{err.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
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

  const filteredRates = useMemo(() => {
    if (!rateSearch.trim()) return workTypes;
    const q = rateSearch.toLowerCase();
    return workTypes.filter((w) => w.name.toLowerCase().includes(q) || (w.unit && w.unit.toLowerCase().includes(q)));
  }, [workTypes, rateSearch]);

  const inputClass = 'input input--sm text-right';
  const inputStyle = { width: 88, padding: '4px 6px', fontSize: '0.8125rem' };
  const nameInputStyle = { minWidth: 180, padding: '4px 8px', fontSize: '0.8125rem' };

  return (
    <div>
      <div className="dash-kpis" style={{ marginBottom: 20 }}>
        <div className="dash-kpi"><div className="dash-kpi__icon">🧱</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalMaterials)}</div><div className="dash-kpi__label">Материалы</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">👷</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalLabor)}</div><div className="dash-kpi__label">Труд</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">🚜</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.totalMachines)}</div><div className="dash-kpi__label">Машины</div></div></div>
        <div className="dash-kpi"><div className="dash-kpi__icon">💰</div><div className="dash-kpi__body"><div className="dash-kpi__value">{formatMoney(totals.grandTotal)}</div><div className="dash-kpi__label">Итого ЛСР</div></div></div>
      </div>

      <div className="dash-cols" style={{ marginBottom: 20 }}>
        <div className="dash-card">
          <h3 className="dash-card__title">Структура ЛСР</h3>
          <div style={{ fontSize: '0.875rem' }}>
            <div className="summary-row"><span className="summary-row__label">Прямые затраты</span><span className="summary-row__value">{formatMoney(totals.totalDirect)}</span></div>
            <div className="summary-row"><span className="summary-row__label">  — Материалы</span><span className="summary-row__value">{formatMoney(totals.totalMaterials)}</span></div>
            <div className="summary-row"><span className="summary-row__label">  — Труд</span><span className="summary-row__value">{formatMoney(totals.totalLabor)}</span></div>
            <div className="summary-row"><span className="summary-row__label">  — Машины</span><span className="summary-row__value">{formatMoney(totals.totalMachines)}</span></div>
            <hr className="summary-grid__divider" />
            <div className="summary-row"><span className="summary-row__label">Накладные</span><span className="summary-row__value">{formatMoney(totals.totalOverhead)}</span></div>
            <div className="summary-row"><span className="summary-row__label">Сметная прибыль</span><span className="summary-row__value">{formatMoney(totals.totalProfit)}</span></div>
            <hr className="summary-grid__divider" />
            <div className="summary-row summary-row--bold"><span className="summary-row__label">ИТОГО</span><span className="summary-row__value">{formatMoney(totals.grandTotal)}</span></div>
          </div>
        </div>
      </div>

      <div className="tab-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn btn--primary btn--sm" onClick={openAddModal}>+ Добавить позицию</button>
        {saveButton}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>№</th>
              <th>Наименование</th>
              <th style={{ width: 60 }}>Ед. изм</th>
              <th className="text-right" style={{ width: 90 }}>Объём</th>
              <th className="text-right" style={{ width: 90 }}>Материалы</th>
              <th className="text-right" style={{ width: 90 }}>Труд</th>
              <th className="text-right" style={{ width: 90 }}>Машины</th>
              <th className="text-right" style={{ width: 90 }}>Прямые</th>
              <th className="text-right" style={{ width: 90 }}>НР</th>
              <th className="text-right" style={{ width: 90 }}>СП</th>
              <th className="text-right" style={{ width: 90 }}>Итого</th>
              <th style={{ width: 100 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, index) => (
              <tr key={p.id}>
                <td>{p.num}</td>
                <td>
                  <input type="text" className="input" style={nameInputStyle} value={p.name} onChange={(e) => updateName(index, e.target.value)} placeholder="Наименование" />
                </td>
                <td>{p.unit}</td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step="any" value={p.volume === 0 ? '' : p.volume} onChange={(e) => updateCell(index, 'volume', e.target.value === '' ? 0 : Number(e.target.value))} />
                </td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step={1} value={p.materials === 0 ? '' : p.materials} onChange={(e) => updateCell(index, 'materials', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} />
                </td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step={1} value={p.labor === 0 ? '' : p.labor} onChange={(e) => updateCell(index, 'labor', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} />
                </td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step={1} value={p.machines === 0 ? '' : p.machines} onChange={(e) => updateCell(index, 'machines', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} />
                </td>
                <td className="text-right">{formatMoney(p.directCost)}</td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step={1} value={p.overhead === 0 ? '' : p.overhead} onChange={(e) => updateCell(index, 'overhead', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} />
                </td>
                <td className="text-right">
                  <input type="number" className={inputClass} style={inputStyle} min={0} step={1} value={p.profit === 0 ? '' : p.profit} onChange={(e) => updateCell(index, 'profit', Math.round(e.target.value === '' ? 0 : Number(e.target.value)))} />
                </td>
                <td className="text-right text-bold">{formatMoney(p.total)}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="table-action table-action--edit" title="Вверх" onClick={() => moveRow(index, -1)} disabled={index === 0}>▲</button>
                    <button type="button" className="table-action table-action--edit" title="Вниз" onClick={() => moveRow(index, 1)} disabled={index === positions.length - 1}>▼</button>
                    <button type="button" className="table-action table-action--delete" title="Удалить" onClick={() => deleteRow(index)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={4}>ИТОГО</td>
              <td className="text-right">{formatMoney(totals.totalMaterials)}</td>
              <td className="text-right">{formatMoney(totals.totalLabor)}</td>
              <td className="text-right">{formatMoney(totals.totalMachines)}</td>
              <td className="text-right">{formatMoney(totals.totalDirect)}</td>
              <td className="text-right">{formatMoney(totals.totalOverhead)}</td>
              <td className="text-right">{formatMoney(totals.totalProfit)}</td>
              <td className="text-right">{formatMoney(totals.grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Модальное окно: добавить позицию из расценок или создать новую расценку */}
      {addModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setAddModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            className="modal__content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="modal__header">
              <h3 className="modal__title">Добавить позицию</h3>
              <button type="button" className="modal__close" onClick={() => setAddModalOpen(false)} aria-label="Закрыть">&times;</button>
            </div>
            <div className="modal__body" style={{ overflowY: 'auto' }}>
              <div className="tabs" style={{ marginBottom: 16 }}>
                <button type="button" className={`tab ${addMode === 'from_rates' ? 'tab--active' : ''}`} onClick={() => setAddMode('from_rates')}>Из расценок</button>
                <button type="button" className={`tab ${addMode === 'new_rate' ? 'tab--active' : ''}`} onClick={() => setAddMode('new_rate')}>Новая расценка</button>
              </div>

              {addMode === 'from_rates' && (
                <>
                  <div className="form-group">
                    <input type="text" className="input" placeholder="Поиск по наименованию или ед. изм..." value={rateSearch} onChange={(e) => setRateSearch(e.target.value)} />
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    {filteredRates.length === 0 ? (
                      <p className="text-muted" style={{ padding: 16 }}>Нет расценок. Создайте новую во вкладке «Новая расценка».</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Наименование</th>
                            <th>Ед. изм</th>
                            <th className="text-right">Расценка</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRates.map((wt) => (
                            <tr key={wt.id}>
                              <td>{wt.name}</td>
                              <td>{wt.unit}</td>
                              <td className="text-right">{formatMoney(wt.rate)}</td>
                              <td>
                                <button type="button" className="btn btn--primary btn--sm" onClick={() => addPositionFromRate(wt)}>Добавить</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {addMode === 'new_rate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Наименование *</label>
                    <input type="text" className="input" value={newRateForm.name} onChange={(e) => setNewRateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Вид работ" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Единица измерения *</label>
                    <input type="text" className="input" value={newRateForm.unit} onChange={(e) => setNewRateForm((f) => ({ ...f, unit: e.target.value }))} placeholder="м², м³, шт." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Расценка (₽) *</label>
                    <input type="number" className="input" min={0} step={0.01} value={newRateForm.rate === 0 ? '' : newRateForm.rate} onChange={(e) => setNewRateForm((f) => ({ ...f, rate: e.target.value === '' ? 0 : Number(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Категория</label>
                    <input type="text" className="input" value={newRateForm.category || ''} onChange={(e) => setNewRateForm((f) => ({ ...f, category: e.target.value }))} placeholder="Опционально" />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Расценка будет создана в справочнике и добавлена в ЛСР с объёмом 1.</p>
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
