import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCounterparty, getCounterparty, updateCounterparty } from '../api/counterparties';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { CounterpartyCreate, OrgType } from '../types';

const EMPTY_FORM: CounterpartyCreate = {
  org_type: 'ip',
  name: '',
  comment: '',
  inn: '',
  kpp: '',
  address: '',
  ogrn: '',
  ogrn_date: '',
  director_title: '',
  director_name: '',
  chief_accountant: '',
  phone: '',
  email: '',
  website: '',
  edo_operator: 'none',
  bank_account: '',
  personal_account: '',
  bik: '',
  bank_name: '',
  corr_account: '',
  bank_address: '',
  receiver_type: 'buyer',
  receiver_title: '',
  receiver_name: '',
  responsible_title: '',
  responsible_name: '',
  economic_entity: '',
};

const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: 'ip', label: 'Индивидуальный предприниматель' },
  { value: 'legal', label: 'Юридическое лицо' },
  { value: 'self_employed', label: 'Самозанятый' },
  { value: 'individual', label: 'Физическое лицо' },
];

const EDO_OPTIONS = [
  { value: 'diadoc', label: 'Диадок (Контур)' },
  { value: 'sbis', label: 'СБИС' },
  { value: 'taxcom', label: 'Такском' },
  { value: 'none', label: 'Нет' },
];

const RECEIVER_OPTIONS = [
  { value: 'buyer', label: 'покупатель (плательщик) (сам контрагент)' },
  { value: 'other', label: 'другой получатель' },
];

export function CounterpartyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CounterpartyCreate>({ ...EMPTY_FORM });

  useEffect(() => {
    if (isEdit) {
      getCounterparty(Number(id))
        .then((cp) => {
          const { id: _id, created_at: _ca, ...rest } = cp;
          setForm(rest as CounterpartyCreate);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateCounterparty(Number(id), form);
      } else {
        await createCounterparty(form);
      }
      navigate('/counterparties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const t = form.org_type;
  const isIp = t === 'ip';
  const isLegal = t === 'legal';
  const isFull = isIp || isLegal;

  const nameLabel = isIp ? 'ФИО ИП' : isLegal ? 'Наименование организации' : 'ФИО';
  const showKpp = isLegal;
  const showOgrn = isFull;
  const ogrnLabel = isIp ? 'ОГРНИП' : 'ОГРН';
  const showDirector = isFull;
  const showAccountant = isFull;
  const showEdo = isFull;
  const showBank = isFull;
  const showReceiver = isFull;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">{isEdit ? 'Редактирование контрагента' : 'Добавление нового контрагента'}</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide org-form">
        {/* === Основные данные === */}
        <section className="form-section">
          <div className="form-group">
            <label>Тип организации:</label>
            <select name="org_type" value={form.org_type} onChange={handleChange}>
              {ORG_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{nameLabel}: *</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Комментарий:</label>
            <input name="comment" value={form.comment} onChange={handleChange} placeholder="любой комментарий для себя" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ИНН:</label>
              <input name="inn" value={form.inn} onChange={handleChange} placeholder={isLegal ? '10 цифр' : '12 цифр'} />
            </div>
            {showKpp && (
              <div className="form-group">
                <label>КПП:</label>
                <input name="kpp" value={form.kpp} onChange={handleChange} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Адрес:</label>
            <input name="address" value={form.address} onChange={handleChange} />
          </div>

          {showOgrn && (
            <div className="form-row">
              <div className="form-group">
                <label>{ogrnLabel}:</label>
                <input name="ogrn" value={form.ogrn} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Дата {ogrnLabel}:</label>
                <input name="ogrn_date" value={form.ogrn_date} onChange={handleChange} placeholder="дд.мм.гггг" />
              </div>
            </div>
          )}

          {showDirector && (
            <div className="form-row">
              <div className="form-group">
                <label>Руководитель (должность):</label>
                <input name="director_title" value={form.director_title} onChange={handleChange} placeholder={isIp ? 'для ИП «ИП»' : 'Генеральный директор'} />
              </div>
              <div className="form-group">
                <label>Руководитель (ФИО):</label>
                <input name="director_name" value={form.director_name} onChange={handleChange} placeholder="ФИО физлица или ИП" />
              </div>
            </div>
          )}

          {showAccountant && (
            <div className="form-group">
              <label>Главный (старший) бухгалтер:</label>
              <input name="chief_accountant" value={form.chief_accountant} onChange={handleChange} placeholder="ФИО физлица или ИП" />
            </div>
          )}
        </section>

        {/* === Контакты === */}
        <section className="form-section">
          <h3 className="form-section__title">Контакты</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Телефон:</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email для отправлений" />
            </div>
          </div>
          {isFull && (
            <>
              <div className="form-group">
                <label>Веб-сайт:</label>
                <input name="website" value={form.website} onChange={handleChange} />
              </div>
              {showEdo && (
                <div className="form-group">
                  <label>Оператор ЭДО:</label>
                  <select name="edo_operator" value={form.edo_operator} onChange={handleChange}>
                    {EDO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
        </section>

        {/* === Банковские реквизиты === */}
        {showBank && (
          <section className="form-section">
            <h3 className="form-section__title">Банковские реквизиты</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Расчётный счёт:</label>
                <input name="bank_account" value={form.bank_account} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Лицевой счёт:</label>
                <input name="personal_account" value={form.personal_account} onChange={handleChange} placeholder="для казначейских счетов" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>БИК:</label>
                <input name="bik" value={form.bik} onChange={handleChange} placeholder="9 цифр" />
              </div>
              <div className="form-group">
                <label>Наименование банка:</label>
                <input name="bank_name" value={form.bank_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Корреспондентский счёт:</label>
              <input name="corr_account" value={form.corr_account} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Адрес банка:</label>
              <input name="bank_address" value={form.bank_address} onChange={handleChange} />
            </div>
          </section>
        )}

        {/* === Данные получателя === */}
        {showReceiver && (
          <section className="form-section">
            <h3 className="form-section__title">Данные получателя</h3>
            <div className="form-group">
              <label>Грузополучатель по умолчанию:</label>
              <select name="receiver_type" value={form.receiver_type} onChange={handleChange}>
                {RECEIVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Получающий товар (должность):</label>
                <input name="receiver_title" value={form.receiver_title} onChange={handleChange} placeholder="должность отпускающего" />
              </div>
              <div className="form-group">
                <label>ФИО получающего:</label>
                <input name="receiver_name" value={form.receiver_name} onChange={handleChange} placeholder="ФИО отпускающего" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ответственный за оформление (должность):</label>
                <input name="responsible_title" value={form.responsible_title} onChange={handleChange} placeholder="должность ответственного" />
              </div>
              <div className="form-group">
                <label>ФИО ответственного:</label>
                <input name="responsible_name" value={form.responsible_name} onChange={handleChange} placeholder="ФИО ответственного" />
              </div>
            </div>
            <div className="form-group">
              <label>Наименование экономического субъекта – составителя документа:</label>
              <input name="economic_entity" value={form.economic_entity} onChange={handleChange} placeholder="может не заполняться при проставлении печати в М.П., может быть указан ИНН / КПП" />
            </div>
          </section>
        )}

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate('/counterparties')}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
