import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCounterparty, getCounterparties } from '../api/counterparties';
import { getOrganizations } from '../api/organizations';
import { getWorkTypes } from '../api/workTypes';
import { createDocument, getDocument, updateDocument } from '../api/documents';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getDocType } from '../utils/documentTypes';
import { generateAndDownloadDocx } from '../utils/generateDocx';
import { numberToWords } from '../utils/format';
import type { Counterparty, Organization, CpDocumentCreate, DocLineItem, WorkType } from '../types';

const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY_LINE: DocLineItem = { name: '', unit: 'шт', qty: 1, price: 0 };

const TAXATION_OPTIONS = [
  { value: '', label: '— выберите —' },
  { value: 'no_vat', label: 'Без НДС' },
  { value: 'vat_20', label: 'НДС 20%' },
  { value: 'vat_10', label: 'НДС 10%' },
  { value: 'vat_0', label: 'НДС 0%' },
  { value: 'usn', label: 'УСН (упрощенная система налогообложения)' },
  { value: 'usn_income', label: 'УСН доходы' },
  { value: 'usn_income_expense', label: 'УСН доходы минус расходы' },
];

export function DocumentFormPage() {
  const navigate = useNavigate();
  const { cpId, id } = useParams<{ cpId: string; id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [cp, setCp] = useState<Counterparty | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [allCounterparties, setAllCounterparties] = useState<Counterparty[]>([]);

  const [form, setForm] = useState<CpDocumentCreate>({
    counterparty_id: Number(cpId),
    organization_id: null,
    doc_type: searchParams.get('type') || 'payment_invoice',
    number: '',
    date: todayStr(),
    basis: '',
    items: [{ ...EMPTY_LINE }],
    notes: '',
    taxation: (searchParams.get('type') === 'vat_invoice' || searchParams.get('type') === 'torg12' || searchParams.get('type') === 'ks3') ? 'no_vat' : '',
    investor_id: null,
    construction_name: '',
    construction_address: '',
    object_name: '',
    okdp: '',
    contract_number: '',
    contract_date: '',
    operation_type: '',
    estimated_cost: undefined,
    period_from: '',
    period_to: '',
    print_vat_amounts: false,
    contract_creation_date: '',
    contract_location: '',
    premises_area: undefined,
    premises_address: '',
    transfer_date_from: '',
    premises_condition: '',
    valid_until: '',
    goods_source: '',
    person_name_dative: '',
    passport_series: '',
    passport_number: '',
    passport_issued_by: '',
    passport_issue_date: '',
    consumer_type: 'same',
    payer_type: 'same',
    text_above: '',
    text_below: '',
    payment_purpose: 'none',
    delivery_address: '',
    contract_text: '',
    add_buyer_signature: false,
    correction_number: '',
    correction_date: '',
    advance_invoice: 'no',
    payment_doc_number: '',
    payment_doc_date: '',
    shipment_doc_name: '',
    shipment_doc_number: '',
    shipment_doc_date: '',
    had_advance_invoices: false,
    state_contract_id: '',
    currency: 'RUB',
    form_version: 'current',
    shipper_type: 'seller',
    consignee_type: 'buyer',
    torg12_form_version: 'new',
    torg12_supplier_type: 'seller',
    torg12_consignee_type: 'payer',
    basis_number: '',
    basis_date: '',
    basis_number2: '',
    basis_date2: '',
    transport_waybill_name: '',
    transport_waybill_number: '',
    transport_waybill_date: '',
    attachment_sheets: 5,
    shipment_date_matches_doc: false,
    shipment_date: '',
    add_discount_markup: false,
    ks3_reporting_period_from: '',
    ks3_reporting_period_to: '',
  });

  useEffect(() => {
    const docType = searchParams.get('type') || 'payment_invoice';
    const promises: Promise<void>[] = [
      getCounterparty(Number(cpId)).then(setCp).catch(() => {}),
      getOrganizations().then(setOrgs).catch(() => {}),
      getWorkTypes().then(setWorkTypes).catch(() => {}),
    ];
    // Загружаем всех контрагентов для акта КС-2 (для выбора инвестора)
    if (docType === 'act_acceptance' || docType === 'act_ks2' || docType === 'torg12' || docType === 'ks3') {
      promises.push(getCounterparties().then(setAllCounterparties).catch(() => {}));
    }
    if (isEdit) {
      promises.push(
        getDocument(Number(id)).then((doc) => {
          setForm({
            counterparty_id: doc.counterparty_id,
            organization_id: doc.organization_id,
            doc_type: doc.doc_type,
            number: doc.number,
            date: doc.date,
            basis: doc.basis,
            items: doc.items.length > 0 ? doc.items : [{ ...EMPTY_LINE }],
            notes: doc.notes,
            taxation: doc.taxation || (doc.doc_type === 'vat_invoice' ? 'no_vat' : ''),
            investor_id: doc.investor_id ?? null,
            construction_name: doc.construction_name || '',
            construction_address: doc.construction_address || '',
            object_name: doc.object_name || '',
            okdp: doc.okdp || '',
            contract_number: doc.contract_number || '',
            contract_date: doc.contract_date || '',
            operation_type: doc.operation_type || '',
            estimated_cost: doc.estimated_cost,
            period_from: doc.period_from || '',
            period_to: doc.period_to || '',
            print_vat_amounts: doc.print_vat_amounts || false,
            contract_creation_date: doc.contract_creation_date || '',
            contract_location: doc.contract_location || '',
            premises_area: doc.premises_area,
            premises_address: doc.premises_address || '',
            transfer_date_from: doc.transfer_date_from || '',
            premises_condition: doc.premises_condition || '',
            valid_until: doc.valid_until || '',
            goods_source: doc.goods_source || '',
            person_name_dative: doc.person_name_dative || '',
            passport_series: doc.passport_series || '',
            passport_number: doc.passport_number || '',
            passport_issued_by: doc.passport_issued_by || '',
            passport_issue_date: doc.passport_issue_date || '',
            consumer_type: doc.consumer_type || 'same',
            payer_type: doc.payer_type || 'same',
            text_above: doc.text_above || '',
            text_below: doc.text_below || '',
            payment_purpose: doc.payment_purpose || 'none',
            delivery_address: doc.delivery_address || '',
            contract_text: doc.contract_text || '',
            add_buyer_signature: doc.add_buyer_signature || false,
            correction_number: doc.correction_number || '',
            correction_date: doc.correction_date || '',
            advance_invoice: doc.advance_invoice || 'no',
            payment_doc_number: doc.payment_doc_number || '',
            payment_doc_date: doc.payment_doc_date || '',
            shipment_doc_name: doc.shipment_doc_name || '',
            shipment_doc_number: doc.shipment_doc_number || '',
            shipment_doc_date: doc.shipment_doc_date || '',
            had_advance_invoices: doc.had_advance_invoices || false,
            state_contract_id: doc.state_contract_id || '',
            currency: doc.currency || 'RUB',
            form_version: doc.form_version || 'current',
            shipper_type: doc.shipper_type || 'seller',
            consignee_type: doc.consignee_type || 'buyer',
            torg12_form_version: doc.torg12_form_version || 'new',
            torg12_supplier_type: doc.torg12_supplier_type || 'seller',
            torg12_consignee_type: doc.torg12_consignee_type || 'payer',
            basis_number: doc.basis_number || '',
            basis_date: doc.basis_date || '',
            basis_number2: doc.basis_number2 || '',
            basis_date2: doc.basis_date2 || '',
            transport_waybill_name: doc.transport_waybill_name || '',
            transport_waybill_number: doc.transport_waybill_number || '',
            transport_waybill_date: doc.transport_waybill_date || '',
            attachment_sheets: doc.attachment_sheets ?? 5,
            shipment_date_matches_doc: doc.shipment_date_matches_doc || false,
            shipment_date: doc.shipment_date || '',
            add_discount_markup: doc.add_discount_markup || false,
            ks3_reporting_period_from: doc.ks3_reporting_period_from || '',
            ks3_reporting_period_to: doc.ks3_reporting_period_to || '',
          });
        }).catch((err) => setError(err.message))
      );
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [cpId, id, isEdit, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'organization_id' || name === 'investor_id' || name === 'estimated_cost' || name === 'premises_area'
          ? (value ? Number(value) : null)
          : name === 'attachment_sheets'
            ? (value === '' ? undefined : Number(value))
            : type === 'checkbox' || type === 'radio'
              ? (type === 'radio' ? value : checked)
              : value,
    }));
  };

  const handleItemChange = (idx: number, field: keyof DocLineItem, value: string) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const currentItem = items[idx] || { ...EMPTY_LINE };
      items[idx] = {
        ...currentItem,
        [field]: field === 'qty' || field === 'price' || field === 'cost_from_start' || field === 'cost_from_year_start' || field === 'cost_for_period'
          ? (value === '' ? 0 : Number(value))
          : value,
      };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...(prev.items || []), { ...EMPTY_LINE }] }));

  const addItemFromRate = (wt: WorkType) => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { name: wt.name, unit: wt.unit, qty: 1, price: wt.rate }],
    }));
  };

  const fillRowFromRate = (idx: number, wt: WorkType) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      items[idx] = { ...items[idx], name: wt.name, unit: wt.unit, price: wt.rate, qty: items[idx]?.qty ?? 1 };
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      items.splice(idx, 1);
      return { ...prev, items: items.length > 0 ? items : [{ ...EMPTY_LINE }] };
    });
  };

  // Определяем типы документов до использования в вычислениях
  const isActAcceptance = form.doc_type === 'act_acceptance' || form.doc_type === 'act_ks2';
  const isPremisesTransfer = form.doc_type === 'act_premises_transfer';
  const isPowerOfAttorney = form.doc_type === 'power_of_attorney';
  const isCommercialOffer = form.doc_type === 'commercial_offer';
  const isContractInvoice = form.doc_type === 'contract_invoice';
  const isVatInvoice = form.doc_type === 'vat_invoice';
  const isPaymentInvoice = form.doc_type === 'payment_invoice';
  const isTorg12 = form.doc_type === 'torg12';
  const isKs3 = form.doc_type === 'ks3';

  // Расчет итогов с учетом налогообложения
  const calculateTotals = () => {
    const itemsTotal = (form.items || []).reduce((s, i) => {
      if (isKs3 && i.cost_for_period !== undefined) {
        return s + (Number(i.cost_for_period) || 0);
      }
      const qty = Number(i.qty) || 0;
      const price = Number(i.price) || 0;
      return s + qty * price;
    }, 0);

    if (!form.taxation || form.taxation === 'no_vat' || !isPaymentInvoice) {
      return {
        totalWithoutVat: itemsTotal,
        totalVat: 0,
        totalWithVat: itemsTotal,
      };
    }

    let vatRate = 0;
    if (form.taxation === 'vat_20') vatRate = 0.20;
    else if (form.taxation === 'vat_10') vatRate = 0.10;
    else if (form.taxation === 'vat_0') vatRate = 0;
    else if (form.taxation === 'vat_included') {
      // НДС уже включен в сумму
      const totalWithVat = itemsTotal;
      const totalWithoutVat = totalWithVat / 1.20; // предполагаем 20%, можно сделать настраиваемым
      const totalVat = totalWithVat - totalWithoutVat;
      return {
        totalWithoutVat: isNaN(totalWithoutVat) || !isFinite(totalWithoutVat) ? 0 : totalWithoutVat,
        totalVat: isNaN(totalVat) || !isFinite(totalVat) ? 0 : totalVat,
        totalWithVat: isNaN(totalWithVat) || !isFinite(totalWithVat) ? 0 : totalWithVat,
      };
    } else if (form.taxation === 'vat_on_top') {
      // НДС сверху
      const totalWithoutVat = itemsTotal;
      const totalVat = totalWithoutVat * 0.20; // предполагаем 20%
      const totalWithVat = totalWithoutVat + totalVat;
      return {
        totalWithoutVat: isNaN(totalWithoutVat) || !isFinite(totalWithoutVat) ? 0 : totalWithoutVat,
        totalVat: isNaN(totalVat) || !isFinite(totalVat) ? 0 : totalVat,
        totalWithVat: isNaN(totalWithVat) || !isFinite(totalWithVat) ? 0 : totalWithVat,
      };
    }

    if (vatRate > 0) {
      const totalWithoutVat = itemsTotal;
      const totalVat = totalWithoutVat * vatRate;
      const totalWithVat = totalWithoutVat + totalVat;
      return {
        totalWithoutVat: isNaN(totalWithoutVat) || !isFinite(totalWithoutVat) ? 0 : totalWithoutVat,
        totalVat: isNaN(totalVat) || !isFinite(totalVat) ? 0 : totalVat,
        totalWithVat: isNaN(totalWithVat) || !isFinite(totalWithVat) ? 0 : totalWithVat,
      };
    }

    return {
      totalWithoutVat: isNaN(itemsTotal) || !isFinite(itemsTotal) ? 0 : itemsTotal,
      totalVat: 0,
      totalWithVat: isNaN(itemsTotal) || !isFinite(itemsTotal) ? 0 : itemsTotal,
    };
  };

  const totals = calculateTotals();
  const total = totals.totalWithVat; // Для обратной совместимости

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateDocument(Number(id), form);
      } else {
        await createDocument(form);
      }
      navigate(`/counterparties/${cpId}/documents`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!cp) return;
    const items = form.items || [];
    const docObj = {
      id: 0, counterparty_id: Number(cpId),
      organization_id: form.organization_id ?? null,
      doc_type: form.doc_type, number: form.number || '',
      date: form.date || todayStr(), basis: form.basis || '',
      items, notes: form.notes || '',
      taxation: form.taxation || undefined,
      investor_id: form.investor_id ?? undefined,
      construction_name: form.construction_name || undefined,
      construction_address: form.construction_address || undefined,
      object_name: form.object_name || undefined,
      okdp: form.okdp || undefined,
      contract_number: form.contract_number || undefined,
      contract_date: form.contract_date || undefined,
      operation_type: form.operation_type || undefined,
      estimated_cost: form.estimated_cost,
      period_from: form.period_from || undefined,
      period_to: form.period_to || undefined,
      print_vat_amounts: form.print_vat_amounts || undefined,
      contract_creation_date: form.contract_creation_date || undefined,
      contract_location: form.contract_location || undefined,
      premises_area: form.premises_area,
      premises_address: form.premises_address || undefined,
      transfer_date_from: form.transfer_date_from || undefined,
      premises_condition: form.premises_condition || undefined,
      valid_until: form.valid_until || undefined,
      goods_source: form.goods_source || undefined,
      person_name_dative: form.person_name_dative || undefined,
      passport_series: form.passport_series || undefined,
      passport_number: form.passport_number || undefined,
      passport_issued_by: form.passport_issued_by || undefined,
      passport_issue_date: form.passport_issue_date || undefined,
      consumer_type: form.consumer_type || undefined,
      payer_type: form.payer_type || undefined,
      text_above: form.text_above || undefined,
      text_below: form.text_below || undefined,
      payment_purpose: form.payment_purpose || undefined,
      delivery_address: form.delivery_address || undefined,
      contract_text: form.contract_text || undefined,
      add_buyer_signature: form.add_buyer_signature || undefined,
      correction_number: form.correction_number || undefined,
      correction_date: form.correction_date || undefined,
      advance_invoice: form.advance_invoice || undefined,
      payment_doc_number: form.payment_doc_number || undefined,
      payment_doc_date: form.payment_doc_date || undefined,
      shipment_doc_name: form.shipment_doc_name || undefined,
      shipment_doc_number: form.shipment_doc_number || undefined,
      shipment_doc_date: form.shipment_doc_date || undefined,
      had_advance_invoices: form.had_advance_invoices || undefined,
      state_contract_id: form.state_contract_id || undefined,
      currency: form.currency || undefined,
      form_version: form.form_version || undefined,
      shipper_type: form.shipper_type || undefined,
      consignee_type: form.consignee_type || undefined,
      torg12_form_version: form.torg12_form_version || undefined,
      torg12_supplier_type: form.torg12_supplier_type || undefined,
      torg12_consignee_type: form.torg12_consignee_type || undefined,
      basis_number: form.basis_number || undefined,
      basis_date: form.basis_date || undefined,
      basis_number2: form.basis_number2 || undefined,
      basis_date2: form.basis_date2 || undefined,
      transport_waybill_name: form.transport_waybill_name || undefined,
      transport_waybill_number: form.transport_waybill_number || undefined,
      transport_waybill_date: form.transport_waybill_date || undefined,
      attachment_sheets: form.attachment_sheets,
      shipment_date_matches_doc: form.shipment_date_matches_doc || undefined,
      shipment_date: form.shipment_date || undefined,
      add_discount_markup: form.add_discount_markup || undefined,
      ks3_reporting_period_from: form.ks3_reporting_period_from || undefined,
      ks3_reporting_period_to: form.ks3_reporting_period_to || undefined,
      total: (() => {
        const itemsTotal = (items || []).reduce((s, i) => {
          if (isKs3 && i.cost_for_period !== undefined) {
            return s + (Number(i.cost_for_period) || 0);
          }
          const qty = Number(i.qty) || 0;
          const price = Number(i.price) || 0;
          return s + qty * price;
        }, 0);
        // Для payment_invoice используем расчет с учетом НДС
        if (form.doc_type === 'payment_invoice' && form.taxation && form.taxation !== 'no_vat') {
          let vatRate = 0;
          if (form.taxation === 'vat_20') vatRate = 0.20;
          else if (form.taxation === 'vat_10') vatRate = 0.10;
          else if (form.taxation === 'vat_included') {
            const result = itemsTotal; // НДС уже включен
            return isNaN(result) || !isFinite(result) ? 0 : result;
          } else if (form.taxation === 'vat_on_top') {
            const result = itemsTotal * 1.20; // НДС сверху (20%)
            return isNaN(result) || !isFinite(result) ? 0 : result;
          }
          if (vatRate > 0) {
            const result = itemsTotal * (1 + vatRate);
            return isNaN(result) || !isFinite(result) ? 0 : result;
          }
        }
        const result = itemsTotal;
        return isNaN(result) || !isFinite(result) ? 0 : result;
      })(),
      created_at: new Date().toISOString(),
    };
    let org = null;
    if (form.organization_id) {
      org = orgs.find((o) => o.id === form.organization_id) || null;
    }
    let investor = null;
    if (form.investor_id && allCounterparties.length > 0) {
      investor = allCounterparties.find((c) => c.id === form.investor_id) || null;
    }
    await generateAndDownloadDocx(docObj, cp, org, investor);
  };

  const docType = getDocType(form.doc_type);
  const docName = docType?.name || form.doc_type;
  const showTaxation =
    form.doc_type === 'contract_sale' ||
    form.doc_type === 'contract_spec' ||
    form.doc_type === 'act_acceptance' ||
    form.doc_type === 'act_premises_transfer' ||
    form.doc_type === 'commercial_offer' ||
    form.doc_type === 'contract_invoice' ||
    form.doc_type === 'vat_invoice' ||
    form.doc_type === 'torg12' ||
    form.doc_type === 'ks3';

  if (loading) return <LoadingSpinner />;
  if (!cp) return <div className="page"><p>Контрагент не найден</p></div>;

  const selectedOrg = orgs.find((o) => o.id === form.organization_id);
  const selectedInvestor = allCounterparties.find((c) => c.id === form.investor_id);

  const CONTRACT_INVOICE_DESCRIPTION = (
    <div className="doc-description doc-description--box" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>В чем разница между Счетом-договором и Счетом-офертой?</h3>
      <p>
        Это два названия одного и того же механизма упрощенной сделки. <strong>Счет-оферта</strong> — документ-предложение,
        который становится юридически обязывающим договором при оплате (акцепте) покупателем. <strong>Счет-договор</strong> —
        документ, объединяющий функции счета и договора в одном бланке, часто подписывается обеими сторонами в упрощенном порядке.
      </p>
      <p>
        Наш онлайн-бланк универсален: его можно использовать как <strong>оферту</strong> (подписывает только продавец)
        или как полноценный двусторонний договор (с полем для подписи покупателя). Подходит для разовых поставок товаров
        или оказания типовых услуг.
      </p>
    </div>
  );

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">{isEdit ? 'Редактирование' : 'Создание'}: {docName}</h2>
      </div>

      {isContractInvoice && CONTRACT_INVOICE_DESCRIPTION}

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="form form--wide org-form">
        {/* Header fields */}
        <section className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>{isTorg12 ? 'Товарная накладная №' : isKs3 ? 'Справка КС-3 №' : 'Документ №'}:</label>
              <input name="number" value={form.number} onChange={handleChange} placeholder={isTorg12 || isKs3 ? '' : 'Номер документа'} />
            </div>
            <div className="form-group">
              <label>от:</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            {isTorg12 && (
              <div className="form-group">
                <label>Версия бланка:</label>
                <select name="torg12_form_version" value={form.torg12_form_version || 'new'} onChange={handleChange}>
                  <option value="new">новая</option>
                  <option value="old">старая</option>
                </select>
              </div>
            )}
          </div>

          {/* Отчётный период для КС-3 */}
          {isKs3 && (
            <div className="form-row">
              <div className="form-group">
                <label>Отчётный период:</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>с</span>
                  <input type="date" name="ks3_reporting_period_from" value={form.ks3_reporting_period_from || ''} onChange={handleChange} placeholder="дд.мм.гггг" />
                  <span>по</span>
                  <input type="date" name="ks3_reporting_period_to" value={form.ks3_reporting_period_to || ''} onChange={handleChange} placeholder="дд.мм.гггг" />
                </div>
              </div>
            </div>
          )}

          {/* Дополнительные поля для акта приема-передачи помещения */}
          {isPremisesTransfer && (
            <>
              <div className="form-group">
                <label>Дата составления договора:</label>
                <input type="date" name="contract_creation_date" value={form.contract_creation_date || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Населенный пункт в котором составлен договор:</label>
                <input name="contract_location" value={form.contract_location || ''} onChange={handleChange} placeholder="г. Москва" />
              </div>
            </>
          )}

          {/* Дополнительные поля для доверенности */}
          {isPowerOfAttorney && (
            <>
              <div className="form-group">
                <label>Срок действия доверенности по:</label>
                <input type="date" name="valid_until" value={form.valid_until || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>От кого или в какой организации необходимо получить товар:</label>
                <input name="goods_source" value={form.goods_source || ''} onChange={handleChange} />
              </div>
            </>
          )}

          {/* Назначение платежа для счёта-договора */}
          {isContractInvoice && (
            <div className="form-group">
              <label>Назначение платежа:</label>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="payment_purpose" value="none" checked={form.payment_purpose === 'none'} onChange={handleChange} />
                  {' '}не указывать
                </label>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="payment_purpose" value="standard" checked={form.payment_purpose === 'standard'} onChange={handleChange} />
                  {' '}стандартное
                </label>
                <label style={{ display: 'block' }}>
                  <input type="radio" name="payment_purpose" value="manual" checked={form.payment_purpose === 'manual'} onChange={handleChange} />
                  {' '}задать вручную
                </label>
              </div>
            </div>
          )}

          {/* Дополнительные поля для счета-фактуры */}
          {isVatInvoice && (
            <>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>Исправление:</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>№:</label>
                  <input name="correction_number" value={form.correction_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>от:</label>
                  <input type="date" name="correction_date" value={form.correction_date || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Счет-фактура на авансовый платеж:</label>
                <select name="advance_invoice" value={form.advance_invoice || 'no'} onChange={handleChange}>
                  <option value="no">Нет</option>
                  <option value="yes">Да</option>
                </select>
              </div>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>К платежно-расчетному документу:</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>№:</label>
                  <input name="payment_doc_number" value={form.payment_doc_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>от:</label>
                  <input type="date" name="payment_doc_date" value={form.payment_doc_date || ''} onChange={handleChange} />
                </div>
              </div>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>Документ об отгрузке:</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Название документа:</label>
                  <input name="shipment_doc_name" value={form.shipment_doc_name || ''} onChange={handleChange} placeholder="н-е название документ" />
                </div>
                <div className="form-group">
                  <label>№:</label>
                  <input name="shipment_doc_number" value={form.shipment_doc_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>от:</label>
                  <input type="date" name="shipment_doc_date" value={form.shipment_doc_date || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="had_advance_invoices"
                    checked={form.had_advance_invoices || false}
                    onChange={handleChange}
                  />
                  {' '}Были авансовые счет-фактуры
                </label>
              </div>
              <div className="form-group">
                <label>Идентификатор государственного контракта, договора (соглашения):</label>
                <input name="state_contract_id" value={form.state_contract_id || ''} onChange={handleChange} placeholder="(20-25 цифр)" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Валюта:</label>
                  <select name="currency" value={form.currency || 'RUB'} onChange={handleChange}>
                    <option value="RUB">Руб.</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Версия бланка:</label>
                  <select name="form_version" value={form.form_version || 'current'} onChange={handleChange}>
                    <option value="current">действующая (1 января 2026)</option>
                    <option value="old">старая</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {isTorg12 ? (
            <>
              <h4 style={{ marginTop: 24, marginBottom: 12 }}>Основание:</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>номер</label>
                  <input name="basis_number" value={form.basis_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>дата</label>
                  <input type="date" name="basis_date" value={form.basis_date || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>номер</label>
                  <input name="basis_number2" value={form.basis_number2 || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>дата</label>
                  <input type="date" name="basis_date2" value={form.basis_date2 || ''} onChange={handleChange} />
                </div>
              </div>
            </>
          ) : (
              <div className="form-group">
                <label>
                  {isPremisesTransfer
                    ? 'Помещение передается по договору от:'
                    : isPowerOfAttorney
                      ? 'По документу:'
                      : 'Основание:'}
                </label>
                {isPremisesTransfer ? (
                  <input type="date" name="basis" value={form.basis} onChange={handleChange} />
                ) : (
                  <input name="basis" value={form.basis} onChange={handleChange} placeholder={isPowerOfAttorney ? '' : 'можно не указывать'} />
                )}
              </div>
            )}
        </section>

        {/* Транспортная накладная (ТОРГ-12) */}
        {isTorg12 && (
          <section className="form-section">
            <h3 className="form-section__title">Транспортная накладная:</h3>
            <div className="form-row">
              <div className="form-group">
                <label>наименование</label>
                <input name="transport_waybill_name" value={form.transport_waybill_name || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>номер</label>
                <input name="transport_waybill_number" value={form.transport_waybill_number || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>дата</label>
                <input type="date" name="transport_waybill_date" value={form.transport_waybill_date || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>
                Товарная накладная имеет приложение на{' '}
                <input type="number" name="attachment_sheets" value={form.attachment_sheets ?? 5} onChange={handleChange} min={1} style={{ width: 60 }} />
                {' '}листах
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="shipment_date_matches_doc" checked={form.shipment_date_matches_doc || false} onChange={handleChange} />
                {' '}совпадает с датой составления
              </label>
            </div>
            <div className="form-group">
              <label>Дата отгрузки товара:</label>
              <input type="date" name="shipment_date" value={form.shipment_date || ''} onChange={handleChange} placeholder="дд.мм.гггг" />
            </div>
          </section>
        )}

        {/* Ставка НДС (ТОРГ-12) */}
        {isTorg12 && (
          <section className="form-section">
            <h3 className="form-section__title">Ставка НДС:</h3>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="no_vat" checked={form.taxation === 'no_vat'} onChange={handleChange} />
                {' '}Без НДС
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_included" checked={form.taxation === 'vat_included'} onChange={handleChange} />
                {' '}с НДС в том числе
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_on_top" checked={form.taxation === 'vat_on_top'} onChange={handleChange} />
                {' '}НДС сверху
              </label>
            </div>
            <button type="button" className="btn btn--ghost btn--sm">применить</button>
          </section>
        )}

        {/* Seller / Organization */}
        <section className="form-section">
          <h3 className="form-section__title">
            {isKs3
              ? 'Подрядчик (Субподрядчик)'
              : isPremisesTransfer
                ? 'Информация об Арендодателе'
                : isPowerOfAttorney
                  ? 'Организация выдавшая доверенность'
                  : 'Информация о продавце (моя организация)'}
          </h3>
          <div className="form-group">
            <label>{isTorg12 || isKs3 ? '— мои организации —' : 'Моя организация'}:</label>
            <select name="organization_id" value={form.organization_id ?? ''} onChange={handleChange}>
              <option value="">— выберите организацию —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          {selectedOrg && (
            <div className="doc-org-preview">
              {isTorg12 ? (
                <>
                  <div><span className="text-muted">Название ООО или фамилия ИП:</span> {selectedOrg.name}</div>
                  <div><span className="text-muted">ИНН:</span> {selectedOrg.inn}</div>
                  <div><span className="text-muted">КПП:</span> {selectedOrg.kpp}</div>
                  <div><span className="text-muted">Адрес:</span> {selectedOrg.address}</div>
                  <div><span className="text-muted">Руководитель:</span> {selectedOrg.director_title} {selectedOrg.director_name}</div>
                  <div><span className="text-muted">Главный (старший) бухгалтер:</span> {selectedOrg.chief_accountant}</div>
                  <div><span className="text-muted">Телефоны:</span> {selectedOrg.phone}</div>
                  <div><span className="text-muted">Разрешающий отпуск товара:</span> {selectedOrg.permit_title} {selectedOrg.permit_name}</div>
                  <div><span className="text-muted">Отпускающий товар:</span> {selectedOrg.release_title} {selectedOrg.release_name}</div>
                  <h4 style={{ marginTop: 16, marginBottom: 8 }}>Банковские реквизиты</h4>
                  <div><span className="text-muted">Расчетный счет:</span> {selectedOrg.bank_account}</div>
                  <div><span className="text-muted">БИК:</span> {selectedOrg.bik} <span className="text-muted">(9 цифр)</span></div>
                  <div><span className="text-muted">В банке (наименование банка):</span> {selectedOrg.bank_name}</div>
                  <div><span className="text-muted">Корреспондентский счет:</span> {selectedOrg.corr_account}</div>
                  <div><span className="text-muted">Местонахождение банка:</span> {selectedOrg.bank_address}</div>
                  <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}>Заполнить остальное по БИК</button>
                </>
              ) : isKs3 ? (
                <>
                  <div><span className="text-muted">Название:</span> {selectedOrg.name}</div>
                  <div><span className="text-muted">ИНН:</span> {selectedOrg.inn}</div>
                  <div><span className="text-muted">КПП:</span> {selectedOrg.kpp}</div>
                  <div><span className="text-muted">Адрес:</span> {selectedOrg.address}</div>
                  <div><span className="text-muted">ОКПО:</span> {selectedOrg.comment || ''}</div>
                  <div><span className="text-muted">Телефон, факс:</span> {selectedOrg.phone}</div>
                  <div><span className="text-muted">Должность представителя:</span> {selectedOrg.director_title || 'директор, для ИП пусто'}</div>
                  <div><span className="text-muted">ФИО представителя:</span> {selectedOrg.director_name}</div>
                </>
              ) : (
                <>
                  <div><span className="text-muted">Название:</span> {selectedOrg.name}</div>
                  {selectedOrg.address && <div><span className="text-muted">Адрес:</span> {selectedOrg.address}</div>}
                  <div><span className="text-muted">ИНН:</span> {selectedOrg.inn} {selectedOrg.kpp && <>&nbsp;КПП: {selectedOrg.kpp}</>}</div>
                  {selectedOrg.director_name && <div><span className="text-muted">Руководитель:</span> {selectedOrg.director_title} {selectedOrg.director_name}</div>}
                  {selectedOrg.bank_account && <div><span className="text-muted">Р/с:</span> {selectedOrg.bank_account}, БИК {selectedOrg.bik}</div>}
                </>
              )}
            </div>
          )}
        </section>

        {/* Заказчик (Генподрядчик) для КС-3 */}
        {isKs3 && (
          <section className="form-section">
            <h3 className="form-section__title">Заказчик (Генподрядчик):</h3>
            <div className="form-group">
              <label>— контрагенты —</label>
              <select className="form-control" disabled value={cp?.id}>
                <option value={cp?.id}>{cp?.name}</option>
              </select>
            </div>
            <div className="doc-org-preview">
              <div><span className="text-muted">Название:</span> {cp?.name}</div>
              <div><span className="text-muted">ИНН:</span> {cp?.inn}</div>
              <div><span className="text-muted">КПП:</span> {cp?.kpp}</div>
              <div><span className="text-muted">Адрес:</span> {cp?.address}</div>
              <div><span className="text-muted">ОКПО:</span> {cp?.comment || ''}</div>
              <div><span className="text-muted">Телефон, факс:</span> {cp?.phone}</div>
              <div><span className="text-muted">Должность представителя:</span> {cp?.director_title || 'директор, для ИП пусто'}</div>
              <div><span className="text-muted">ФИО представителя:</span> {cp?.director_name}</div>
            </div>
          </section>
        )}

        {/* Инвестор для КС-3 */}
        {isKs3 && (
          <section className="form-section">
            <h3 className="form-section__title">Инвестор:</h3>
            <div className="form-group">
              <label>— контрагенты —</label>
              <select name="investor_id" value={form.investor_id ?? ''} onChange={handleChange}>
                <option value="">— выберите инвестора —</option>
                {allCounterparties.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {selectedInvestor && (
              <div className="doc-org-preview">
                <div><span className="text-muted">Название:</span> {selectedInvestor.name}</div>
                <div><span className="text-muted">ИНН:</span> {selectedInvestor.inn}</div>
                <div><span className="text-muted">КПП:</span> {selectedInvestor.kpp}</div>
                <div><span className="text-muted">Адрес:</span> {selectedInvestor.address}</div>
                <div><span className="text-muted">ОКПО:</span> {selectedInvestor.comment || ''}</div>
                <div><span className="text-muted">Телефон, факс:</span> {selectedInvestor.phone}</div>
              </div>
            )}
          </section>
        )}

        {/* Информация о поставщике (ТОРГ-12) */}
        {isTorg12 && (
          <section className="form-section">
            <h3 className="form-section__title">Информация о поставщике:</h3>
            <div className="form-group">
              <label>Поставщик:</label>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="torg12_supplier_type" value="seller" checked={form.torg12_supplier_type === 'seller'} onChange={handleChange} />
                  {' '}продавец
                </label>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="torg12_supplier_type" value="other" checked={form.torg12_supplier_type === 'other'} onChange={handleChange} />
                  {' '}сторонняя организация
                </label>
                <label style={{ display: 'block' }}>
                  <input type="radio" name="torg12_supplier_type" value="none" checked={form.torg12_supplier_type === 'none'} onChange={handleChange} />
                  {' '}не указывать
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Информация о плательщике (ТОРГ-12) */}
        {isTorg12 && (
          <section className="form-section">
            <h3 className="form-section__title">Информация о плательщике:</h3>
            <div className="form-group">
              <label>— контрагенты —</label>
              <select className="form-control" disabled value={cp?.id}>
                <option value={cp?.id}>{cp?.name}</option>
              </select>
            </div>
            <div className="doc-org-preview">
              <div><span className="text-muted">Название ООО или фамилия ИП:</span> {cp?.name}</div>
              <div><span className="text-muted">ИНН:</span> {cp?.inn}</div>
              <div><span className="text-muted">КПП:</span> {cp?.kpp}</div>
              <div><span className="text-muted">Адрес:</span> {cp?.address}</div>
              <div><span className="text-muted">Телефоны:</span> {cp?.phone}</div>
              <h4 style={{ marginTop: 16, marginBottom: 8 }}>Банковские реквизиты плательщика</h4>
              <div><span className="text-muted">Расчетный счет:</span> {cp?.bank_account}</div>
              <div><span className="text-muted">БИК:</span> {cp?.bik} <span className="text-muted">(9 цифр)</span></div>
              <div><span className="text-muted">В банке (наименование банка):</span> {cp?.bank_name}</div>
              <div><span className="text-muted">Корреспондентский счет:</span> {cp?.corr_account}</div>
              <div><span className="text-muted">Местонахождение банка:</span> {cp?.bank_address}</div>
              <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}>Заполнить остальное по БИК</button>
            </div>
          </section>
        )}

        {/* Информация о грузополучателе (ТОРГ-12) */}
        {isTorg12 && (
          <section className="form-section">
            <h3 className="form-section__title">Информация о грузополучателе:</h3>
            <div className="form-group">
              <label>Грузополучатель:</label>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="torg12_consignee_type" value="payer" checked={form.torg12_consignee_type === 'payer'} onChange={handleChange} />
                  {' '}Плательщик
                </label>
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <input type="radio" name="torg12_consignee_type" value="other" checked={form.torg12_consignee_type === 'other'} onChange={handleChange} />
                  {' '}Сторонняя организация
                </label>
                <label style={{ display: 'block' }}>
                  <input type="radio" name="torg12_consignee_type" value="same_as_seller" checked={form.torg12_consignee_type === 'same_as_seller'} onChange={handleChange} />
                  {' '}Такой же, как продавец
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Грузоотправитель для счета-фактуры */}
        {isVatInvoice && (
          <section className="form-section">
            <h3 className="form-section__title">Грузоотправитель:</h3>
            <div className="form-group">
              <label>
                <input type="radio" name="shipper_type" value="seller" checked={form.shipper_type === 'seller'} onChange={handleChange} />
                {' '}продавец
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="shipper_type" value="other" checked={form.shipper_type === 'other'} onChange={handleChange} />
                {' '}сторонняя организация
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="shipper_type" value="none" checked={form.shipper_type === 'none'} onChange={handleChange} />
                {' '}не указывать
              </label>
            </div>
          </section>
        )}

        {/* Buyer / Counterparty (auto-filled) */}
        {!isPowerOfAttorney && (
          <section className="form-section">
            <h3 className="form-section__title">
              {isActAcceptance
                ? 'Заказчик (Генподрядчик)'
                : isPremisesTransfer
                  ? 'Информация об Арендаторе'
                  : 'Информация о покупателе (контрагент)'}
            </h3>
            <div className="doc-org-preview">
              <div><span className="text-muted">Название:</span> {cp.name}</div>
              {cp.address && <div><span className="text-muted">Адрес:</span> {cp.address}</div>}
              <div><span className="text-muted">ИНН:</span> {cp.inn} {cp.kpp && <>&nbsp;КПП: {cp.kpp}</>}</div>
              {cp.director_name && <div><span className="text-muted">Руководитель:</span> {cp.director_title} {cp.director_name}</div>}
              {cp.bank_account && <div><span className="text-muted">Р/с:</span> {cp.bank_account}, БИК {cp.bik}</div>}
            </div>
            {isContractInvoice && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Адрес доставки:</label>
                <input name="delivery_address" value={form.delivery_address || ''} onChange={handleChange} placeholder="для услуг можно не указывать" />
              </div>
            )}
          </section>
        )}

        {/* Грузополучатель для счета-фактуры */}
        {isVatInvoice && (
          <section className="form-section">
            <h3 className="form-section__title">Грузополучатель:</h3>
            <div className="form-group">
              <label>
                <input type="radio" name="consignee_type" value="buyer" checked={form.consignee_type === 'buyer'} onChange={handleChange} />
                {' '}покупатель
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="consignee_type" value="other" checked={form.consignee_type === 'other'} onChange={handleChange} />
                {' '}сторонняя организация
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="consignee_type" value="none" checked={form.consignee_type === 'none'} onChange={handleChange} />
                {' '}не указывать
              </label>
            </div>
          </section>
        )}

        {/* Ставка НДС для счета-фактуры */}
        {isVatInvoice && (
          <section className="form-section">
            <h3 className="form-section__title">Ставка НДС:</h3>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="no_vat" checked={form.taxation === 'no_vat'} onChange={handleChange} />
                {' '}Без НДС
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_included" checked={form.taxation === 'vat_included'} onChange={handleChange} />
                {' '}с НДС в том числе
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_on_top" checked={form.taxation === 'vat_on_top'} onChange={handleChange} />
                {' '}НДС сверху
              </label>
            </div>
          </section>
        )}

        {/* Информация о лице для доверенности */}
        {isPowerOfAttorney && (
          <section className="form-section">
            <h3 className="form-section__title">Информация о лице на чье имя выдается доверенность</h3>
            <div className="form-group">
              <label>Должность, Ф.И.О. полностью, в дательном падеже:</label>
              <input name="person_name_dative" value={form.person_name_dative || ''} onChange={handleChange} placeholder="водителю Иванову Ивану Ивановичу" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Паспорт серия:</label>
                <input name="passport_series" value={form.passport_series || ''} onChange={handleChange} placeholder="01 11" />
              </div>
              <div className="form-group">
                <label>Паспорт №:</label>
                <input name="passport_number" value={form.passport_number || ''} onChange={handleChange} placeholder="654321" />
              </div>
            </div>
            <div className="form-group">
              <label>Кем выдан:</label>
              <input name="passport_issued_by" value={form.passport_issued_by || ''} onChange={handleChange} placeholder="ФМС г. Москвы" />
            </div>
            <div className="form-group">
              <label>Дата выдачи:</label>
              <input type="date" name="passport_issue_date" value={form.passport_issue_date || ''} onChange={handleChange} />
            </div>
          </section>
        )}

        {/* Текст коммерческого предложения */}
        {isCommercialOffer && (
          <>
            <section className="form-section">
              <h3 className="form-section__title">Текст ком. предложения сверху</h3>
              <div className="form-group">
                <textarea name="text_above" value={form.text_above || ''} onChange={handleChange} rows={4} placeholder="Просим Вас рассмотреть наше коммерческое предложение." />
              </div>
            </section>
            <section className="form-section">
              <h3 className="form-section__title">Текст ком. предложения снизу</h3>
              <div className="form-group">
                <textarea name="text_below" value={form.text_below || ''} onChange={handleChange} rows={4} />
              </div>
              <p className="text-muted" style={{ fontSize: '0.9em', marginTop: 4 }}>
                {'{buyer_director_name}'} — будет заменено на имя руководителя покупателя, можно удалить весь текст чтобы не печатать его.
              </p>
            </section>
          </>
        )}

        {/* Дополнительные поля для акта приема-передачи помещения */}
        {isPremisesTransfer && (
          <section className="form-section">
            <h3 className="form-section__title">Детали передачи помещения</h3>
            <div className="form-group">
              <label>Помещение передается с какого числа:</label>
              <input type="date" name="transfer_date_from" value={form.transfer_date_from || ''} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Площадь арендуемого помещения, м²:</label>
                <input type="number" name="premises_area" value={form.premises_area || ''} onChange={handleChange} min="0" step="0.01" />
              </div>
            </div>
            <div className="form-group">
              <label>Помещение расположено по адресу:</label>
              <input name="premises_address" value={form.premises_address || ''} onChange={handleChange} placeholder="Край, Область, Район, Город, Поселок, Улица, Дом и т.д." />
            </div>
          </section>
        )}

        {/* Дополнительная информация для КС-3 */}
        {isKs3 && (
          <section className="form-section">
            <h3 className="form-section__title">Дополнительная информация:</h3>
            <div className="form-group">
              <label>Наименование стройки:</label>
              <input name="construction_name" value={form.construction_name || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Адрес стройки:</label>
              <input name="construction_address" value={form.construction_address || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Вид деятельности по ОКДП:</label>
              <input name="okdp" value={form.okdp || ''} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Договор подряда (контракт) №:</label>
                <input name="contract_number" value={form.contract_number || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>от:</label>
                <input type="date" name="contract_date" value={form.contract_date || ''} onChange={handleChange} placeholder="дд.мм.гггг" />
              </div>
            </div>
            <div className="form-group">
              <label>Вид операции:</label>
              <input name="operation_type" value={form.operation_type || ''} onChange={handleChange} />
            </div>
          </section>
        )}

        {/* Ставка НДС для КС-3 */}
        {isKs3 && (
          <section className="form-section">
            <h3 className="form-section__title">Ставка НДС:</h3>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="no_vat" checked={form.taxation === 'no_vat'} onChange={handleChange} />
                {' '}Без НДС
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_included" checked={form.taxation === 'vat_included'} onChange={handleChange} />
                {' '}с НДС в том числе
              </label>
            </div>
            <div className="form-group">
              <label>
                <input type="radio" name="taxation" value="vat_on_top" checked={form.taxation === 'vat_on_top'} onChange={handleChange} />
                {' '}НДС сверху
              </label>
            </div>
            <button type="button" className="btn btn--ghost btn--sm">применить</button>
          </section>
        )}

        {/* Дополнительные поля для акта КС-2 */}
        {isActAcceptance && (
          <>
            {/* Инвестор */}
            <section className="form-section">
              <h3 className="form-section__title">Инвестор</h3>
              <div className="form-group">
                <label>Инвестор:</label>
                <select name="investor_id" value={form.investor_id ?? ''} onChange={handleChange}>
                  <option value="">— выберите инвестора —</option>
                  {allCounterparties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedInvestor && (
                <div className="doc-org-preview">
                  <div><span className="text-muted">Название:</span> {selectedInvestor.name}</div>
                  {selectedInvestor.address && <div><span className="text-muted">Адрес:</span> {selectedInvestor.address}</div>}
                  <div><span className="text-muted">ИНН:</span> {selectedInvestor.inn} {selectedInvestor.kpp && <>&nbsp;КПП: {selectedInvestor.kpp}</>}</div>
                </div>
              )}
            </section>

            {/* Дополнительная информация */}
            <section className="form-section">
              <h3 className="form-section__title">Дополнительная информация</h3>
              <div className="form-group">
                <label>Наименование стройки:</label>
                <input name="construction_name" value={form.construction_name || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Адрес стройки:</label>
                <input name="construction_address" value={form.construction_address || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Наименование объекта:</label>
                <input name="object_name" value={form.object_name || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Вид деятельности по ОКДП:</label>
                <input name="okdp" value={form.okdp || ''} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Договор подряда (контракт) №:</label>
                  <input name="contract_number" value={form.contract_number || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>от:</label>
                  <input type="date" name="contract_date" value={form.contract_date || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Вид операции:</label>
                <input name="operation_type" value={form.operation_type || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Сметная (договорная) стоимость, руб.:</label>
                <input type="number" name="estimated_cost" value={form.estimated_cost || ''} onChange={handleChange} min="0" step="0.01" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Отчетный период с:</label>
                  <input type="date" name="period_from" value={form.period_from || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>по:</label>
                  <input type="date" name="period_to" value={form.period_to || ''} onChange={handleChange} />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Line items */}
        {!isPremisesTransfer && (
          <section className="form-section">
            <h3 className="form-section__title">
                {isPowerOfAttorney
                ? 'Перечень товарно-материальных ценностей, подлежащих получению'
                : isCommercialOffer
                  ? 'Наименование товаров, работ, услуг коммерческого предложения'
                  : isVatInvoice
                    ? 'Информация о товарах, услугах, работах'
                    : isTorg12
                      ? 'Информация о перевозимом грузе'
                      : isKs3
                        ? 'Наименование строительно-монтажных работ и затрат'
                        : 'Наименование товаров, работ, услуг'}
            </h3>
            {/* Выбор налогообложения для счета на оплату */}
            {isPaymentInvoice && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Налогообложение (применяется ко всем позициям):</label>
                <select name="taxation" value={form.taxation || ''} onChange={handleChange} style={{ maxWidth: 300 }}>
                  {TAXATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          {workTypes.length > 0 && (
            <div className="form-group doc-rates-row">
              <label>Добавить из расценок:</label>
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    const wt = workTypes.find((w) => w.id === Number(id));
                    if (wt) addItemFromRate(wt);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">— выберите расценку —</option>
                {workTypes.filter((w) => w.is_active).map((wt) => (
                  <option key={wt.id} value={wt.id}>{wt.name} — {wt.unit}, {wt.rate.toLocaleString('ru-RU')} ₽</option>
                ))}
              </select>
            </div>
          )}
          <div className="table-wrap">
            <table className="table doc-items-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>№</th>
                  <th>{isPowerOfAttorney ? 'Наименование получаемых предметов' : isVatInvoice ? 'Товар / работа / услуга' : isTorg12 ? 'Товар (наименование)' : isKs3 ? 'Наименование работ и затрат' : 'Наименование'}</th>
                  {isPowerOfAttorney ? (
                    <>
                      <th style={{ width: 120 }}>Количество</th>
                      <th style={{ width: 120 }}>Единица измерения</th>
                    </>
                  ) : isVatInvoice ? (
                    <>
                      <th style={{ width: 80 }}>код</th>
                      <th style={{ width: 100 }}>Код вида товара</th>
                      <th style={{ width: 90 }}>Ед. изм.</th>
                      <th style={{ width: 80 }}>код ОКЕИ</th>
                      <th style={{ width: 70 }}>Кол-во</th>
                      <th style={{ width: 90 }}>Цена</th>
                      <th style={{ width: 100 }}>Сумма</th>
                      <th style={{ width: 70 }}>НДС</th>
                      <th style={{ width: 60 }}>Страна код</th>
                      <th style={{ width: 100 }}>кратк. наимен.</th>
                      <th style={{ width: 100 }}>Рег. № ТД</th>
                    </>
                  ) : isKs3 ? (
                    <>
                      <th style={{ width: 80 }}>Код</th>
                      <th style={{ width: 120 }}>Стоимость с начала работ</th>
                      <th style={{ width: 120 }}>Стоимость с начала года</th>
                      <th style={{ width: 150 }}>Сумма (стоимость за отчетный период)</th>
                      <th style={{ width: 70 }}>НДС</th>
                    </>
                  ) : isTorg12 ? (
                    <>
                      <th style={{ width: 70 }}>код</th>
                      <th style={{ width: 90 }}>Ед. изм.</th>
                      <th style={{ width: 75 }}>код ОКЕИ</th>
                      <th style={{ width: 70 }}>вид уп.</th>
                      <th style={{ width: 65 }}>к.в.о.м</th>
                      <th style={{ width: 65 }}>к.мест</th>
                      <th style={{ width: 90 }}>Масса кг ед.</th>
                      <th style={{ width: 65 }}>Кол-во</th>
                      <th style={{ width: 95 }}>Цена за ед.</th>
                      <th style={{ width: 95 }}>Сумма</th>
                      <th style={{ width: 55 }}>НДС</th>
                    </>
                  ) : (
                    <>
                      <th style={{ width: 90 }}>Ед. изм.</th>
                      <th style={{ width: 80 }}>Кол-во</th>
                      <th style={{ width: 110 }}>Цена</th>
                      <th style={{ width: 110 }}>Сумма</th>
                    </>
                  )}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div className="doc-item-name-cell">
                        <input value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} placeholder="Наименование" className="input-inline" />
                        {!isPowerOfAttorney && workTypes.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id) {
                                const wt = workTypes.find((w) => w.id === Number(id));
                                if (wt) fillRowFromRate(idx, wt);
                                e.target.value = '';
                              }
                            }}
                            className="doc-rate-pick"
                            title="Подставить из расценок"
                          >
                            <option value="">из расценок</option>
                            {workTypes.filter((w) => w.is_active).map((wt) => (
                              <option key={wt.id} value={wt.id}>{wt.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    {isPowerOfAttorney ? (
                      <>
                        <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} min="0" step="any" className="input-inline" /></td>
                        <td><input value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="input-inline" placeholder="ШТ, КГ" /></td>
                      </>
                    ) : isVatInvoice ? (
                      <>
                        <td><input value={item.code || ''} onChange={(e) => handleItemChange(idx, 'code', e.target.value)} className="input-inline" placeholder="код" /></td>
                        <td><input value={item.product_type_code || ''} onChange={(e) => handleItemChange(idx, 'product_type_code', e.target.value)} className="input-inline" placeholder="Код вида товара" /></td>
                        <td><input value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="input-inline" placeholder="шт, кг" /></td>
                        <td><input value={item.okei_code || ''} onChange={(e) => handleItemChange(idx, 'okei_code', e.target.value)} className="input-inline" placeholder="код ОКЕИ" /></td>
                        <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} min="0" step="any" className="input-inline" /></td>
                        <td><input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} min="0" step="0.01" className="input-inline" /></td>
                        <td className="text-right"><strong>{(item.qty * item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</strong></td>
                        <td>
                          <input value="" readOnly className="input-inline" style={{ fontSize: '0.85em', textAlign: 'center' }} placeholder="НДС" />
                        </td>
                        <td><input value={item.country_code || ''} onChange={(e) => handleItemChange(idx, 'country_code', e.target.value)} className="input-inline" placeholder="код" /></td>
                        <td><input value={item.country_name || ''} onChange={(e) => handleItemChange(idx, 'country_name', e.target.value)} className="input-inline" placeholder="кратк. наимен." /></td>
                        <td><input value={item.customs_declaration || ''} onChange={(e) => handleItemChange(idx, 'customs_declaration', e.target.value)} className="input-inline" placeholder="Рег. № ТД" /></td>
                      </>
                    ) : isKs3 ? (
                      <>
                        <td><input value={item.code || ''} onChange={(e) => handleItemChange(idx, 'code', e.target.value)} className="input-inline" placeholder="Код" /></td>
                        <td><input type="number" value={item.cost_from_start || ''} onChange={(e) => handleItemChange(idx, 'cost_from_start', e.target.value)} min="0" step="0.01" className="input-inline" placeholder="Стоимость с начала работ" /></td>
                        <td><input type="number" value={item.cost_from_year_start || ''} onChange={(e) => handleItemChange(idx, 'cost_from_year_start', e.target.value)} min="0" step="0.01" className="input-inline" placeholder="Стоимость с начала года" /></td>
                        <td>
                          <input type="number" value={item.cost_for_period || ''} onChange={(e) => handleItemChange(idx, 'cost_for_period', e.target.value)} min="0" step="0.01" className="input-inline" placeholder="Сумма за отчетный период" />
                          <div style={{ fontSize: '0.75em', color: '#666', marginTop: 2 }}>автосумма</div>
                        </td>
                        <td><span className="text-muted" style={{ fontSize: '0.85em' }}>Без</span></td>
                      </>
                    ) : isTorg12 ? (
                      <>
                        <td><input value={item.code || ''} onChange={(e) => handleItemChange(idx, 'code', e.target.value)} className="input-inline" placeholder="код" /></td>
                        <td><input value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="input-inline" placeholder="шт, кг" /></td>
                        <td><input value={item.okei_code || ''} onChange={(e) => handleItemChange(idx, 'okei_code', e.target.value)} className="input-inline" placeholder="код ОКЕИ" /></td>
                        <td><input value={item.packaging_type || ''} onChange={(e) => handleItemChange(idx, 'packaging_type', e.target.value)} className="input-inline" placeholder="вид уп." /></td>
                        <td><input value={item.packaging_qty || ''} onChange={(e) => handleItemChange(idx, 'packaging_qty', e.target.value)} className="input-inline" placeholder="к.в.о.м" /></td>
                        <td><input value={item.places_count || ''} onChange={(e) => handleItemChange(idx, 'places_count', e.target.value)} className="input-inline" placeholder="к.мест" /></td>
                        <td><input value={item.mass_kg || ''} onChange={(e) => handleItemChange(idx, 'mass_kg', e.target.value)} className="input-inline" placeholder="Масса кг" /></td>
                        <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} min="0" step="any" className="input-inline" /></td>
                        <td><input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} min="0" step="0.01" className="input-inline" /></td>
                        <td className="text-right"><strong>{(item.qty * item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</strong></td>
                        <td><span className="text-muted" style={{ fontSize: '0.85em' }}>Без</span></td>
                      </>
                    ) : (
                      <>
                        <td><input value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="input-inline" /></td>
                        <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} min="0" step="any" className="input-inline" /></td>
                        <td><input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} min="0" step="0.01" className="input-inline" /></td>
                        <td className="text-right"><strong>{(item.qty * item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</strong></td>
                      </>
                    )}
                    <td>
                      <button type="button" className="btn-icon-sm btn-icon-sm--danger" onClick={() => removeItem(idx)} title="Удалить строку">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={addItem}>+ Добавить строку</button>
              {(isTorg12 || isKs3) && (
                <label style={{ marginBottom: 0 }}>
                  <input type="checkbox" name="add_discount_markup" checked={form.add_discount_markup || false} onChange={handleChange} />
                  {' '}добавить скидку/наценку
                </label>
              )}
            </div>
            {!isPowerOfAttorney && (
              <div>
                {isPaymentInvoice && form.taxation && form.taxation !== 'no_vat' ? (
                  <>
                    <div><strong>Итого без НДС: {totals.totalWithoutVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.</strong></div>
                    <div><strong>НДС: {totals.totalVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.</strong></div>
                    <div><strong>Итого к оплате: {totals.totalWithVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.</strong></div>
                    <div style={{ marginTop: 8, fontSize: '0.9em', color: '#666' }}>
                      <strong>Всего к оплате:</strong> {numberToWords(totals.totalWithVat)}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Итого: {total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} руб.</strong>
                    {isPaymentInvoice && (
                      <div style={{ marginTop: 8, fontSize: '0.9em', color: '#666' }}>
                        <strong>Всего к оплате:</strong> {numberToWords(total)}
                      </div>
                    )}
                  </>
                )}
                {(isTorg12 || isKs3) && <><br /><span className="text-muted">Без налога (НДС)</span><br />Всего: {total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</>}
              </div>
            )}
          </div>
          </section>
        )}

        {/* Налогообложение: договор, спецификация, акт о сдаче-приемке (не для ТОРГ-12, счета-фактуры и КС-3 — у них свои блоки) */}
        {showTaxation && !isTorg12 && !isVatInvoice && !isKs3 && (
          <section className="form-section">
            <div className="form-group">
              <label>Налогообложение:</label>
              <select name="taxation" value={form.taxation || ''} onChange={handleChange}>
                {TAXATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {isActAcceptance && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="print_vat_amounts"
                    checked={form.print_vat_amounts || false}
                    onChange={handleChange}
                  />
                  {' '}Печатать также суммы с учётом НДС
                </label>
                <p className="text-muted" style={{ fontSize: '0.9em', marginTop: 4 }}>
                  По умолчанию в стандартном бланке КС-2 печатаются только суммы без учёта НДС.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Текст договора для счёта-договора и счёта-оферты */}
        {isContractInvoice && (
          <section className="form-section">
            <h3 className="form-section__title">Текст договора</h3>
            <div className="form-group">
              <textarea
                name="contract_text"
                value={form.contract_text || ''}
                onChange={handleChange}
                rows={14}
                placeholder={'1. Предмет договора — поставка товаров по перечню ниже.\n2. Оплата означает согласие с условиями.\n3. Счёт-договор действует 5 банковских дней.\n4. Оплата третьими лицами и частичная оплата не допускаются.\n...'}
                style={{ fontFamily: 'inherit', fontSize: '0.95em' }}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="add_buyer_signature"
                  checked={form.add_buyer_signature || false}
                  onChange={handleChange}
                />
                {' '}Добавить поле для подписи покупателя
              </label>
            </div>
          </section>
        )}

        {/* Дополнительные поля для доверенности */}
        {isPowerOfAttorney && (
          <section className="form-section">
            <h3 className="form-section__title">Потребитель ТМЦ:</h3>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="consumer_type"
                  value="same"
                  checked={form.consumer_type === 'same'}
                  onChange={handleChange}
                />
                {' '}она же (организация выдавшая доверенность)
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="consumer_type"
                  value="other"
                  checked={form.consumer_type === 'other'}
                  onChange={handleChange}
                />
                {' '}сторонняя организация
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="consumer_type"
                  value="none"
                  checked={form.consumer_type === 'none'}
                  onChange={handleChange}
                />
                {' '}не указывать
              </label>
            </div>
          </section>
        )}

        {isPowerOfAttorney && (
          <section className="form-section">
            <h3 className="form-section__title">Плательщик:</h3>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="payer_type"
                  value="same"
                  checked={form.payer_type === 'same'}
                  onChange={handleChange}
                />
                {' '}она же (организация выдавшая доверенность)
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="payer_type"
                  value="other"
                  checked={form.payer_type === 'other'}
                  onChange={handleChange}
                />
                {' '}сторонняя организация
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="payer_type"
                  value="none"
                  checked={form.payer_type === 'none'}
                  onChange={handleChange}
                />
                {' '}не указывать
              </label>
            </div>
          </section>
        )}

        {/* Notes */}
        <section className="form-section">
          {isPremisesTransfer ? (
            <>
              <div className="form-group">
                <label>Состояние помещений:</label>
                <textarea name="premises_condition" value={form.premises_condition || ''} onChange={handleChange} rows={3} placeholder="Помещения полностью соответствуют условиям вышеназванного Договора" />
              </div>
              <div className="form-group">
                <label>Комментарий:</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Арендатор не имеет каких-либо претензий к Арендодателю в отношении вышеуказанных Помещений" />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Примечание:</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
            </div>
          )}
        </section>

        <div className="form__actions">
          <button type="button" className="btn btn--secondary" onClick={handleDownload}>
            Скачать .docx
          </button>
          <div className="form__actions-right">
            <button type="button" className="btn btn--secondary" onClick={() => navigate(`/counterparties/${cpId}/documents`)}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
