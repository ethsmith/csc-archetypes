import { useEffect, useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import type { GroupedPlayer } from './types';
import { fetchPlayerStats } from './fetchData';
import Archetypes from './components/Archetypes';

function Header() {
  return (
    <header className="glass border-b border-neon-blue/20 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
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
