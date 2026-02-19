import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createOrganization, getOrganization, updateOrganization } from '../api/organizations';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { OrganizationCreate, OrgType } from '../types';

const EMPTY_FORM: OrganizationCreate = {
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
  telegram: '',
  website: '',
  edo_operator: 'diadoc',
  bank_account: '',
  personal_account: '',
  bik: '',
  bank_name: '',
  corr_account: '',
  bank_address: '',
  sender_type: 'seller',
  permit_title: '',
  permit_name: '',
  release_title: '',
  release_name: '',
  responsible_title: '',
  responsible_name: '',
  economic_entity: '',
  invoice_message: 'Внимание! Оплата данного счета означает согласие с условиями поставки товара.',
  add_stamp_to_invoice: true,
  add_logo_to_invoice: true,
  add_qr_to_invoice: true,
  add_contacts_to_invoice: false,
  act_conditions: 'Вышеперечисленные работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.',
  order_conditions: 'Вышеперечисленные работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.',
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

const SENDER_OPTIONS = [
  { value: 'seller', label: 'продавец' },
  { value: 'consignor', label: 'грузоотправитель' },
];

export function OrganizationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<OrganizationCreate>({ ...EMPTY_FORM });

  useEffect(() => {
    if (isEdit) {
      getOrganization(Number(id))
        .then((org) => {
          const { id: _id, created_at: _ca, ...rest } = org;
          setForm(rest as OrganizationCreate);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateOrganization(Number(id), form);
      } else {
        await createOrganization(form);
      }
      navigate('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const t = form.org_type;
  const isIp = t === 'ip';
  const isLegal = t === 'legal';
  const isSelfEmployed = t === 'self_employed';
  const isIndividual = t === 'individual';
  const isFull = isIp || isLegal;

  const nameLabel = isIp ? 'ФИО ИП' : isLegal ? 'Наименование организации' : 'ФИО';
  const showKpp = isLegal;
  const showOgrn = isFull;
  const ogrnLabel = isIp ? 'ОГРНИП' : 'ОГРН';
  const showDirector = isFull;
  const showAccountant = isFull;
  const showEdo = isFull;
  const showBank = isFull;
  const showSender = isFull;
  const showMisc = isFull;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">{isEdit ? 'Редактирование организации' : 'Добавление новой организации'}</h2>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Telegram:</label>
                  <input name="telegram" value={form.telegram} onChange={handleChange} placeholder="@telegram" />
                </div>
                <div className="form-group">
                  <label>Веб-сайт:</label>
                  <input name="website" value={form.website} onChange={handleChange} />
                </div>
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

        {/* === Данные отправителя === */}
        {showSender && (
          <section className="form-section">
            <h3 className="form-section__title">Данные отправителя</h3>
            <div className="form-group">
              <label>Грузоотправитель по умолчанию:</label>
              <select name="sender_type" value={form.sender_type} onChange={handleChange}>
                {SENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Разрешающий отпуск товара (должность):</label>
                <input name="permit_title" value={form.permit_title} onChange={handleChange} placeholder="должность разрешающего" />
              </div>
              <div className="form-group">
                <label>ФИО разрешающего:</label>
                <input name="permit_name" value={form.permit_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Отпускающий товар (должность):</label>
                <input name="release_title" value={form.release_title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>ФИО отпускающего:</label>
                <input name="release_name" value={form.release_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ответственный за оформление (должность):</label>
                <input name="responsible_title" value={form.responsible_title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>ФИО ответственного:</label>
                <input name="responsible_name" value={form.responsible_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Наименование экономического субъекта:</label>
              <input name="economic_entity" value={form.economic_entity} onChange={handleChange} placeholder="может не заполняться при проставлении печати в М.П." />
            </div>
          </section>
        )}

        {/* === Разное === */}
        {showMisc && (
          <section className="form-section">
            <h3 className="form-section__title">Разное</h3>
            <div className="form-group">
              <label>Сообщение для клиента в счёте на оплату:</label>
              <textarea name="invoice_message" value={form.invoice_message} onChange={handleChange} rows={3} />
            </div>

            <div className="form-row form-row--checkboxes">
              <label className="form-checkbox">
                <input type="checkbox" name="add_stamp_to_invoice" checked={form.add_stamp_to_invoice} onChange={handleChange} />
                Добавлять печать и подписи в счёте на оплату
              </label>
              <label className="form-checkbox">
                <input type="checkbox" name="add_logo_to_invoice" checked={form.add_logo_to_invoice} onChange={handleChange} />
                Добавлять логотип в счёт и счёт-договор
              </label>
              <label className="form-checkbox">
                <input type="checkbox" name="add_qr_to_invoice" checked={form.add_qr_to_invoice} onChange={handleChange} />
                Добавлять QR код в счёт и счёт-договор
              </label>
              <label className="form-checkbox">
                <input type="checkbox" name="add_contacts_to_invoice" checked={form.add_contacts_to_invoice} onChange={handleChange} />
                Добавлять Email, телефон в счёт и счёт-договор
              </label>
            </div>

            <div className="form-group">
              <label>Дополнительные условия в акте выполненных работ:</label>
              <textarea name="act_conditions" value={form.act_conditions} onChange={handleChange} rows={3} />
            </div>

            <div className="form-group">
              <label>Дополнительные условия в заказ-наряде:</label>
              <textarea name="order_conditions" value={form.order_conditions} onChange={handleChange} rows={3} />
            </div>
          </section>
        )}

        <div className="form__actions">
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate('/organizations')}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
