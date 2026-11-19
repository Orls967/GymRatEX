import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function MuscleMapPage() {
  const { t } = useTranslation();
  return <PageHeader num="01" title={t('muscles.title')} lead={t('muscles.lead')} />;
}
