/** Mengubah objek literal menjadi bentuk "struktur sama, nilai string" agar EN wajib punya kunci yang sama dengan ID. */
export type LocaleShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? LocaleShape<U>[]
    : { [K in keyof T]: LocaleShape<T[K]> };
