/**
 * API-клиент для автозаполнения по ИНН и БИК (DaData через бэкенд-прокси).
 */
import { api } from './client';

export interface InnLookupResult {
  found: boolean;
  org_type?: string;
  name?: string;
  full_name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  ogrn_date?: string;
  address?: string;
  director_title?: string;
  director_name?: string;
}

export interface BikLookupResult {
  found: boolean;
  bik?: string;
  bank_name?: string;
  corr_account?: string;
  bank_address?: string;
}

export function lookupByInn(inn: string): Promise<InnLookupResult> {
  return api.get<InnLookupResult>(`/lookup/inn/${inn.trim()}`);
}

export function lookupByBik(bik: string): Promise<BikLookupResult> {
  return api.get<BikLookupResult>(`/lookup/bik/${bik.trim()}`);
}
