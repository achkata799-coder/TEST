'use client';

import { useGameStore } from '@/stores/useGameStore';

export default function WorldStatePanel() {
  const { world } = useGameStore();
  return (
    <section className="card-sheen rounded-3xl p-4 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">World State</p>
        <h3 className="text-lg font-display text-white">{world.location}</h3>
        <p className="text-xs text-slate-400">{world.timeOfDay} · {world.sceneTag}</p>
      </header>
      <div>
        <p className="text-xs text-slate-400">Fronts & clocks</p>
        <div className="mt-2 space-y-2">
          {world.fronts.map((front) => (
            <div key={front.id} className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between text-sm text-white">
                <span>{front.label}</span>
                <span>
                  {front.value}/{front.max}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${front.threat === 'dire' ? 'bg-rose-500' : front.threat === 'brewing' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.round((front.value / front.max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400">Rumors & signals</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {world.rumors.map((rumor) => (
            <li key={rumor}>{rumor}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
