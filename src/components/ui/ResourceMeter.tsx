import { ResourceTrack } from '@/lib/types';

export default function ResourceMeter({ track }: { track: ResourceTrack }) {
  const percent = Math.min(100, Math.round((track.current / track.max) * 100));
  const gradient = track.type === 'hp' ? 'from-rose-400 to-amber-500' : track.type === 'xp' ? 'from-sky-400 to-indigo-500' : 'from-emerald-400 to-lime-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{track.label}</span>
        <span>
          {track.current} / {track.max}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
