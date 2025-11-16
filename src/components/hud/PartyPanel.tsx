'use client';

import { useGameStore } from '@/stores/useGameStore';

export default function PartyPanel() {
  const { party } = useGameStore();
  return (
    <section className="card-sheen rounded-3xl p-4 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Party</p>
        <h3 className="text-lg font-display text-white">Turn order & vitality</h3>
      </header>
      <div>
        <p className="text-xs text-slate-400">Initiative order</p>
        <ol className="mt-2 space-y-1 text-sm text-slate-100">
          {party.initiative.map((entry, index) => (
            <li key={entry.name} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2">
              <span>
                {index + 1}. {entry.name}
              </span>
              <span className="text-amber-300">{entry.value}</span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="text-xs text-slate-400">Vital signs</p>
        <div className="mt-2 space-y-2">
          {party.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-200">{member.name}</span>
              <span className="text-emerald-300">
                {member.hp.current}/{member.hp.max} HP
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
