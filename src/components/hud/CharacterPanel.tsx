'use client';

import Image from 'next/image';
import { useGameStore } from '@/stores/useGameStore';
import ResourceMeter from '@/components/ui/ResourceMeter';
import { abilityBonus } from '@/lib/rules-engine';

export default function CharacterPanel() {
  const { character } = useGameStore();
  return (
    <section className="card-sheen rounded-3xl p-4 space-y-4">
      <header className="flex items-center gap-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10">
          <Image src={character.portrait} alt={character.name} fill className="object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Character</p>
          <h3 className="text-xl font-display text-white">{character.name}</h3>
          <p className="text-sm text-slate-300">
            {character.ancestry} {character.class} · Lv {character.level}
          </p>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-2 text-center">
        {Object.entries(character.stats).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/5 bg-slate-900/70 p-2">
            <p className="text-xs uppercase tracking-widest text-slate-400">{key}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
            <p className="text-xs text-emerald-300">{abilityBonus(key) >= 0 ? '+' : ''}{abilityBonus(key)}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {character.resources.map((resource) => (
          <ResourceMeter key={resource.id} track={resource} />
        ))}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Conditions</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {character.conditions.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-400">{character.notes}</p>
    </section>
  );
}
