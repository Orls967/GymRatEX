import { useTranslation } from 'react-i18next';

export function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-16" role="status" aria-live="polite">
      <p className="label-mono">{t('app.loading')}</p>
    </div>
  );
}
