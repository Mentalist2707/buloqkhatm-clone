import { useEffect, useState } from "react";

/**
 * Kiritilgan qiymatni belgilangan vaqt (ms) dan keyin qaytaradi.
 * Qidiruv inputlarida server yuklamasini kamaytirish uchun ishlatiladi.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
