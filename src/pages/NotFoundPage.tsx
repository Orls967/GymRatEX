import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <p className="font-display text-6xl font-bold">404</p>
      <p className="mt-2 text-ink-muted">{t('errors.notFound')}</p>
      <Link to="/" className="btn mt-4">
        {t('errors.backHome')}
      </Link>
    </div>
  );
}
