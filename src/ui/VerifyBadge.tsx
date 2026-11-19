import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function VerifyBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 border border-dashed border-line-strong px-1.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-ink-muted">
      <AlertTriangle size={12} aria-hidden />
      {t('common.needsVerification')}
    </span>
  );
}
