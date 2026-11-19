import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function AboutPage() {
  const { t } = useTranslation();
  return <PageHeader num="07" title={t('about.title')} lead={t('about.lead')} />;
}
