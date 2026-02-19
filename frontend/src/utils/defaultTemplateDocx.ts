/**
 * Генерация шаблона .docx с переменными для последующего редактирования и загрузки.
 * Переменные в формате docxtemplater: {название}, цикл {#items}...{/items}
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
} from 'docx';
import { getDocType } from './documentTypes';

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const CELL_BORDERS = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

function makeCell(text: string, bold = false): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size: 20, font: 'Times New Roman' })],
    })],
  });
}

function p(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold, size: 24, font: 'Times New Roman' })],
  });
}

/** Создаёт .docx-шаблон с плейсхолдерами для типа документа и возвращает Blob */
export async function buildDefaultTemplateDocx(docTypeId: string): Promise<Blob> {
  const info = getDocType(docTypeId);
  const docName = info?.name || docTypeId;

  const children: (Paragraph | Table)[] = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: `${docName} № {doc_number}`, bold: true, size: 28, font: 'Times New Roman' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'от {date}', size: 24, font: 'Times New Roman' })],
  }));
  children.push(p(''));

  children.push(p('Продавец (Исполнитель):', true));
  children.push(p('{seller_name}'));
  children.push(p('ИНН {seller_inn} КПП {seller_kpp}'));
  children.push(p('Адрес: {seller_address}'));
  children.push(p('Р/с {seller_bank}, БИК {seller_bik}, {seller_bank_name}'));
  children.push(p('Руководитель: {seller_director}'));
  children.push(p(''));

  children.push(p('Покупатель (Заказчик):', true));
  children.push(p('{buyer_name}'));
  children.push(p('ИНН {buyer_inn} КПП {buyer_kpp}'));
  children.push(p('Адрес: {buyer_address}'));
  children.push(p('Р/с {buyer_bank}, БИК {buyer_bik}, {buyer_bank_name}'));
  children.push(p('Руководитель: {buyer_director}'));
  children.push(p(''));

  children.push(p('Основание: {basis}'));
  children.push(p(''));

  // Таблица с циклом для позиций (одна строка-шаблон с плейсхолдерами)
  const headerRow = new TableRow({
    children: [
      makeCell('№', true),
      makeCell('Наименование', true),
      makeCell('Ед. изм.', true),
      makeCell('Кол-во', true),
      makeCell('Цена', true),
      makeCell('Сумма', true),
    ],
  });
  const loopRow = new TableRow({
    children: [
      makeCell('{#items}{n}'),
      makeCell('{name}'),
      makeCell('{unit}'),
      makeCell('{qty}'),
      makeCell('{price}'),
      makeCell('{sum}{/items}'),
    ],
  });
  const totalRow = new TableRow({
    children: [
      makeCell(''),
      makeCell(''),
      makeCell(''),
      makeCell(''),
      makeCell('Итого:', true),
      makeCell('{total}'),
    ],
  });
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, loopRow, totalRow],
  }));

  children.push(p(''));
  children.push(p('Примечание: {notes}'));
  children.push(p(''));
  children.push(p('{seller_signature}'));
  children.push(p('{buyer_signature}'));

  const document = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(document);
}
