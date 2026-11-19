import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function StudioPage() {
  const { t } = useTranslation();
  return <PageHeader num="03" title={t('studio.title')} lead={t('studio.lead')} />;
}
