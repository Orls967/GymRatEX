import { useId } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  testId?: string;
}

export function Slider({ label, value, min, max, step, onChange, format, testId }: Props) {
  const id = useId();
  const shown = format ? format(value) : String(value);
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="label-mono">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-sm tabular-nums">
          {shown}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={shown}
        className="h-8 w-full"
        data-testid={testId}
      />
    </div>
  );
}
