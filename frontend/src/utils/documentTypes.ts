export interface DocTypeInfo {
  id: string;
  name: string;
  category: string;
}

export const DOC_CATEGORIES = ['Договоры', 'Акты', 'Бухгалтерия и касса'] as const;

export const DOCUMENT_TYPES: DocTypeInfo[] = [
  // Договоры
  { id: 'contract_sale', name: 'Договор подряда', category: 'Договоры' },
  { id: 'contract_spec', name: 'Спецификация к договору', category: 'Договоры' },
  // Акты
  { id: 'act_acceptance', name: 'Акт о сдаче-приемке выполненных работ', category: 'Акты' },
  { id: 'act_ks2', name: 'Акт КС-2 о сдаче-приемке строительно-монтажных работ', category: 'Акты' },
  { id: 'act_premises_transfer', name: 'Акт приема-передачи помещения', category: 'Акты' },
  // Бухгалтерия и касса
  { id: 'power_of_attorney', name: 'Доверенность на получение ТМЦ', category: 'Бухгалтерия и касса' },
  { id: 'commercial_offer', name: 'Коммерческое предложение', category: 'Бухгалтерия и касса' },
  { id: 'payment_invoice', name: 'Счет на оплату', category: 'Бухгалтерия и касса' },
  { id: 'contract_invoice', name: 'Счёт-договор и счёт-оферта', category: 'Бухгалтерия и касса' },
  { id: 'vat_invoice', name: 'Счёт-фактура', category: 'Бухгалтерия и касса' },
  { id: 'torg12', name: 'Товарная накладная форма № ТОРГ-12', category: 'Бухгалтерия и касса' },
  { id: 'ks3', name: 'Справка КС-3', category: 'Бухгалтерия и касса' },
];

export function getDocType(id: string): DocTypeInfo | undefined {
  return DOCUMENT_TYPES.find((d) => d.id === id);
}
