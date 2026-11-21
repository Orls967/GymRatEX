import { useTranslation } from 'react-i18next';

/** Penampung saat chunk halaman dimuat: tinggi dijaga (footer tidak meloncat), teks muncul terlambat. */
export function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto min-h-[70dvh] max-w-7xl px-4 py-16" role="status" aria-live="polite">
      <p className="label-mono fallback-delay">{t('app.loading')}</p>
    </div>
  );
}
