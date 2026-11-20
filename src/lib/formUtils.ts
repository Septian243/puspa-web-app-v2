import { Dispatch, SetStateAction, ChangeEvent } from "react";

export type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type FormChangeEvent = ChangeEvent<FormElement>;

export interface CreateHandleChangeOptions<T> {
  /** Field-field yang otomatis hanya menerima angka (replace \D/g) */
  numericFields?: (keyof T | string)[];

  /** Callback yang dijalankan setiap ada perubahan (misal: reset error/sukses) */
  afterChange?: (name: string, value: any, event: FormChangeEvent) => void;

  /** Custom handler jika ada field dengan logic khusus (misal array checkbox atau format tertentu) */
  customSanitizers?: Partial<
    Record<keyof T | string, (val: any, event: FormChangeEvent, prevForm: T) => any>
  >;
}

/**
 * Utility untuk membuat handleChange standar, typesafe & DRY di form React
 */
export function createHandleChange<T>(
  setForm: Dispatch<SetStateAction<T>>,
  options?: CreateHandleChangeOptions<NonNullable<T>>
) {
  return (e: FormChangeEvent) => {
    const target = e.target as HTMLInputElement;
    const { name, type, value } = target;

    let finalValue: any = value;

    // 1. Handle Checkbox Boolean
    if (type === "checkbox" && !options?.customSanitizers?.[name as keyof NonNullable<T>]) {
      finalValue = target.checked;
    }
    // 2. Handle Telepon / Numeric Fields (Hanya angka, maksimal 14 digit)
    else if (type === "tel" || options?.numericFields?.includes(name as keyof NonNullable<T>)) {
      finalValue = value.replace(/\D/g, "").slice(0, 14);
    }
    // 3. Handle Type Number
    else if (type === "number") {
      finalValue = value === "" ? "" : Number(value);
    }

    // 4. Handle Custom Sanitizer (jika ada)
    const customSanitizer = options?.customSanitizers?.[name as keyof NonNullable<T>];
    if (customSanitizer) {
      setForm((prev) => {
        if (!prev) return prev;
        const transformedValue = customSanitizer(finalValue, e, prev as NonNullable<T>);
        const updated = { ...prev, [name]: transformedValue } as T;
        options?.afterChange?.(name, transformedValue, e);
        return updated;
      });
      return;
    }

    // Update state form
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: finalValue,
      } as T;
    });

    // Jalankan side-effect (misal clear error)
    options?.afterChange?.(name, finalValue, e);
  };
}
