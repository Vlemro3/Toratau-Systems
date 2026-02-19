import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
} from 'docx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import type { CpDocument, Counterparty, Organization } from '../types';
import { getDocType } from './documentTypes';
import { getStoredTemplate, base64ToArrayBuffer } from './documentTemplates';

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const CELL_BORDERS = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

function fmtMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeCell(text: string, bold = false, width?: number): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size: 20, font: 'Times New Roman' })],
    })],
  });
}

function buildItemsTable(doc: CpDocument): Table {
  const headerRow = new TableRow({
    children: [
      makeCell('№', true, 600),
      makeCell('Наименование', true, 4000),
      makeCell('Ед. изм.', true, 1000),
      makeCell('Кол-во', true, 1000),
      makeCell('Цена', true, 1400),
      makeCell('Сумма', true, 1400),
    ],
  });

  const dataRows = doc.items.map((item, i) =>
    new TableRow({
      children: [
        makeCell(String(i + 1), false, 600),
        makeCell(item.name, false, 4000),
        makeCell(item.unit, false, 1000),
        makeCell(String(item.qty), false, 1000),
        makeCell(fmtMoney(item.price), false, 1400),
        makeCell(fmtMoney(item.qty * item.price), false, 1400),
      ],
    })
  );

  const totalRow = new TableRow({
    children: [
      makeCell('', false, 600),
      makeCell('', false, 4000),
      makeCell('', false, 1000),
      makeCell('', false, 1000),
      makeCell('Итого:', true, 1400),
      makeCell(fmtMoney(doc.total), true, 1400),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows, totalRow],
  });
}

function p(text: string, options?: { bold?: boolean; size?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] }): Paragraph {
  return new Paragraph({
    alignment: options?.alignment,
    heading: options?.heading,
    spacing: { after: 100 },
    children: [new TextRun({
      text,
      bold: options?.bold,
      size: options?.size ?? 24,
      font: 'Times New Roman',
    })],
  });
}

function getTaxationLabel(taxation?: string): string {
  const labels: Record<string, string> = {
    'no_vat': 'Без НДС',
    'vat_20': 'НДС 20%',
    'vat_10': 'НДС 10%',
    'vat_0': 'НДС 0%',
    'vat_included': 'с НДС в том числе',
    'vat_on_top': 'НДС сверху',
    'usn': 'УСН (упрощенная система налогообложения)',
    'usn_income': 'УСН доходы',
    'usn_income_expense': 'УСН доходы минус расходы',
  };
  return taxation ? (labels[taxation] || taxation) : 'Без НДС';
}

function buildTemplateData(
  doc: CpDocument,
  counterparty: Counterparty,
  organization: Organization | null,
  dateStr: string,
  investor?: Counterparty | null,
) {
  const items = doc.items.map((item, i) => ({
    n: i + 1,
    name: item.name,
    unit: item.unit,
    qty: item.qty,
    price: fmtMoney(item.price),
    sum: fmtMoney(item.qty * item.price),
    code: item.code ?? '',
    okei_code: item.okei_code ?? '',
    packaging_type: item.packaging_type ?? '',
    packaging_qty: item.packaging_qty ?? '',
    places_count: item.places_count ?? '',
    mass_kg: item.mass_kg ?? '',
    cost_from_start: item.cost_from_start ? fmtMoney(item.cost_from_start) : '',
    cost_from_year_start: item.cost_from_year_start ? fmtMoney(item.cost_from_year_start) : '',
    cost_for_period: item.cost_for_period ? fmtMoney(item.cost_for_period) : '',
  }));
  return {
    doc_number: doc.number || '___',
    date: dateStr,
    seller_name: organization?.name ?? '',
    seller_inn: organization?.inn ?? '',
    seller_kpp: organization?.kpp ?? '',
    seller_address: organization?.address ?? '',
    seller_bank: organization?.bank_account ?? '',
    seller_bik: organization?.bik ?? '',
    seller_bank_name: organization?.bank_name ?? '',
    seller_director: organization?.director_title && organization?.director_name ? `${organization.director_title} ${organization.director_name}` : '',
    buyer_name: counterparty.name,
    buyer_inn: counterparty.inn ?? '',
    buyer_kpp: counterparty.kpp ?? '',
    buyer_address: counterparty.address ?? '',
    buyer_bank: counterparty.bank_account ?? '',
    buyer_bik: counterparty.bik ?? '',
    buyer_bank_name: counterparty.bank_name ?? '',
    buyer_director: counterparty.director_title && counterparty.director_name ? `${counterparty.director_title} ${counterparty.director_name}` : '',
    investor_name: investor?.name ?? '',
    investor_inn: investor?.inn ?? '',
    investor_kpp: investor?.kpp ?? '',
    investor_address: investor?.address ?? '',
    basis: doc.basis ?? '',
    items,
    total: fmtMoney(doc.total),
    notes: doc.notes ?? '',
    taxation: getTaxationLabel(doc.taxation),
    construction_name: doc.construction_name ?? '',
    construction_address: doc.construction_address ?? '',
    object_name: doc.object_name ?? '',
    okdp: doc.okdp ?? '',
    contract_number: doc.contract_number ?? '',
    contract_date: doc.contract_date ? new Date(doc.contract_date).toLocaleDateString('ru-RU') : '',
    operation_type: doc.operation_type ?? '',
    estimated_cost: doc.estimated_cost ? fmtMoney(doc.estimated_cost) : '',
    period_from: doc.period_from ? new Date(doc.period_from).toLocaleDateString('ru-RU') : '',
    period_to: doc.period_to ? new Date(doc.period_to).toLocaleDateString('ru-RU') : '',
    contract_creation_date: doc.contract_creation_date ? new Date(doc.contract_creation_date).toLocaleDateString('ru-RU') : '',
    contract_location: doc.contract_location ?? '',
    premises_area: doc.premises_area ? String(doc.premises_area) : '',
    premises_address: doc.premises_address ?? '',
    transfer_date_from: doc.transfer_date_from ? new Date(doc.transfer_date_from).toLocaleDateString('ru-RU') : '',
    premises_condition: doc.premises_condition ?? '',
    valid_until: doc.valid_until ? new Date(doc.valid_until).toLocaleDateString('ru-RU') : '',
    goods_source: doc.goods_source ?? '',
    person_name_dative: doc.person_name_dative ?? '',
    passport_series: doc.passport_series ?? '',
    passport_number: doc.passport_number ?? '',
    passport_issued_by: doc.passport_issued_by ?? '',
    passport_issue_date: doc.passport_issue_date ? new Date(doc.passport_issue_date).toLocaleDateString('ru-RU') : '',
    consumer_type: doc.consumer_type ?? '',
    payer_type: doc.payer_type ?? '',
    text_above: doc.text_above ?? '',
    text_below: doc.text_below ?? '',
    payment_purpose: doc.payment_purpose ?? '',
    delivery_address: doc.delivery_address ?? '',
    contract_text: doc.contract_text ?? '',
    add_buyer_signature: doc.add_buyer_signature ?? false,
    correction_number: doc.correction_number ?? '',
    correction_date: doc.correction_date ? new Date(doc.correction_date).toLocaleDateString('ru-RU') : '',
    advance_invoice: doc.advance_invoice ?? '',
    payment_doc_number: doc.payment_doc_number ?? '',
    payment_doc_date: doc.payment_doc_date ? new Date(doc.payment_doc_date).toLocaleDateString('ru-RU') : '',
    shipment_doc_name: doc.shipment_doc_name ?? '',
    shipment_doc_number: doc.shipment_doc_number ?? '',
    shipment_doc_date: doc.shipment_doc_date ? new Date(doc.shipment_doc_date).toLocaleDateString('ru-RU') : '',
    had_advance_invoices: doc.had_advance_invoices ?? false,
    state_contract_id: doc.state_contract_id ?? '',
    currency: doc.currency ?? 'RUB',
    form_version: doc.form_version ?? '',
    shipper_type: doc.shipper_type ?? '',
    consignee_type: doc.consignee_type ?? '',
    torg12_form_version: doc.torg12_form_version ?? '',
    torg12_supplier_type: doc.torg12_supplier_type ?? '',
    torg12_consignee_type: doc.torg12_consignee_type ?? '',
    basis_number: doc.basis_number ?? '',
    basis_date: doc.basis_date ? new Date(doc.basis_date).toLocaleDateString('ru-RU') : '',
    basis_number2: doc.basis_number2 ?? '',
    basis_date2: doc.basis_date2 ? new Date(doc.basis_date2).toLocaleDateString('ru-RU') : '',
    transport_waybill_name: doc.transport_waybill_name ?? '',
    transport_waybill_number: doc.transport_waybill_number ?? '',
    transport_waybill_date: doc.transport_waybill_date ? new Date(doc.transport_waybill_date).toLocaleDateString('ru-RU') : '',
    attachment_sheets: doc.attachment_sheets ?? 0,
    shipment_date_matches_doc: doc.shipment_date_matches_doc ?? false,
    shipment_date: doc.shipment_date ? new Date(doc.shipment_date).toLocaleDateString('ru-RU') : '',
    add_discount_markup: doc.add_discount_markup ?? false,
    ks3_reporting_period_from: doc.ks3_reporting_period_from ? new Date(doc.ks3_reporting_period_from).toLocaleDateString('ru-RU') : '',
    ks3_reporting_period_to: doc.ks3_reporting_period_to ? new Date(doc.ks3_reporting_period_to).toLocaleDateString('ru-RU') : '',
    seller_signature: organization?.director_name ? `${organization.director_title || 'Руководитель'} _________________ / ${organization.director_name} /` : '',
    buyer_signature: counterparty.director_name ? `${counterparty.director_title || 'Руководитель'} _________________ / ${counterparty.director_name} /` : '',
  };
}

export async function generateAndDownloadDocx(
  doc: CpDocument,
  counterparty: Counterparty,
  organization?: Organization | null,
  investor?: Counterparty | null,
) {
  const docType = getDocType(doc.doc_type);
  const docName = docType?.name || doc.doc_type;
  const dateStr = new Date(doc.date).toLocaleDateString('ru-RU');
  const fileName = `${docName} №${doc.number || '___'} от ${dateStr}.docx`.replace(/[/\\:*?"<>|]/g, '_');

  const customTemplateBase64 = getStoredTemplate(doc.doc_type);
  if (customTemplateBase64) {
    try {
      const arrayBuffer = base64ToArrayBuffer(customTemplateBase64);
      const zip = new PizZip(arrayBuffer);
      const docxtemplater = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      const data = buildTemplateData(doc, counterparty, organization ?? null, dateStr, investor ?? null);
      docxtemplater.render(data);
      const blob = docxtemplater.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(blob as Blob, fileName);
      return;
    } catch (err) {
      console.warn('Ошибка при заполнении загруженного шаблона, используется стандартная генерация:', err);
    }
  }

  const isActAcceptance = doc.doc_type === 'act_acceptance' || doc.doc_type === 'act_ks2';
  const sections: Paragraph[] = [];

  sections.push(p(`${docName} № ${doc.number || '___'}`, { bold: true, size: 28, alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }));
  sections.push(p(`от ${dateStr}`, { alignment: AlignmentType.CENTER }));
  sections.push(p(''));

  // Для акта КС-2: Инвестор
  if (isActAcceptance && investor) {
    sections.push(p('Инвестор:', { bold: true }));
    sections.push(p(`${investor.name}${investor.inn ? ', ИНН ' + investor.inn : ''}${investor.kpp ? ', КПП ' + investor.kpp : ''}`));
    if (investor.address) sections.push(p(`Адрес: ${investor.address}`));
    sections.push(p(''));
  }

  // Для акта КС-2: Заказчик (Генподрядчик)
  if (isActAcceptance) {
    sections.push(p('Заказчик (Генподрядчик):', { bold: true }));
  } else {
    sections.push(p('Покупатель (Заказчик):', { bold: true }));
  }
  sections.push(p(`${counterparty.name}, ИНН ${counterparty.inn}${counterparty.kpp ? ', КПП ' + counterparty.kpp : ''}`));
  if (counterparty.address) sections.push(p(`Адрес: ${counterparty.address}`));
  if (counterparty.bank_account) {
    sections.push(p(`Р/с ${counterparty.bank_account}, БИК ${counterparty.bik}, ${counterparty.bank_name}`));
  }
  if (counterparty.director_name) sections.push(p(`Руководитель: ${counterparty.director_title} ${counterparty.director_name}`));
  sections.push(p(''));

  // Для акта КС-2: Подрядчик (Субподрядчик)
  if (isActAcceptance && organization) {
    sections.push(p('Подрядчик (Субподрядчик):', { bold: true }));
    sections.push(p(`${organization.name}, ИНН ${organization.inn}${organization.kpp ? ', КПП ' + organization.kpp : ''}`));
    if (organization.address) sections.push(p(`Адрес: ${organization.address}`));
    if (organization.bank_account) {
      sections.push(p(`Р/с ${organization.bank_account}, БИК ${organization.bik}, ${organization.bank_name}`));
    }
    if (organization.director_name) sections.push(p(`Руководитель: ${organization.director_title} ${organization.director_name}`));
    sections.push(p(''));
  } else if (organization) {
    sections.push(p('Продавец (Исполнитель):', { bold: true }));
    sections.push(p(`${organization.name}, ИНН ${organization.inn}${organization.kpp ? ', КПП ' + organization.kpp : ''}`));
    if (organization.address) sections.push(p(`Адрес: ${organization.address}`));
    if (organization.bank_account) {
      sections.push(p(`Р/с ${organization.bank_account}, БИК ${organization.bik}, ${organization.bank_name}`));
    }
    if (organization.director_name) sections.push(p(`Руководитель: ${organization.director_title} ${organization.director_name}`));
    sections.push(p(''));
  }

  // Для акта КС-2: Дополнительная информация
  if (isActAcceptance) {
    if (doc.construction_name) {
      sections.push(p(`Стройка: ${doc.construction_name}${doc.construction_address ? ', ' + doc.construction_address : ''}`));
    }
    if (doc.object_name) {
      sections.push(p(`Объект: ${doc.object_name}`));
    }
    if (doc.okdp) {
      sections.push(p(`Вид деятельности по ОКДП: ${doc.okdp}`));
    }
    if (doc.contract_number || doc.contract_date) {
      const contractDate = doc.contract_date ? new Date(doc.contract_date).toLocaleDateString('ru-RU') : '';
      sections.push(p(`Договор подряда (контракт): № ${doc.contract_number || '___'}${contractDate ? ' от ' + contractDate : ''}`));
    }
    if (doc.operation_type) {
      sections.push(p(`Вид операции: ${doc.operation_type}`));
    }
    if (doc.period_from || doc.period_to) {
      const from = doc.period_from ? new Date(doc.period_from).toLocaleDateString('ru-RU') : '___';
      const to = doc.period_to ? new Date(doc.period_to).toLocaleDateString('ru-RU') : '___';
      sections.push(p(`Отчетный период: с ${from} по ${to}`));
    }
    if (doc.estimated_cost !== undefined) {
      sections.push(p(`Сметная (договорная) стоимость: ${fmtMoney(doc.estimated_cost)} руб.`));
    }
    sections.push(p(''));
  }

  if (doc.basis && !isActAcceptance) {
    sections.push(p(`Основание: ${doc.basis}`));
    sections.push(p(''));
  }

  const children: (Paragraph | Table)[] = [...sections];

  if (doc.items.length > 0) {
    children.push(buildItemsTable(doc));
    children.push(p(''));
    children.push(p(`Итого: ${fmtMoney(doc.total)} руб.`, { bold: true }));
    children.push(p(getTaxationLabel(doc.taxation)));
    children.push(p(`Всего к оплате: ${fmtMoney(doc.total)} руб.`, { bold: true }));
  }

  children.push(p(''));

  if (doc.notes) {
    children.push(p(doc.notes));
    children.push(p(''));
  }

  children.push(p(''));
  children.push(p(''));

  if (organization) {
    children.push(p(`${organization.director_title || 'Руководитель'} _________________ / ${organization.director_name || '_______________'} /`));
  }
  children.push(p(''));
  children.push(p(`${counterparty.director_title || 'Руководитель'} _________________ / ${counterparty.director_name || '_______________'} /`));

  const document = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, fileName);
}
