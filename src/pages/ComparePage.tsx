import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function ComparePage() {
  const { t } = useTranslation();
  return <PageHeader num="04" title={t('compare.title')} lead={t('compare.lead')} />;
}
