import { useEffect, useState } from 'react';
import { Loader2, Sparkles, AlertTriangle, Eye } from 'lucide-react';
import type { GroupedPlayer } from './types';
import { fetchPlayerStats } from './fetchData';
import Archetypes from './components/Archetypes';

const SHIMMER_KEY = 'csc-archetypes:shimmer:v1';

/**
 * Custom event the Header dispatches when the user clicks "Reveal all". The
 * `Archetypes` component listens for it and adds every player in the current
 * (filtered) pool to the revealed set. We use an event instead of prop
 * drilling because the reveal state lives inside `Archetypes` (it's also
 * persisted to localStorage there).
 */
export const REVEAL_ALL_EVENT = 'csc-archetypes:reveal-all';

function loadShimmerEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(SHIMMER_KEY) !== '0';
  } catch {
    return true;
  }
}

function RevealAllButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(REVEAL_ALL_EVENT))}
      title="Reveal every player in the current pool"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-neon-blue border-neon-blue/40 bg-neon-blue/10 hover:bg-neon-blue/15"
    >
      <Eye size={14} />
      <span className="hidden sm:inline uppercase tracking-wider">Reveal all</span>
    </button>
  );
}

function ShimmerToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      title={enabled ? 'Disable shimmer animation' : 'Enable shimmer animation'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
        enabled
          ? 'text-neon-purple border-neon-purple/40 bg-neon-purple/10 hover:bg-neon-purple/15'
          : 'text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/20'
      }`}
    >
      <Sparkles size={14} className={enabled ? '' : 'opacity-60'} />
      <span className="hidden sm:inline uppercase tracking-wider">
        Shimmer {enabled ? 'on' : 'off'}
      </span>
    </button>
  );
}

function Header() {
  const [shimmerEnabled, setShimmerEnabled] = useState<boolean>(() => loadShimmerEnabled());

  useEffect(() => {
    const root = document.documentElement;
    if (shimmerEnabled) root.classList.remove('shimmer-disabled');
    else root.classList.add('shimmer-disabled');
    try {
      window.localStorage.setItem(SHIMMER_KEY, shimmerEnabled ? '1' : '0');
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [shimmerEnabled]);

  return (
    <header className="glass border-b border-neon-blue/20 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
            <Sparkles size={24} className="text-neon-purple" />
          </div>
          <div>
            <div className="text-lg font-bold gradient-text leading-none">CSC Archetypes</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
              CS2 build classifier
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RevealAllButton />
          <ShimmerToggle enabled={shimmerEnabled} onChange={setShimmerEnabled} />
        </div>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 size={36} className="text-neon-blue animate-spin" />
      <div className="text-sm text-slate-400">Loading CSC stats…</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto mt-12 glass rounded-xl p-6 border border-red-400/30">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-base font-bold text-red-300 mb-1">Failed to load data</div>
          <div className="text-sm text-slate-400">{message}</div>
          <div className="text-xs text-slate-500 mt-3">
            Try reloading. If it keeps failing, the stats API or the CSC core API may be
            unavailable.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState<GroupedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerStats()
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <Archetypes players={players} />
        )}
      </main>
      <footer className="mt-8 py-6 text-center text-xs text-slate-500">
        <div>
          Stats sourced from the{' '}
          <a
            href="https://fragg-3-0-api.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-neon-blue transition-colors"
          >
            fragg stats API
          </a>{' '}
          · Player metadata via{' '}
          <a
            href="https://core.playcsc.com/graphql"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-neon-blue transition-colors"
          >
            core.playcsc.com
          </a>
        </div>
      </footer>
    </div>
  );
}
