import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEstimateSettings, saveEstimateSettings, STRATEGY_LABELS, REGIONS } from '../../api/estimates';
import type { EstimateSettings, CalcStrategy } from '../../api/estimates';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export function EstimateSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<EstimateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEstimateSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await saveEstimateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCoeff = (region: string, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, regionCoefficients: { ...settings.regionCoefficients, [region]: value } });
  };

  if (loading || !settings) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/estimates')}>← К сметам</button>
          <h2 className="page__title" style={{ marginTop: 8 }}>Настройки сметного модуля</h2>
        </div>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="dash-cols">
        <div className="dash-card">
          <h3 className="dash-card__title">Общие параметры</h3>
          <div className="form-group">
            <label className="form-label">Накладные расходы, %</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={settings.overheadPct}
              onChange={(e) => setSettings({ ...settings, overheadPct: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Сметная прибыль, %</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={settings.profitPct}
              onChange={(e) => setSettings({ ...settings, profitPct: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Стратегия расчёта по умолчанию</label>
            <select
              className="input"
              value={settings.strategy}
              onChange={(e) => setSettings({ ...settings, strategy: e.target.value as CalcStrategy })}
            >
              {(Object.entries(STRATEGY_LABELS) as [CalcStrategy, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Своя маржа, % (для стратегии «Свой шаблон»)</label>
            <input
              className="input"
              type="number"
              step="0.5"
              value={settings.customMarginPct}
              onChange={(e) => setSettings({ ...settings, customMarginPct: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="dash-card">
          <h3 className="dash-card__title">Региональные коэффициенты</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
            Множитель к базовой цене. 1.0 — без надбавки.
          </p>
          {REGIONS.map((region) => (
            <div key={region} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="form-label" style={{ flex: 1, marginBottom: 0 }}>{region}</label>
              <input
                className="input"
                type="number"
                step="0.01"
                style={{ width: 100 }}
                value={settings.regionCoefficients[region] ?? 1.0}
                onChange={(e) => updateCoeff(region, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
