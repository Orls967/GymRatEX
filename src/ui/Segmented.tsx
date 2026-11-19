interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (v: T) => void;
  testId?: string;
}

/** Kontrol pilihan tunggal bergaya tombol berjajar (radiogroup yang bisa dinavigasi keyboard). */
export function Segmented<T extends string>({ label, value, options, onChange, testId }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex border border-line"
      data-testid={testId}
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              const d = e.key === 'ArrowRight' ? 1 : -1;
              const next = options[(i + d + options.length) % options.length];
              if (next) onChange(next.value);
              const sib = (e.currentTarget.parentElement?.children[
                (i + d + options.length) % options.length
              ] ?? null) as HTMLElement | null;
              sib?.focus();
            }
          }}
          className={`min-h-10 flex-1 px-3 font-display text-base font-semibold uppercase tracking-wide ${
            value === o.value ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
          } ${i > 0 ? 'border-l border-line' : ''}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
