import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function GlossaryPage() {
  const { t } = useTranslation();
  return <PageHeader num="06" title={t('glossary.title')} lead={t('glossary.lead')} />;
}
