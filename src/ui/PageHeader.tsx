import type { ReactNode } from 'react';

interface Props {
  num?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ num, title, lead, children }: Props) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto grid max-w-7xl gap-2 px-4 pb-4 pt-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          {num && <p className="label-mono">{num}</p>}
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {lead && <p className="mt-2 max-w-2xl text-ink-muted">{lead}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}
