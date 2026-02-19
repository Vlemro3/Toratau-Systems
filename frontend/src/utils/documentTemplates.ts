/**
 * Хранение шаблонов документов (.docx) для портала.
 * В режиме без бэкенда используется localStorage (ключ portal_doc_template_${docType}).
 */

const STORAGE_PREFIX = 'portal_doc_template_';

/** ID типов документов, удалённых из системы — очистка их шаблонов из localStorage */
const REMOVED_DOC_TYPE_IDS = [
  'contract_apartment_sale',
  'contract_apartment_rent',
  'contract_nonresidential_rent',
  'contract_loan',
  'contract_car_sale',
  'contract_land_house',
  'act_reconciliation',
  'act_writeoff',
  'act_car_transfer',
  'upd',
  'travel_cert',
  'cash_receipt_order',
  'waybill_car',
  'invoice_goods',
  'cash_expense_order',
  'advance_report',
  'work_order',
  'transport_invoice_2021',
  'ttn',
  'sales_receipt',
  'cash_book',
  'cashier_report',
];

export function cleanupRemovedDocTemplates(): void {
  REMOVED_DOC_TYPE_IDS.forEach((id) => removeStoredTemplate(id));
}

export function getStoredTemplate(docType: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + docType);
  } catch {
    return null;
  }
}

export function setStoredTemplate(docType: string, base64: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + docType, base64);
  } catch (e) {
    throw new Error('Не удалось сохранить шаблон (возможно, превышен лимит хранилища)');
  }
}

export function removeStoredTemplate(docType: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + docType);
  } catch {}
}

export function hasStoredTemplate(docType: string): boolean {
  return !!getStoredTemplate(docType);
}

/** Декодирование base64 в бинарный массив для PizZip */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Кодирование файла (ArrayBuffer) в base64 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
