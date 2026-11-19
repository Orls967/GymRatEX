import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ABOUT, EXERCISES, FORM_ERRORS, MUSCLES } from '../content';
import { PageHeader } from '../ui/PageHeader';
import { AutoLinkText } from '../ui/AutoLinkText';
import { useL } from '../ui/useL';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 border-t border-line py-5 md:grid-cols-[14rem_1fr] md:gap-6">
      <h2 className="text-2xl">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();
  const L = useL();
  const principles = t('about.principles', { returnObjects: true });
  const unverified = [
    ...MUSCLES.filter((m) => m.needsVerification).map((m) => ({
      key: m.id,
      label: L(m.name),
      to: `/otot/${m.id}`,
    })),
    ...EXERCISES.filter((e) => e.needsVerification).map((e) => ({
      key: e.id,
      label: L(e.name),
      to: `/latihan/${e.id}`,
    })),
    ...FORM_ERRORS.filter((f) => f.needsVerification).map((f) => ({
      key: f.id,
      label: L(f.title),
      to: `/benar-salah/${f.id}`,
    })),
  ];
  return (
    <div>
      <PageHeader num="07" title={t('about.title')} lead={t('about.lead')} />
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <Section title={t('about.disclaimerTitle')}>
          <div className="border-l-4 border-accent pl-4" data-testid="disclaimer">
            {ABOUT.disclaimer.map((d, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : 'text-lg'}>
                {L(d)}
              </p>
            ))}
          </div>
        </Section>
        <Section title={t('about.principlesTitle')}>
          <ul className="grid gap-1">
            {(Array.isArray(principles) ? principles : []).map((p) => (
              <li key={p} className="grid grid-cols-[1.25rem_1fr]">
                <span aria-hidden className="mt-2.5 h-1.5 w-3 bg-accent" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
        <Section title={t('about.limitsTitle')}>
          <ol className="grid gap-3">
            {ABOUT.limits.map((l, i) => (
              <li key={i} className="grid grid-cols-[2rem_1fr]">
                <span className="font-mono text-sm text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <AutoLinkText text={L(l)} />
                </span>
              </li>
            ))}
          </ol>
        </Section>
        <Section title={t('about.sourcesTitle')}>
          <ul className="grid gap-2">
            {ABOUT.sources.map((s) => (
              <li key={s.label}>
                <span className="font-medium">{s.label}</span>
                <span className="block text-sm text-ink-muted">{L(s.note)}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title={t('about.licensesTitle')}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {ABOUT.licenses.map((l) => (
                <tr key={l.name} className="border-b border-line align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">
                    {l.name}
                    <span className="block font-normal text-ink-muted">{L(l.note)}</span>
                  </th>
                  <td className="py-2 text-right font-mono">{l.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title={t('about.verifyTitle')}>
          <p>{t('about.verifyText')}</p>
          <p className="label-mono mt-2">
            {t('about.verifiedCount', { count: unverified.length })}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {unverified.map((u) => (
              <li key={u.key}>
                <Link to={u.to} className="chip border-dashed hover:text-ink">
                  {u.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
