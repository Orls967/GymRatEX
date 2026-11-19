import { useTranslation } from 'react-i18next';
import { PageHeader } from '../ui/PageHeader';

export default function WebcamPage() {
  const { t } = useTranslation();
  return <PageHeader num="05" title={t('webcam.title')} lead={t('webcam.lead')} />;
}
