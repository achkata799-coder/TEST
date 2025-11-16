import { ReactNode } from 'react';

export default function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">{children}</span>;
}
