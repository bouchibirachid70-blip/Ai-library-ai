import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, children }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
