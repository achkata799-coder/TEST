'use client';

import { useGameStore } from '@/stores/useGameStore';
import Tag from '@/components/ui/Tag';

const speakerStyles = {
  ai: 'border-amber-300/40 bg-amber-500/10',
  player: 'border-emerald-300/30 bg-emerald-500/10',
  rules: 'border-slate-200/20 bg-slate-900/40',
  system: 'border-slate-200/10 bg-slate-950/60',
};

export default function StoryLog() {
  const { messages } = useGameStore();
  return (
    <section className="card-sheen rounded-3xl p-5 h-full flex flex-col shadow-parchment">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Story Log</p>
        <h2 className="text-2xl font-display text-white">Turn-by-turn narrative</h2>
      </header>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {messages.map((msg) => (
          <article key={msg.id} className={`rounded-2xl border p-4 ${speakerStyles[msg.speaker] ?? speakerStyles.system}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{msg.title ?? msg.speaker.toUpperCase()}</p>
              <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">{msg.content}</p>
            {msg.dice && (
              <p className="mt-2 text-xs text-amber-200">
                {msg.dice.formula} → {msg.dice.total} ({msg.dice.rolls.join(', ')} {msg.dice.detail ?? ''})
              </p>
            )}
            {msg.tags && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
