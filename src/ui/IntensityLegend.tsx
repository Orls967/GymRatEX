import { useTranslation } from 'react-i18next';

export function IntensityLegend() {
  const { t } = useTranslation();
  const items = [
    { lvl: 3, label: t('exercises.primary') },
    { lvl: 2, label: t('exercises.synergist') },
    { lvl: 1, label: t('exercises.stabilizer') },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label={t('exercises.legend')}>
      <span className="label-mono">{t('exercises.legend')}</span>
      {items.map((i) => (
        <span key={i.lvl} className="flex items-center gap-1.5 text-sm">
          <span
            aria-hidden
            className="inline-block h-3 w-6"
            style={{ background: `var(--c-int-${i.lvl})` }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
