/**
 * Хуки автозаполнения по ИНН и БИК.
 * Используются в формах организаций и контрагентов.
 */
import { useRef, useCallback } from 'react';
import { lookupByInn, lookupByBik } from '../api/lookup';
import type { InnLookupResult, BikLookupResult } from '../api/lookup';

/**
 * Возвращает функцию, которая вызывает callback не чаще чем раз в `delay` мс.
 */
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    ((...args: unknown[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay],
  );
}

export interface UseInnAutoFillOptions {
  onResult: (data: InnLookupResult) => void;
  onError?: (msg: string) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Автозаполнение по ИНН с debounce 600ms.
 * Вызывать при каждом onChange поля ИНН.
 */
export function useInnAutoFill({ onResult, onError, onLoading }: UseInnAutoFillOptions) {
  const lookup = useCallback(
    async (...args: unknown[]) => {
      const inn = (args[0] as string).replace(/\D/g, '');
      if (inn.length !== 10 && inn.length !== 12) return;
      onLoading?.(true);
      try {
        const result = await lookupByInn(inn);
        if (result.found) {
          onResult(result);
        }
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Ошибка поиска по ИНН');
      } finally {
        onLoading?.(false);
      }
    },
    [onResult, onError, onLoading],
  );

  return useDebouncedCallback(lookup, 600);
}

export interface UseBikAutoFillOptions {
  onResult: (data: BikLookupResult) => void;
  onError?: (msg: string) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Автозаполнение по БИК с debounce 600ms.
 * Вызывать при каждом onChange поля БИК.
 */
export function useBikAutoFill({ onResult, onError, onLoading }: UseBikAutoFillOptions) {
  const lookup = useCallback(
    async (...args: unknown[]) => {
      const bik = (args[0] as string).replace(/\D/g, '');
      if (bik.length !== 9) return;
      onLoading?.(true);
      try {
        const result = await lookupByBik(bik);
        if (result.found) {
          onResult(result);
        }
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Ошибка поиска по БИК');
      } finally {
        onLoading?.(false);
      }
    },
    [onResult, onError, onLoading],
  );

  return useDebouncedCallback(lookup, 600);
}
