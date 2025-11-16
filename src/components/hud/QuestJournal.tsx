'use client';

import { useGameStore } from '@/stores/useGameStore';
import Tag from '@/components/ui/Tag';

export default function QuestJournal() {
  const { quests } = useGameStore();
  return (
    <section className="card-sheen rounded-3xl p-4 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quest Journal</p>
        <h3 className="text-lg font-display text-white">Objectives</h3>
      </header>
      <div className="space-y-4">
        {quests.map((quest) => (
          <article key={quest.id} className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">{quest.title}</h4>
              <Tag>{quest.urgency === 'ticking' ? 'Clock' : quest.urgency === 'faction' ? 'Faction' : 'Story'}</Tag>
            </div>
            <p className="mt-1 text-xs text-slate-400">{quest.summary}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-200">
              {quest.stages.map((stage) => (
                <li key={stage.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${stage.status === 'complete' ? 'bg-emerald-400' : stage.status === 'active' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                  <span className={stage.status === 'failed' ? 'line-through text-rose-300' : ''}>{stage.description}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
