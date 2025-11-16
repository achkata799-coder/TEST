'use client';

import { useGameStore } from '@/stores/useGameStore';
import { SessionMode } from '@/lib/types';

const modeLabels: Record<SessionMode, string> = {
  story: 'Narrative',
  campaign: 'Rules-Forward',
};

export default function SessionNavigator() {
  const { session, modes, mode, setMode, modeBias, setModeBias } = useGameStore();
  const currentMode = modes.find((m) => m.id === mode);
  return (
    <section className="card-sheen rounded-3xl p-5 space-y-4 shadow-parchment">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Session</p>
        <h2 className="text-xl font-display text-white">{session.campaignName}</h2>
        <p className="text-sm text-slate-300">{session.world}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {session.tags.map((tag) => (
          <span key={tag} className="bg-slate-800/60 text-xs px-3 py-1 rounded-full text-slate-200">
            {tag}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Mode blend</span>
          <span>{Math.round(modeBias * 100)}% {modeLabels.campaign}</span>
        </div>
        <input
          aria-label="Mode blend"
          className="w-full accent-amber-400 mode-slider"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={modeBias}
          onChange={(event) => setModeBias(Number(event.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-2xl border px-3 py-2 text-left transition ${
              m.id === mode
                ? 'border-amber-300/60 bg-amber-500/10 text-amber-200'
                : 'border-white/5 text-slate-300 hover:border-white/20'
            }`}
          >
            <p className="font-semibold">{m.label}</p>
            <p className="text-xs text-slate-400">{m.description}</p>
          </button>
        ))}
      </div>
      {currentMode && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm space-y-2">
          <p className="font-semibold text-slate-200">Playbook Prompts</p>
          <ul className="list-disc pl-5 text-slate-300 space-y-1">
            {currentMode.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      )}
      <footer className="text-xs text-slate-400">
        {session.connectedPlayers} / {session.maxPlayers} players connected · GM persona: {session.gmPersona}
      </footer>
    </section>
  );
}
