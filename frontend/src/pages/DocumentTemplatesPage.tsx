import { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import { buildDefaultTemplateDocx } from '../utils/defaultTemplateDocx';
import { getStoredTemplate, setStoredTemplate, removeStoredTemplate, arrayBufferToBase64, cleanupRemovedDocTemplates } from '../utils/documentTemplates';
import { DOC_CATEGORIES, DOCUMENT_TYPES, getDocType } from '../utils/documentTypes';

export function DocumentTemplatesPage() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    cleanupRemovedDocTemplates();
  }, []);

  const hasCustom = (docTypeId: string) => !!getStoredTemplate(docTypeId);

  const handleDownload = async (docTypeId: string) => {
    setError('');
    try {
      const blob = await buildDefaultTemplateDocx(docTypeId);
      const info = getDocType(docTypeId);
      const name = (info?.name || docTypeId).replace(/[/\\:*?"<>|]/g, '_');
      saveAs(blob, `Шаблон_${name}.docx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка формирования шаблона');
    }
  };

  const handleFileChange = (docTypeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.docx')) {
      setError('Выберите файл .docx');
      e.target.value = '';
      return;
    }
    setError('');
    setUploading(docTypeId);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = arrayBufferToBase64(reader.result as ArrayBuffer);
        setStoredTemplate(docTypeId, base64);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      }
      setUploading(null);
      e.target.value = '';
    };
    reader.onerror = () => {
      setError('Не удалось прочитать файл');
      setUploading(null);
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemove = (docTypeId: string) => {
    if (!confirm('Вернуть стандартный шаблон для этого типа документа?')) return;
    removeStoredTemplate(docTypeId);
    setError('');
  };

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Шаблоны документов</h2>
      </div>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Скачайте шаблон с переменными, отредактируйте в Word и загрузите обратно. Загруженный шаблон будет использоваться при формировании документов на этом портале.
      </p>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="doc-templates-list">
        {DOC_CATEGORIES.map((cat) => (
          <div key={cat} className="doc-templates-group">
            <h3 className="doc-templates-group__title">{cat}</h3>
            <ul className="doc-templates-group__list">
              {DOCUMENT_TYPES.filter((d) => d.category === cat).map((dt) => (
                <li key={dt.id} className="doc-templates-row">
                  <span className="doc-templates-row__name">{dt.name}</span>
                  <span className="doc-templates-row__badge">
                    {hasCustom(dt.id) ? (
                      <span className="badge badge--success">загружен</span>
                    ) : (
                      <span className="badge badge--default">стандартный</span>
                    )}
                  </span>
                  <div className="doc-templates-row__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleDownload(dt.id)}
                    >
                      Скачать шаблон
                    </button>
                    <label className="btn btn--secondary btn--sm">
                      <input
                        ref={(el) => { fileInputRefs.current[dt.id] = el; }}
                        type="file"
                        accept=".docx"
                        className="visually-hidden"
                        onChange={(e) => handleFileChange(dt.id, e)}
                        disabled={!!uploading}
                      />
                      {uploading === dt.id ? 'Загрузка...' : 'Загрузить шаблон'}
                    </label>
                    {hasCustom(dt.id) && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm text-danger"
                        onClick={() => handleRemove(dt.id)}
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, maxWidth: 800 }}>
        <div className="card__header"><h3>Переменные в шаблоне</h3></div>
        <div className="card__body">
          <p className="text-muted" style={{ marginBottom: 16 }}>В шаблоне можно использовать переменные в фигурных скобках. При формировании документа они будут заменены на данные.</p>
          
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Основная информация</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{doc_number}'}</code> — номер документа</li>
              <li><code>{'{date}'}</code> — дата документа</li>
              <li><code>{'{basis}'}</code> — основание</li>
              <li><code>{'{taxation}'}</code> — налогообложение (текст, например "Без НДС", "НДС 20%")</li>
              <li><code>{'{total}'}</code> — итоговая сумма</li>
              <li><code>{'{notes}'}</code> — примечания</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Информация о продавце</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{seller_name}'}</code> — название организации</li>
              <li><code>{'{seller_inn}'}</code> — ИНН</li>
              <li><code>{'{seller_kpp}'}</code> — КПП</li>
              <li><code>{'{seller_address}'}</code> — адрес</li>
              <li><code>{'{seller_bank}'}</code> — расчетный счет</li>
              <li><code>{'{seller_bik}'}</code> — БИК</li>
              <li><code>{'{seller_bank_name}'}</code> — наименование банка</li>
              <li><code>{'{seller_director}'}</code> — должность и ФИО руководителя</li>
              <li><code>{'{seller_signature}'}</code> — строка для подписи продавца</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Информация о покупателе</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{buyer_name}'}</code> — название организации</li>
              <li><code>{'{buyer_inn}'}</code> — ИНН</li>
              <li><code>{'{buyer_kpp}'}</code> — КПП</li>
              <li><code>{'{buyer_address}'}</code> — адрес</li>
              <li><code>{'{buyer_bank}'}</code> — расчетный счет</li>
              <li><code>{'{buyer_bik}'}</code> — БИК</li>
              <li><code>{'{buyer_bank_name}'}</code> — наименование банка</li>
              <li><code>{'{buyer_director}'}</code> — должность и ФИО руководителя</li>
              <li><code>{'{buyer_signature}'}</code> — строка для подписи покупателя</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Информация об инвесторе (для актов КС-2, КС-3)</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{investor_name}'}</code> — название организации инвестора</li>
              <li><code>{'{investor_inn}'}</code> — ИНН инвестора</li>
              <li><code>{'{investor_kpp}'}</code> — КПП инвестора</li>
              <li><code>{'{investor_address}'}</code> — адрес инвестора</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Таблица позиций</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: 8 }}>Используйте цикл <code>{'{#items}'}</code> … <code>{'{/items}'}</code> для перебора всех позиций:</p>
            <ul className="doc-templates-vars">
              <li><code>{'{n}'}</code> — номер строки</li>
              <li><code>{'{name}'}</code> — наименование</li>
              <li><code>{'{unit}'}</code> — единица измерения</li>
              <li><code>{'{qty}'}</code> — количество</li>
              <li><code>{'{price}'}</code> — цена</li>
              <li><code>{'{sum}'}</code> — сумма (qty × price)</li>
              <li><code>{'{code}'}</code> — код товара/работы</li>
              <li><code>{'{okei_code}'}</code> — код ОКЕИ</li>
            </ul>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 8, marginBottom: 4 }}>Дополнительные поля для ТОРГ-12:</p>
            <ul className="doc-templates-vars">
              <li><code>{'{packaging_type}'}</code> — вид упаковки</li>
              <li><code>{'{packaging_qty}'}</code> — количество в одной упаковке</li>
              <li><code>{'{places_count}'}</code> — количество мест</li>
              <li><code>{'{mass_kg}'}</code> — масса в кг единицы</li>
            </ul>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 8, marginBottom: 4 }}>Дополнительные поля для КС-3:</p>
            <ul className="doc-templates-vars">
              <li><code>{'{cost_from_start}'}</code> — стоимость с начала работ</li>
              <li><code>{'{cost_from_year_start}'}</code> — стоимость с начала года</li>
              <li><code>{'{cost_for_period}'}</code> — стоимость за отчетный период</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Акт о сдаче-приемке выполненных работ (КС-2)</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{construction_name}'}</code> — наименование стройки</li>
              <li><code>{'{construction_address}'}</code> — адрес стройки</li>
              <li><code>{'{object_name}'}</code> — наименование объекта</li>
              <li><code>{'{okdp}'}</code> — вид деятельности по ОКДП</li>
              <li><code>{'{contract_number}'}</code> — номер договора подряда</li>
              <li><code>{'{contract_date}'}</code> — дата договора подряда</li>
              <li><code>{'{operation_type}'}</code> — вид операции</li>
              <li><code>{'{estimated_cost}'}</code> — сметная (договорная) стоимость</li>
              <li><code>{'{period_from}'}</code> — отчетный период с</li>
              <li><code>{'{period_to}'}</code> — отчетный период по</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Акт приема-передачи помещения</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{contract_creation_date}'}</code> — дата составления договора</li>
              <li><code>{'{contract_location}'}</code> — населенный пункт составления договора</li>
              <li><code>{'{premises_area}'}</code> — площадь помещения, м²</li>
              <li><code>{'{premises_address}'}</code> — адрес помещения</li>
              <li><code>{'{transfer_date_from}'}</code> — дата передачи помещения</li>
              <li><code>{'{premises_condition}'}</code> — состояние помещений</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Доверенность на получение ТМЦ</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{valid_until}'}</code> — срок действия доверенности</li>
              <li><code>{'{goods_source}'}</code> — от кого получить товар</li>
              <li><code>{'{person_name_dative}'}</code> — ФИО получателя в дательном падеже</li>
              <li><code>{'{passport_series}'}</code> — серия паспорта</li>
              <li><code>{'{passport_number}'}</code> — номер паспорта</li>
              <li><code>{'{passport_issued_by}'}</code> — кем выдан паспорт</li>
              <li><code>{'{passport_issue_date}'}</code> — дата выдачи паспорта</li>
              <li><code>{'{consumer_type}'}</code> — тип потребителя ТМЦ</li>
              <li><code>{'{payer_type}'}</code> — тип плательщика</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Коммерческое предложение</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{text_above}'}</code> — текст сверху коммерческого предложения</li>
              <li><code>{'{text_below}'}</code> — текст снизу коммерческого предложения</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Счет-договор и счет-оферта</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{payment_purpose}'}</code> — назначение платежа</li>
              <li><code>{'{delivery_address}'}</code> — адрес доставки</li>
              <li><code>{'{contract_text}'}</code> — текст договора</li>
              <li><code>{'{add_buyer_signature}'}</code> — добавить поле для подписи покупателя (true/false)</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Счет-фактура</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{correction_number}'}</code> — номер исправления</li>
              <li><code>{'{correction_date}'}</code> — дата исправления</li>
              <li><code>{'{advance_invoice}'}</code> — счет-фактура на авансовый платеж</li>
              <li><code>{'{payment_doc_number}'}</code> — номер платежно-расчетного документа</li>
              <li><code>{'{payment_doc_date}'}</code> — дата платежно-расчетного документа</li>
              <li><code>{'{shipment_doc_name}'}</code> — наименование документа об отгрузке</li>
              <li><code>{'{shipment_doc_number}'}</code> — номер документа об отгрузке</li>
              <li><code>{'{shipment_doc_date}'}</code> — дата документа об отгрузке</li>
              <li><code>{'{had_advance_invoices}'}</code> — были авансовые счет-фактуры (true/false)</li>
              <li><code>{'{state_contract_id}'}</code> — идентификатор государственного контракта</li>
              <li><code>{'{currency}'}</code> — валюта</li>
              <li><code>{'{form_version}'}</code> — версия бланка</li>
              <li><code>{'{shipper_type}'}</code> — тип грузоотправителя</li>
              <li><code>{'{consignee_type}'}</code> — тип грузополучателя</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Товарная накладная ТОРГ-12</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{torg12_form_version}'}</code> — версия бланка ТОРГ-12</li>
              <li><code>{'{torg12_supplier_type}'}</code> — тип поставщика</li>
              <li><code>{'{torg12_consignee_type}'}</code> — тип грузополучателя</li>
              <li><code>{'{basis_number}'}</code> — номер основания</li>
              <li><code>{'{basis_date}'}</code> — дата основания</li>
              <li><code>{'{basis_number2}'}</code> — номер основания (второй)</li>
              <li><code>{'{basis_date2}'}</code> — дата основания (вторая)</li>
              <li><code>{'{transport_waybill_name}'}</code> — наименование транспортной накладной</li>
              <li><code>{'{transport_waybill_number}'}</code> — номер транспортной накладной</li>
              <li><code>{'{transport_waybill_date}'}</code> — дата транспортной накладной</li>
              <li><code>{'{attachment_sheets}'}</code> — количество листов приложения</li>
              <li><code>{'{shipment_date_matches_doc}'}</code> — дата отгрузки совпадает с датой составления (true/false)</li>
              <li><code>{'{shipment_date}'}</code> — дата отгрузки товара</li>
              <li><code>{'{add_discount_markup}'}</code> — добавить скидку/наценку (true/false)</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Справка КС-3</h4>
            <ul className="doc-templates-vars">
              <li><code>{'{ks3_reporting_period_from}'}</code> — отчетный период с</li>
              <li><code>{'{ks3_reporting_period_to}'}</code> — отчетный период по</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
