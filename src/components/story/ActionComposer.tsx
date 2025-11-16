'use client';

import { FormEvent, useState } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { ActionType } from '@/lib/types';

const actionTypeLabels: Record<ActionType, string> = {
  narrate: 'Do / Describe',
  speak: 'Speak',
  command: 'GM Command',
  system: 'Out-of-Character',
  attack: 'Attack',
  skill: 'Skill Check',
  cast: 'Cast Spell',
};

export default function ActionComposer() {
  const { sendAction, quickActions, mode } = useGameStore();
  const [intent, setIntent] = useState('Scan the floating motes and ask the Chorus what it needs to stabilize.');
  const [actionType, setActionType] = useState<ActionType>('narrate');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!intent.trim()) return;
    sendAction(intent.trim(), actionType);
    setIntent('');
  };

  return (
    <section className="card-sheen rounded-3xl p-4 shadow-parchment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Action Type</label>
          <select
            value={actionType}
            onChange={(event) => setActionType(event.target.value as ActionType)}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm"
          >
            {Object.entries(actionTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          rows={4}
          className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-white"
          placeholder="Describe what you attempt, speak to NPCs, or issue a GM directive."
        />
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                setActionType(action.actionType);
                setIntent(action.description);
                sendAction(action.description, action.actionType);
              }}
              className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                action.preferredMode === mode ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100' : 'border-white/10 text-slate-200 hover:border-white/30'
              }`}
            >
              <p className="font-semibold">
                {action.icon} {action.label}
              </p>
              <p className="text-xs text-slate-400">{action.description}</p>
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="w-full rounded-3xl bg-gradient-to-r from-amber-500 to-pink-500 px-6 py-3 font-semibold text-slate-950"
        >
          Send to AI Storyteller
        </button>
      </form>
    </section>
  );
}
