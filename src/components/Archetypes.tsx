import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Users,
  Sparkles,
  Filter,
  Search,
  X,
  EyeOff,
  Eye,
  RotateCcw,
  HelpCircle,
  ChevronLeft,
  Shield,
} from 'lucide-react';
import type { GroupedPlayer, GroupedPlayerTeam, PlayerStats, StatMode } from '../types';
import {
  ARCHETYPES,
  ARCHETYPE_BY_ID,
  assignArchetypes,
  computeSkillRatings,
  type Archetype,
  type SkillRating,
} from '../archetypes';
import ModeToggle from './ModeToggle';
import PlayerArchetypeModal from './PlayerArchetypeModal';
import ArchetypeReveal from './ArchetypeReveal';
import { statRanges, getStatColor } from '../statRanges';

// ---------------------------------------------------------------------------
// Reveal persistence (localStorage)
//
// Each player's archetype stays hidden until the user reveals them for the
// first time. The set of revealed steamIds is persisted between sessions so
// users don't have to re-reveal players they've already seen.
// ---------------------------------------------------------------------------

const REVEALED_KEY = 'csc-archetypes:revealed:v1';

function loadRevealed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(REVEALED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === 'string'));
    }
  } catch {
    /* ignore corrupt storage */
  }
  return new Set();
}

function saveRevealed(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REVEALED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota / disabled storage */
  }
}

// ---------------------------------------------------------------------------
// Pagination (unrevealed tab)
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500, 1000] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSize = 50;
const PAGE_SIZE_KEY = 'csc-archetypes:unrevealedPageSize:v1';

function loadPageSize(): PageSize {
  if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE;
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_KEY);
    if (!raw) return DEFAULT_PAGE_SIZE;
    const n = Number(raw);
    if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) return n as PageSize;
  } catch {
    /* ignore */
  }
  return DEFAULT_PAGE_SIZE;
}

function savePageSize(size: PageSize) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PAGE_SIZE_KEY, String(size));
  } catch {
    /* ignore */
  }
}

type TabKey = 'unrevealed' | 'revealed' | 'teams';

interface Props {
  players: GroupedPlayer[];
}

interface PlayerInGroup {
  gp: GroupedPlayer;
  stats: PlayerStats;
  score: number;
  secondary: { id: string; score: number } | null;
}

const MIN_GAMES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

// CSC tier ordering (lowest -> highest).
const CSC_TIER_ORDER = ['recruit', 'prospect', 'contender', 'challenger', 'elite', 'premier'];

function tierRank(tier: string): number {
  const idx = CSC_TIER_ORDER.indexOf(tier.toLowerCase());
  return idx === -1 ? CSC_TIER_ORDER.length : idx;
}

function getBestEntry(gp: GroupedPlayer, mode: StatMode): PlayerStats | null {
  const entries = mode === 'regulation' ? gp.regulation : gp.scrim;
  if (entries.length === 0) return null;
  return entries.reduce((best, cur) =>
    cur.stats.finalRating > best.stats.finalRating ? cur : best,
  ).stats;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-neon-blue';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 35) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 65) return 'bg-neon-blue';
  if (score >= 50) return 'bg-yellow-400';
  if (score >= 35) return 'bg-orange-400';
  return 'bg-red-400';
}

// -----------------------------------------------------------------------------
// Player card (in archetype section grids)
// -----------------------------------------------------------------------------

interface PlayerCardProps {
  entry: PlayerInGroup;
  arch: Archetype;
  onSelect: (entry: PlayerInGroup) => void;
}

function PlayerCard({ entry, arch, onSelect }: PlayerCardProps) {
  const { gp, stats, score, secondary } = entry;
  const secondaryArch = secondary ? ARCHETYPE_BY_ID.get(secondary.id) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`group glass rounded-xl p-4 card-glow text-left w-full border ${arch.borderClass} hover:scale-[1.01] transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-slate-100 truncate group-hover:text-neon-blue transition-colors">
              {gp.name}
            </span>
            <ChevronRight
              size={14}
              className="text-slate-500 group-hover:text-neon-blue transition-colors flex-shrink-0"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 truncate">{stats.tier}</span>
            {gp.cscTier && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                {gp.cscTier}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-extrabold leading-none ${scoreColor(score)}`}>
            {Math.round(score)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
            fit
          </div>
        </div>
      </div>

      <div className="h-1 rounded-full bg-dark-600 overflow-hidden mb-3">
        <div
          className={`h-full ${scoreBg(score)} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {arch.highlightStats.map((hs) => {
          const v = Number(stats[hs.key]);
          const range =
            (statRanges as unknown as Record<string, { good: number; average: number; inverted?: boolean } | undefined>)[
              hs.key as string
            ];
          const colorClass = range ? getStatColor(v, range) : 'text-slate-200';
          return (
            <div key={hs.key as string} className="bg-dark-700/50 rounded-lg p-2 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                {hs.label}
              </div>
              <div className={`text-sm font-bold tabular-nums ${colorClass}`}>
                {hs.format(v)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {secondaryArch ? (
            <>
              <span className="text-slate-500">Also:</span>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${secondaryArch.borderClass} ${secondaryArch.bgClass} ${secondaryArch.textClass} truncate`}
              >
                <secondaryArch.icon size={11} />
                <span className="truncate">{secondaryArch.name}</span>
              </span>
            </>
          ) : (
            <span className="text-slate-600 italic">Pure {arch.role.split(' / ')[0]}</span>
          )}
        </div>
        <span className="text-slate-500 tabular-nums flex-shrink-0">
          {stats.games}g · {stats.roundsPlayed}rd
        </span>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Archetype overview chip (top of page, scrolls to section on click)
// -----------------------------------------------------------------------------

function ArchetypeChip({
  arch,
  count,
  onClick,
}: {
  arch: Archetype;
  count: number;
  onClick: () => void;
}) {
  const Icon = arch.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass rounded-xl p-4 card-glow text-left border ${arch.borderClass} hover:scale-[1.02] transition-all cursor-pointer flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${arch.gradientClass} border ${arch.borderClass}`}>
          <Icon size={20} className={arch.textClass} />
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${arch.textClass} leading-none`}>{count}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
            player{count === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div>
        <div className={`text-sm font-bold ${arch.textClass}`}>{arch.name}</div>
        <div className="text-xs text-slate-500">{arch.role}</div>
      </div>
      <div className="text-[11px] text-slate-400 italic line-clamp-1">"{arch.tagline}"</div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Archetype section (full description + player grid)
// -----------------------------------------------------------------------------

function ArchetypeSection({
  arch,
  players,
  onSelect,
}: {
  arch: Archetype;
  players: PlayerInGroup[];
  onSelect: (entry: PlayerInGroup) => void;
}) {
  const Icon = arch.icon;

  return (
    <section
      id={`archetype-${arch.id}`}
      className={`glass rounded-2xl p-5 sm:p-6 card-glow border ${arch.borderClass} scroll-mt-24`}
    >
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${arch.gradientClass} border ${arch.borderClass} flex-shrink-0`}
        >
          <Icon size={32} className={arch.textClass} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-2xl font-extrabold ${arch.textClass}`}>{arch.name}</h2>
            <span className="text-sm text-slate-400">{arch.role}</span>
          </div>
          <div className={`text-sm italic ${arch.textClass} opacity-80 mt-1`}>"{arch.tagline}"</div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">
            {arch.description}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Defining stats:
            </span>
            {arch.stats.map((s) => (
              <span
                key={s.key as string}
                className={`text-[10px] px-2 py-0.5 rounded-md ${arch.bgClass} ${arch.textClass} border ${arch.borderClass}`}
              >
                {s.inverted ? 'low ' : ''}
                {String(s.key)
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (c) => c.toUpperCase())
                  .trim()}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={`text-4xl font-extrabold ${arch.textClass}`}>{players.length}</div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            player{players.length === 1 ? '' : 's'}
          </div>
        </div>
      </header>

      {players.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-6 italic">
          No players match this archetype with current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {players.map((p) => (
            <PlayerCard key={p.gp.steamId} entry={p} arch={arch} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Search bar — autocompletes from the current pool, opens modal on click
// -----------------------------------------------------------------------------

interface SearchMatch {
  entry: PlayerInGroup;
  arch: Archetype;
  revealed: boolean;
}

interface PlayerSearchProps {
  matches: SearchMatch[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (m: SearchMatch) => void;
  totalInPool: number;
  poolEmpty: boolean;
}

function PlayerSearch({
  matches,
  query,
  onQueryChange,
  onSelect,
  totalInPool,
  poolEmpty,
}: PlayerSearchProps) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const showDropdown = focused && query.trim().length > 0;
  const trimmed = query.trim();
  const noMatches = trimmed.length > 0 && matches.length === 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && matches.length > 0) {
      e.preventDefault();
      onSelect(matches[0]);
    } else if (e.key === 'Escape') {
      onQueryChange('');
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-blue pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for your name to see your archetype…"
          className="w-full pl-12 pr-12 py-4 rounded-xl glass neon-border text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-neon-blue/50 transition-colors"
          aria-label="Search for a player"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 dropdown-menu rounded-xl overflow-hidden card-glow max-h-[60vh] overflow-y-auto">
          {matches.length > 0 ? (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                {matches.length} match{matches.length === 1 ? '' : 'es'} · click to open card · enter selects first
              </div>
              <ul>
                {matches.map((m, idx) => {
                  const Icon = m.arch.icon;
                  return (
                    <li key={m.entry.gp.steamId}>
                      <button
                        type="button"
                        onClick={() => onSelect(m)}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer ${
                          idx !== matches.length - 1 ? 'border-b border-white/5' : ''
                        }`}
                      >
                        {m.revealed ? (
                          <div
                            className={`p-1.5 rounded-lg bg-gradient-to-br ${m.arch.gradientClass} border ${m.arch.borderClass} flex-shrink-0`}
                          >
                            <Icon size={16} className={m.arch.textClass} />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-neon-purple/25 to-neon-blue/25 border border-neon-purple/40 flex-shrink-0">
                            <HelpCircle size={16} className="text-neon-purple" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate">
                            {m.entry.gp.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            {m.revealed ? (
                              <span className={`${m.arch.textClass} font-medium`}>
                                {m.arch.name}
                              </span>
                            ) : (
                              <span className="text-neon-purple font-medium uppercase tracking-wider text-[10px]">
                                Hidden · click to reveal
                              </span>
                            )}
                            <span>·</span>
                            <span>{m.entry.stats.tier}</span>
                            {m.entry.gp.cscTier && (
                              <>
                                <span>·</span>
                                <span className="uppercase">{m.entry.gp.cscTier}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {m.revealed ? (
                          <div className={`text-lg font-extrabold tabular-nums ${scoreColor(m.entry.score)}`}>
                            {Math.round(m.entry.score)}
                          </div>
                        ) : (
                          <div className="text-lg font-extrabold text-neon-purple/70 tabular-nums">
                            ?
                          </div>
                        )}
                        <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : noMatches ? (
            <div className="p-4 text-center text-sm text-slate-400">
              {poolEmpty ? (
                <>No players match the current filters at all. Try adjusting them above.</>
              ) : (
                <>
                  No player named "<span className="text-slate-200 font-medium">{trimmed}</span>" in
                  the current pool of {totalInPool}.
                  <div className="text-xs text-slate-500 mt-1">
                    Try lowering the min-games filter or switching mode.
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Unrevealed players section — each entry is a hidden player the user can
// click to reveal their archetype.
// -----------------------------------------------------------------------------

interface UnrevealedEntry {
  gp: GroupedPlayer;
  stats: PlayerStats;
}

function UnrevealedCard({
  entry,
  onClick,
}: {
  entry: UnrevealedEntry;
  onClick: () => void;
}) {
  const { gp, stats } = entry;
  return (
    <button
      type="button"
      onClick={onClick}
      className="unrevealed-card group relative rounded-xl p-3 text-center cursor-pointer overflow-hidden border border-neon-purple/25 hover:border-neon-purple/60"
      aria-label={`Reveal archetype for ${gp.name}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-dark-700/80 to-dark-800/85" />
      <div className="absolute inset-0 unrevealed-shimmer" />
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/12 via-transparent to-neon-blue/12 opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="mx-auto w-12 h-12 mb-2 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-blue/25 border border-neon-purple/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
          <Sparkles size={20} className="text-neon-purple group-hover:text-neon-blue transition-colors" />
        </div>
        <div className="text-sm font-bold text-slate-100 truncate group-hover:text-neon-blue transition-colors">
          {gp.name}
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
          <span className="truncate">{stats.tier}</span>
          {gp.cscTier && (
            <>
              <span className="text-slate-600">·</span>
              <span className="uppercase tracking-wider">{gp.cscTier}</span>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
          {stats.games}g · {stats.roundsPlayed}rd
        </div>
        <div className="mt-2 text-[9px] uppercase tracking-[0.2em] font-bold text-neon-purple opacity-0 group-hover:opacity-100 transition-opacity">
          Click to reveal
        </div>
      </div>
    </button>
  );
}

interface UnrevealedSectionProps {
  players: UnrevealedEntry[];
  totalCount: number;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (p: UnrevealedEntry) => void;
}

function UnrevealedSection({
  players,
  totalCount,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPageChange,
  onSelect,
}: UnrevealedSectionProps) {
  if (totalCount === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center border border-emerald-400/25">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-neon-blue/20 border border-emerald-400/30 flex items-center justify-center mb-3">
          <Eye size={22} className="text-emerald-400" />
        </div>
        <p className="text-slate-200 font-semibold">Every player in the current pool is revealed.</p>
        <p className="text-slate-500 text-sm mt-2">
          Switch to the Revealed tab to browse archetypes.
        </p>
      </div>
    );
  }

  const start = page * pageSize;
  const end = Math.min(totalCount, start + players.length);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <section className="relative glass rounded-2xl p-5 sm:p-6 card-glow border border-neon-purple/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/8 via-transparent to-neon-blue/8 pointer-events-none" />
      <header className="relative flex items-center gap-4 mb-5">
        <div className="p-3 rounded-xl bg-gradient-to-br from-neon-purple/25 to-neon-blue/25 border border-neon-purple/30 flex-shrink-0">
          <EyeOff size={28} className="text-neon-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-extrabold gradient-text">Unrevealed Players</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Click any player to reveal their archetype. Revealed players are saved
            locally and move to the Revealed tab.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-3xl sm:text-4xl font-extrabold text-neon-purple leading-none">
            {totalCount}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
            hidden
          </div>
        </div>
      </header>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        rangeStart={start + 1}
        rangeEnd={end}
        total={totalCount}
        canPrev={canPrev}
        canNext={canNext}
      />

      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
        {players.map((p) => (
          <UnrevealedCard key={p.gp.steamId} entry={p} onClick={() => onSelect(p)} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-5">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            rangeStart={start + 1}
            rangeEnd={end}
            total={totalCount}
            canPrev={canPrev}
            canNext={canNext}
            compact
          />
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Pagination bar shared between top and bottom of the unrevealed section.
// -----------------------------------------------------------------------------

interface PaginationBarProps {
  page: number;
  totalPages: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  compact?: boolean;
}

function PaginationBar({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
  total,
  canPrev,
  canNext,
  compact = false,
}: PaginationBarProps) {
  return (
    <div className="relative flex flex-wrap items-center gap-3">
      {!compact && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="unrevealed-page-size"
            className="text-[10px] uppercase tracking-wider text-slate-500"
          >
            Per page
          </label>
          <select
            id="unrevealed-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="appearance-none glass rounded-lg px-3 py-1.5 pr-8 text-xs text-slate-200 border border-white/10 hover:border-neon-purple/30 focus:border-neon-purple/50 focus:outline-none cursor-pointer tabular-nums"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-dark-800 text-slate-200">
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="text-[11px] text-slate-400 tabular-nums">
        Showing{' '}
        <span className="text-slate-200 font-semibold">
          {rangeStart}–{rangeEnd}
        </span>{' '}
        of <span className="text-slate-200 font-semibold">{total}</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={!canPrev}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 border border-white/10 hover:border-neon-purple/40 hover:text-neon-purple transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-300 disabled:hover:border-white/10"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <span className="text-[11px] text-slate-400 tabular-nums px-1">
          Page <span className="text-slate-200 font-semibold">{page + 1}</span> /{' '}
          <span className="text-slate-200 font-semibold">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={!canNext}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 border border-white/10 hover:border-neon-purple/40 hover:text-neon-purple transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-300 disabled:hover:border-white/10"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Top-level tab switcher (Unrevealed / Revealed).
// -----------------------------------------------------------------------------

function TabSwitcher({
  tab,
  onChange,
  unrevealedCount,
  revealedCount,
  teamCount,
}: {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
  unrevealedCount: number;
  revealedCount: number;
  teamCount: number;
}) {
  const buttonClass = (active: boolean, activeColor: string) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg btn-glow ${
      active
        ? `${activeColor}`
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <div className="flex rounded-xl overflow-hidden glass neon-border p-1 gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => onChange('unrevealed')}
        className={buttonClass(
          tab === 'unrevealed',
          'bg-gradient-to-r from-neon-purple/25 to-neon-purple/15 text-neon-purple shadow-lg shadow-neon-purple/20',
        )}
        aria-pressed={tab === 'unrevealed'}
      >
        <EyeOff size={16} />
        Unrevealed
        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold tabular-nums">
          {unrevealedCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('revealed')}
        className={buttonClass(
          tab === 'revealed',
          'bg-gradient-to-r from-neon-blue/25 to-neon-blue/15 text-neon-blue shadow-lg shadow-neon-blue/20',
        )}
        aria-pressed={tab === 'revealed'}
      >
        <Eye size={16} />
        Revealed
        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold tabular-nums">
          {revealedCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('teams')}
        className={buttonClass(
          tab === 'teams',
          'bg-gradient-to-r from-emerald-400/25 to-emerald-400/15 text-emerald-300 shadow-lg shadow-emerald-400/20',
        )}
        aria-pressed={tab === 'teams'}
      >
        <Shield size={16} />
        Teams
        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold tabular-nums">
          {teamCount}
        </span>
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Teams view — groups players by their CSC roster team. Archetype, skill, and
// fit scores are hidden until each player is revealed (same flow as the
// Unrevealed tab); clicking any row triggers the reveal animation → modal.
// -----------------------------------------------------------------------------

const FREE_AGENTS_KEY = '__free_agents__';

interface TeamMember {
  gp: GroupedPlayer;
  stats: PlayerStats;
}

interface TeamGroup {
  key: string;
  team: GroupedPlayerTeam | null;
  displayName: string;
  franchiseName: string | null;
  members: TeamMember[];
}

function buildTeamGroups(pool: { gp: GroupedPlayer; stats: PlayerStats }[]): TeamGroup[] {
  const map = new Map<string, TeamGroup>();
  for (const { gp, stats } of pool) {
    const key = gp.team
      ? `${gp.team.franchise.prefix}|${gp.team.name}`
      : FREE_AGENTS_KEY;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        team: gp.team,
        displayName: gp.team
          ? gp.team.franchise.prefix
            ? `${gp.team.franchise.prefix} ${gp.team.name}`
            : gp.team.name
          : 'Free Agents',
        franchiseName: gp.team?.franchise.name ?? null,
        members: [],
      };
      map.set(key, group);
    }
    group.members.push({ gp, stats });
  }

  // Alphabetical so player order doesn't leak any archetype/skill ordering for
  // hidden players.
  for (const g of map.values()) {
    g.members.sort((a, b) => a.gp.name.localeCompare(b.gp.name));
  }

  return [...map.values()].sort((a, b) => {
    // Free agents always sink to the bottom of the list.
    if (a.key === FREE_AGENTS_KEY && b.key !== FREE_AGENTS_KEY) return 1;
    if (b.key === FREE_AGENTS_KEY && a.key !== FREE_AGENTS_KEY) return -1;
    return a.displayName.localeCompare(b.displayName);
  });
}

interface TeamPlayerRowProps {
  member: TeamMember;
  arch: Archetype | null;
  fitScore: number | null;
  skillScore: number | null;
  onClick: () => void;
}

function TeamPlayerRow({ member, arch, fitScore, skillScore, onClick }: TeamPlayerRowProps) {
  const isRevealed = arch !== null && fitScore !== null;
  const Icon = arch?.icon ?? HelpCircle;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left w-full ${
        isRevealed
          ? `${arch.borderClass} hover:bg-white/5`
          : 'border-neon-purple/20 hover:border-neon-purple/40 bg-gradient-to-r from-neon-purple/[0.04] to-transparent'
      }`}
      aria-label={isRevealed ? `Open ${member.gp.name}` : `Reveal archetype for ${member.gp.name}`}
    >
      <div
        className={`p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-105 ${
          isRevealed
            ? `bg-gradient-to-br ${arch.gradientClass} border ${arch.borderClass}`
            : 'bg-neon-purple/15 border border-neon-purple/30'
        }`}
      >
        <Icon size={18} className={isRevealed ? arch.textClass : 'text-neon-purple'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-100 truncate group-hover:text-neon-blue transition-colors">
          {member.gp.name}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
          {isRevealed ? (
            <span className={`font-medium ${arch.textClass} truncate`}>{arch.name}</span>
          ) : (
            <span className="text-neon-purple font-medium uppercase tracking-wider text-[10px]">
              Hidden · click to reveal
            </span>
          )}
          {member.gp.cscTier && (
            <>
              <span className="text-slate-600">·</span>
              <span className="uppercase text-[10px] tracking-wider text-slate-500">
                {member.gp.cscTier}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="text-right tabular-nums w-12 sm:w-14 hidden sm:block">
        <div
          className={`text-lg font-extrabold leading-none ${
            isRevealed && skillScore !== null ? scoreColor(skillScore) : 'text-slate-600'
          }`}
        >
          {isRevealed && skillScore !== null ? Math.round(skillScore) : '?'}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">skill</div>
      </div>
      <div className="text-right tabular-nums w-12 sm:w-14">
        <div
          className={`text-lg font-extrabold leading-none ${
            isRevealed && fitScore !== null ? scoreColor(fitScore) : 'text-slate-600'
          }`}
        >
          {isRevealed && fitScore !== null ? Math.round(fitScore) : '?'}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">fit</div>
      </div>
      <ChevronRight
        size={14}
        className="text-slate-500 flex-shrink-0 group-hover:text-neon-blue transition-colors"
      />
    </button>
  );
}

function TeamAvgStat({ label, value }: { label: string; value: number | null }) {
  const hasValue = value !== null;
  return (
    <div className="text-right">
      <div
        className={`text-xl font-extrabold leading-none tabular-nums ${
          hasValue ? scoreColor(value) : 'text-slate-600'
        }`}
      >
        {hasValue ? Math.round(value) : '—'}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

interface TeamSectionProps {
  group: TeamGroup;
  assignments: ReturnType<typeof assignArchetypes>;
  skillRatings: Map<string, SkillRating>;
  revealed: Set<string>;
  onSelect: (member: TeamMember) => void;
}

function TeamSection({ group, assignments, skillRatings, revealed, onSelect }: TeamSectionProps) {
  const total = group.members.length;
  const isFreeAgents = group.key === FREE_AGENTS_KEY;

  // Single pass over the roster: count revealed members and accumulate sums
  // for the per-team averages. Averages are taken over revealed players only —
  // unrevealed players have unknown scores, and including a zero/null would
  // make the average meaningless.
  let revealedCount = 0;
  let skillSum = 0;
  let skillCount = 0;
  let fitSum = 0;
  let fitCount = 0;
  for (const m of group.members) {
    if (!revealed.has(m.gp.steamId)) continue;
    revealedCount++;
    const a = assignments.get(m.gp.steamId);
    if (a) {
      fitSum += a.primary.score;
      fitCount++;
    }
    const sr = skillRatings.get(m.gp.steamId);
    if (sr) {
      skillSum += sr.skillRating;
      skillCount++;
    }
  }
  const avgSkill = skillCount > 0 ? skillSum / skillCount : null;
  const avgFit = fitCount > 0 ? fitSum / fitCount : null;

  return (
    <section className="glass rounded-2xl p-5 sm:p-6 card-glow border border-white/10">
      <header className="flex items-start gap-4 mb-4 flex-wrap">
        <div
          className={`p-3 rounded-xl border flex-shrink-0 ${
            isFreeAgents
              ? 'bg-gradient-to-br from-slate-500/15 to-slate-700/15 border-white/15'
              : 'bg-gradient-to-br from-emerald-400/15 to-neon-blue/15 border-emerald-400/30'
          }`}
        >
          <Shield size={24} className={isFreeAgents ? 'text-slate-400' : 'text-emerald-300'} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-slate-100 truncate">{group.displayName}</h2>
          {group.franchiseName && (
            <div className="text-xs text-slate-400 truncate">{group.franchiseName}</div>
          )}
        </div>
        <div className="flex items-start gap-3 flex-shrink-0">
          <TeamAvgStat label="avg skill" value={avgSkill} />
          <TeamAvgStat label="avg fit" value={avgFit} />
          <div className="text-right">
            <div className="text-2xl font-extrabold text-slate-100 leading-none tabular-nums">
              {total}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
              player{total === 1 ? '' : 's'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
              {revealedCount} / {total} revealed
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {group.members.map((member) => {
          const isRevealed = revealed.has(member.gp.steamId);
          let arch: Archetype | null = null;
          let fitScore: number | null = null;
          let skillScore: number | null = null;
          if (isRevealed) {
            const a = assignments.get(member.gp.steamId);
            if (a) {
              arch = ARCHETYPE_BY_ID.get(a.primary.archetypeId) ?? null;
              fitScore = a.primary.score;
            }
            const skill = skillRatings.get(member.gp.steamId);
            if (skill) skillScore = skill.skillRating;
          }
          return (
            <TeamPlayerRow
              key={member.gp.steamId}
              member={member}
              arch={arch}
              fitScore={fitScore}
              skillScore={skillScore}
              onClick={() => onSelect(member)}
            />
          );
        })}
      </div>
    </section>
  );
}

function TeamsView({
  groups,
  assignments,
  skillRatings,
  revealed,
  onSelect,
}: {
  groups: TeamGroup[];
  assignments: ReturnType<typeof assignArchetypes>;
  skillRatings: Map<string, SkillRating>;
  revealed: Set<string>;
  onSelect: (member: TeamMember) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center border border-white/10">
        <p className="text-slate-300">No teams in the current pool.</p>
        <p className="text-slate-500 text-sm mt-2">
          Try lowering the minimum games or selecting a different tier.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <TeamSection
          key={g.key}
          group={g}
          assignments={assignments}
          skillRatings={skillRatings}
          revealed={revealed}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Archetypes({ players }: Props) {
  const [mode, setMode] = useState<StatMode>('regulation');
  const [tier, setTier] = useState<string>('All');
  const [minGames, setMinGames] = useState<number>(3);
  const [search, setSearch] = useState<string>('');
  const [selected, setSelected] = useState<{ entry: PlayerInGroup; arch: Archetype } | null>(null);
  // Two-phase open: 'reveal' plays the themed reveal animation, 'modal' shows
  // the full archetype breakdown. First-time clicks go reveal → modal;
  // already-revealed players skip straight to the modal.
  const [revealPhase, setRevealPhase] = useState<'reveal' | 'modal'>('modal');
  const [revealed, setRevealed] = useState<Set<string>>(() => loadRevealed());

  // Tab + pagination state (for the unrevealed tab).
  const [activeTab, setActiveTab] = useState<TabKey>('unrevealed');
  const [pageSize, setPageSizeState] = useState<PageSize>(() => loadPageSize());
  const [page, setPage] = useState<number>(0);

  const changePageSize = useCallback((size: PageSize) => {
    setPageSizeState(size);
    savePageSize(size);
    setPage(0);
  }, []);

  const markRevealed = useCallback((steamId: string) => {
    setRevealed((prev) => {
      if (prev.has(steamId)) return prev;
      const next = new Set(prev);
      next.add(steamId);
      saveRevealed(next);
      return next;
    });
  }, []);

  const resetRevealed = useCallback(() => {
    setRevealed(new Set());
    saveRevealed(new Set());
  }, []);

  function openCard(entry: PlayerInGroup, arch: Archetype) {
    setSelected({ entry, arch });
    setRevealPhase(revealed.has(entry.gp.steamId) ? 'modal' : 'reveal');
  }

  // Build {gp, stats} pool that respects mode + filters.
  const pool = useMemo(() => {
    const list: { gp: GroupedPlayer; stats: PlayerStats }[] = [];
    for (const gp of players) {
      const stats = getBestEntry(gp, mode);
      if (!stats) continue;
      if (stats.games < minGames) continue;
      if (tier !== 'All') {
        if (mode === 'regulation') {
          if ((gp.cscTier ?? '').toLowerCase() !== tier.toLowerCase()) continue;
        } else {
          const tiers = gp.scrim.map((e) => e.tier);
          if (!tiers.includes(tier)) continue;
        }
      }
      list.push({ gp, stats });
    }
    return list;
  }, [players, mode, tier, minGames]);

  const tiers = useMemo(() => {
    const set = new Set<string>();
    for (const gp of players) {
      if (mode === 'regulation') {
        if (gp.cscTier) set.add(gp.cscTier);
      } else {
        gp.scrim.forEach((e) => set.add(e.tier));
      }
    }
    const arr = Array.from(set);
    if (mode === 'regulation') arr.sort((a, b) => tierRank(a) - tierRank(b));
    else arr.sort();
    return ['All', ...arr];
  }, [players, mode]);

  const assignments = useMemo(() => assignArchetypes(pool), [pool]);
  const skillRatings = useMemo(() => computeSkillRatings(pool), [pool]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PlayerInGroup[]>();
    for (const arch of ARCHETYPES) groups.set(arch.id, []);
    for (const { gp, stats } of pool) {
      // Players are only sorted into an archetype section once they've been
      // revealed — keeps the page suspenseful on first visit.
      if (!revealed.has(gp.steamId)) continue;
      const a = assignments.get(gp.steamId);
      if (!a) continue;
      const list = groups.get(a.primary.archetypeId);
      if (!list) continue;
      list.push({
        gp,
        stats,
        score: a.primary.score,
        secondary: a.secondary
          ? { id: a.secondary.archetypeId, score: a.secondary.score }
          : null,
      });
    }
    for (const list of groups.values()) {
      list.sort((a, b) => b.score - a.score);
    }
    return groups;
  }, [pool, assignments, revealed]);

  // Pool entries that haven't been revealed yet, sorted alphabetically so
  // ordering doesn't leak any archetype info.
  const unrevealed = useMemo<UnrevealedEntry[]>(() => {
    return pool
      .filter(({ gp }) => !revealed.has(gp.steamId))
      .map(({ gp, stats }) => ({ gp, stats }))
      .sort((a, b) => a.gp.name.localeCompare(b.gp.name));
  }, [pool, revealed]);

  const revealedInPoolCount = pool.length - unrevealed.length;

  // Pagination is derived per render: `clampedPage` is always a valid page for
  // the current `unrevealed` length, regardless of what's stored in `page`.
  // When the list shrinks (e.g. after revealing the last card on a page) the
  // stored `page` may temporarily exceed `totalPages - 1`, but we only ever
  // display/slice with the clamped value, so that's harmless.
  const totalPages = Math.max(1, Math.ceil(unrevealed.length / pageSize));
  const clampedPage = Math.max(0, Math.min(page, totalPages - 1));

  const unrevealedPage = useMemo<UnrevealedEntry[]>(() => {
    const start = clampedPage * pageSize;
    return unrevealed.slice(start, start + pageSize);
  }, [unrevealed, clampedPage, pageSize]);

  // Teams tab data: group every pool player by their CSC roster team.
  const teamGroups = useMemo<TeamGroup[]>(() => buildTeamGroups(pool), [pool]);

  // Search matches across the current pool.
  const searchMatches: SearchMatch[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out: SearchMatch[] = [];
    for (const { gp, stats } of pool) {
      if (!gp.name.toLowerCase().includes(q)) continue;
      const a = assignments.get(gp.steamId);
      if (!a) continue;
      const arch = ARCHETYPE_BY_ID.get(a.primary.archetypeId);
      if (!arch) continue;
      out.push({
        entry: {
          gp,
          stats,
          score: a.primary.score,
          secondary: a.secondary
            ? { id: a.secondary.archetypeId, score: a.secondary.score }
            : null,
        },
        arch,
        revealed: revealed.has(gp.steamId),
      });
    }
    // Rank: name-starts-with first, then exact prefix, then alphabetical.
    out.sort((a, b) => {
      const an = a.entry.gp.name.toLowerCase();
      const bn = b.entry.gp.name.toLowerCase();
      const aStart = an.startsWith(q) ? 0 : 1;
      const bStart = bn.startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return an.localeCompare(bn);
    });
    return out.slice(0, 12);
  }, [pool, search, assignments, revealed]);

  function openUnrevealed(p: UnrevealedEntry) {
    const a = assignments.get(p.gp.steamId);
    if (!a) return;
    const arch = ARCHETYPE_BY_ID.get(a.primary.archetypeId);
    if (!arch) return;
    const entry: PlayerInGroup = {
      gp: p.gp,
      stats: p.stats,
      score: a.primary.score,
      secondary: a.secondary
        ? { id: a.secondary.archetypeId, score: a.secondary.score }
        : null,
    };
    openCard(entry, arch);
  }

  function jumpTo(id: string) {
    const el = document.getElementById(`archetype-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleSearchSelect(m: SearchMatch) {
    openCard(m.entry, m.arch);
    setSearch('');
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="p-2 rounded-xl bg-gradient-to-br from-neon-purple/25 to-neon-blue/25 border border-neon-purple/30">
            <Sparkles size={28} className="text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold gradient-text">Player Archetypes</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Every CSC player gets dropped into a build defined by the role they actually play.
              Each archetype is scored from the percentile of role-defining stats inside the
              currently filtered pool. Primary archetype is the best fit; the badge under each
              card shows their secondary specialty.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <PlayerSearch
          matches={searchMatches}
          query={search}
          onQueryChange={setSearch}
          onSelect={handleSearchSelect}
          totalInPool={pool.length}
          poolEmpty={pool.length === 0}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle
            mode={mode}
            onChange={(m) => {
              setTier('All');
              setMode(m);
              setPage(0);
            }}
          />

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                setPage(0);
              }}
              className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer min-w-[160px]"
            >
              {tiers.map((t) => (
                <option key={t} value={t} className="bg-dark-800 text-slate-200">
                  {t === 'All'
                    ? mode === 'regulation'
                      ? 'All CSC Tiers'
                      : 'All Teams'
                    : t}
                </option>
              ))}
            </select>
          </div>

          <select
            value={minGames}
            onChange={(e) => {
              setMinGames(Number(e.target.value));
              setPage(0);
            }}
            className="appearance-none glass rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 border border-white/10 hover:border-neon-blue/30 focus:border-neon-blue/50 focus:outline-none cursor-pointer"
          >
            {MIN_GAMES_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-dark-800 text-slate-200">
                Min {n} game{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>

          {revealed.size > 0 && (
            <button
              type="button"
              onClick={resetRevealed}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-neon-purple border border-white/10 hover:border-neon-purple/40 transition-colors cursor-pointer"
              title="Hide every archetype again so you can reveal them from scratch"
            >
              <RotateCcw size={13} />
              Reset reveals
            </button>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-400 ml-auto tabular-nums">
            <Users size={16} />
            <span>
              <span className="text-slate-200 font-semibold">{revealedInPoolCount}</span>
              <span className="text-slate-500"> / {pool.length} revealed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      {pool.length > 0 && (
        <TabSwitcher
          tab={activeTab}
          onChange={setActiveTab}
          unrevealedCount={unrevealed.length}
          revealedCount={revealedInPoolCount}
          teamCount={teamGroups.length}
        />
      )}

      {/* Tab content */}
      {pool.length > 0 && activeTab === 'unrevealed' && (
        <UnrevealedSection
          players={unrevealedPage}
          totalCount={unrevealed.length}
          pageSize={pageSize}
          onPageSizeChange={changePageSize}
          page={clampedPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onSelect={openUnrevealed}
        />
      )}

      {pool.length > 0 && activeTab === 'teams' && (
        <TeamsView
          groups={teamGroups}
          assignments={assignments}
          skillRatings={skillRatings}
          revealed={revealed}
          onSelect={(member) => openUnrevealed({ gp: member.gp, stats: member.stats })}
        />
      )}

      {pool.length > 0 && activeTab === 'revealed' && (
        <>
          {/* Archetype overview (jump-to chips) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ARCHETYPES.map((arch) => (
              <ArchetypeChip
                key={arch.id}
                arch={arch}
                count={grouped.get(arch.id)?.length ?? 0}
                onClick={() => jumpTo(arch.id)}
              />
            ))}
          </div>

          {/* Per-archetype sections */}
          <div className="space-y-5">
            {ARCHETYPES.map((arch) => (
              <ArchetypeSection
                key={arch.id}
                arch={arch}
                players={grouped.get(arch.id) ?? []}
                onSelect={(entry) => openCard(entry, arch)}
              />
            ))}
          </div>

          {revealedInPoolCount === 0 && (
            <div className="glass rounded-xl p-8 text-center border border-white/10">
              <p className="text-slate-300">Nothing revealed yet.</p>
              <p className="text-slate-500 text-sm mt-2">
                Head back to the Unrevealed tab and click a player to reveal their archetype.
              </p>
            </div>
          )}
        </>
      )}

      {pool.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-slate-300">No players match the current filters.</p>
          <p className="text-slate-500 text-sm mt-2">
            Try lowering the minimum games or selecting a different tier.
          </p>
        </div>
      )}

      {selected && revealPhase === 'reveal' && (
        <ArchetypeReveal
          arch={selected.arch}
          playerName={selected.entry.gp.name}
          fitScore={selected.entry.score}
          onComplete={() => {
            markRevealed(selected.entry.gp.steamId);
            setRevealPhase('modal');
          }}
        />
      )}

      {selected && revealPhase === 'modal' && (
        <PlayerArchetypeModal
          gp={selected.entry.gp}
          stats={selected.entry.stats}
          arch={selected.arch}
          score={selected.entry.score}
          secondary={selected.entry.secondary}
          pool={pool}
          skill={skillRatings.get(selected.entry.gp.steamId) ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
