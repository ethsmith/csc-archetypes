import { Swords, Gamepad2 } from 'lucide-react';
import type { StatMode } from '../types';

// Scrim stats aren't being collected right now, so the scrim tab — and the
// whole mode toggle, since regulation would be the only option — is hidden
// for now. Flip this flag back to `true` once scrim data is flowing again.
const SHOW_SCRIM_TAB = false;

interface Props {
  mode: StatMode;
  onChange: (mode: StatMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  if (!SHOW_SCRIM_TAB) return null;

  return (
    <div className="flex rounded-xl overflow-hidden glass neon-border p-1 gap-1">
      <button
        onClick={() => onChange('regulation')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg btn-glow ${
          mode === 'regulation'
            ? 'bg-gradient-to-r from-neon-blue/25 to-neon-blue/15 text-neon-blue shadow-lg shadow-neon-blue/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <Swords size={16} />
        Regulation
      </button>
      <button
        onClick={() => onChange('scrim')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg btn-glow ${
          mode === 'scrim'
            ? 'bg-gradient-to-r from-neon-purple/25 to-neon-purple/15 text-neon-purple shadow-lg shadow-neon-purple/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <Gamepad2 size={16} />
        Scrims
      </button>
    </div>
  );
}
