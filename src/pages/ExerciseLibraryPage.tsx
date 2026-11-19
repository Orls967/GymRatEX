import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function ExerciseLibraryPage() {
  const { t } = useTranslation();
  return <PageHeader num="02" title={t('exercises.title')} lead={t('exercises.lead')} />;
}
