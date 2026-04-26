import { useEffect, useMemo } from 'react';
import {
  X,
  Star,
  Trophy,
  TrendingUp,
  Award,
} from 'lucide-react';
import type { GroupedPlayer, PlayerStats } from '../types';
import {
  ARCHETYPE_BY_ID,
  computeArchetypeStatPercentiles,
  computeShowcasePercentiles,
  SKILL_RATING_STAT_COUNT,
  type Archetype,
  type SkillRating,
} from '../archetypes';

interface Props {
  gp: GroupedPlayer;
  stats: PlayerStats;
  arch: Archetype;
  score: number;
  secondary: { id: string; score: number } | null;
  pool: { gp: GroupedPlayer; stats: PlayerStats }[];
  skill: SkillRating | null;
  onClose: () => void;
}

function skillTierLabel(rating: number): string {
  if (rating >= 95) return 'Legendary';
  if (rating >= 85) return 'Elite';
  if (rating >= 70) return 'Pro';
  if (rating >= 50) return 'Solid';
  if (rating >= 30) return 'Developing';
  return 'Raw';
}

function pctileColor(p: number): string {
  if (p >= 80) return 'text-emerald-400';
  if (p >= 65) return 'text-neon-blue';
  if (p >= 50) return 'text-yellow-400';
  if (p >= 35) return 'text-orange-400';
  return 'text-red-400';
}

function pctileBg(p: number): string {
  if (p >= 80) return 'bg-emerald-400';
  if (p >= 65) return 'bg-neon-blue';
  if (p >= 50) return 'bg-yellow-400';
  if (p >= 35) return 'bg-orange-400';
  return 'bg-red-400';
}

function pctileLabel(p: number): string {
  if (p >= 95) return 'Elite';
  if (p >= 85) return 'Top Tier';
  if (p >= 70) return 'Strong';
  if (p >= 50) return 'Above Avg';
  if (p >= 30) return 'Below Avg';
  return 'Weak';
}

function ordinal(n: number): string {
  const r = Math.round(n);
  if (r >= 11 && r <= 13) return `${r}th`;
  const last = r % 10;
  if (last === 1) return `${r}st`;
  if (last === 2) return `${r}nd`;
  if (last === 3) return `${r}rd`;
  return `${r}th`;
}

export default function PlayerArchetypeModal({
  gp,
  stats,
  arch,
  score,
  secondary,
  pool,
  skill,
  onClose,
}: Props) {
  // Close on Escape, lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const archetypeBreakdown = useMemo(
    () => computeArchetypeStatPercentiles(stats, arch, pool),
    [stats, arch, pool],
  );

  const showcase = useMemo(
    () => computeShowcasePercentiles(stats, pool),
    [stats, pool],
  );

  const topStat = showcase[0];
  // Honour-roll: next 5 strongest, excluding the #1 (already shown above).
  const honorRoll = showcase.slice(1, 6);

  const secondaryArch = secondary ? ARCHETYPE_BY_ID.get(secondary.id) : null;

  const Icon = arch.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
    >
      <div
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl glass border ${arch.borderClass} card-glow shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header — archetype-themed banner */}
        <header
          className={`relative px-5 sm:px-7 pt-7 pb-5 bg-gradient-to-br ${arch.gradientClass} border-b ${arch.borderClass}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl bg-dark-800/60 border ${arch.borderClass} flex-shrink-0`}
            >
              <Icon size={32} className={arch.textClass} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="player-modal-title"
                className="text-2xl sm:text-3xl font-extrabold text-slate-50 truncate"
              >
                {gp.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                <span className="text-slate-300">{stats.tier}</span>
                {gp.cscTier && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15 uppercase tracking-wider text-[10px]">
                    {gp.cscTier}
                  </span>
                )}
                {gp.cscPlayerType && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 text-[10px]">
                    {gp.cscPlayerType}
                  </span>
                )}
                <span className="text-slate-400 tabular-nums">
                  · {stats.games} games
                </span>
                <span className="text-slate-400 tabular-nums">
                  · {stats.roundsPlayed} rounds
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 flex-shrink-0">
              {skill && (
                <div className="text-right">
                  <div
                    className={`text-4xl sm:text-5xl font-extrabold leading-none ${pctileColor(skill.skillRating)}`}
                  >
                    {Math.round(skill.skillRating)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                    Skill
                  </div>
                  <div className={`text-[10px] mt-0.5 ${pctileColor(skill.skillRating)} font-bold uppercase tracking-wider`}>
                    {skillTierLabel(skill.skillRating)}
                  </div>
                </div>
              )}
              {skill && <div className="w-px h-14 bg-white/15 self-center" />}
              <div className="text-right">
                <div className={`text-4xl sm:text-5xl font-extrabold leading-none ${arch.textClass}`}>
                  {Math.round(score)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                  Fit
                </div>
                <div className={`text-[10px] mt-0.5 ${arch.textClass} font-bold uppercase tracking-wider opacity-80`}>
                  {arch.role.split(/\s*[/&]\s*/)[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Archetype name + tagline */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <Star size={14} className={arch.textClass} />
              <span className={`text-lg font-bold ${arch.textClass}`}>{arch.name}</span>
              <span className="text-sm text-slate-400">· {arch.role}</span>
            </div>
            <div className={`text-sm italic mt-1 ${arch.textClass} opacity-90`}>
              "{arch.tagline}"
            </div>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">{arch.description}</p>
          </div>
        </header>

        <div className="p-5 sm:p-7 space-y-6">
          {/* Skill rating explainer */}
          {skill && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Award size={14} className={pctileColor(skill.skillRating)} />
                <span className={`text-[11px] uppercase tracking-wider font-bold ${pctileColor(skill.skillRating)}`}>
                  Overall Skill Rating
                </span>
              </div>
              <div className="rounded-xl p-4 bg-dark-700/40 border border-white/5">
                <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div
                      className={`text-3xl sm:text-4xl font-extrabold ${pctileColor(skill.skillRating)} tabular-nums leading-none`}
                    >
                      {ordinal(skill.skillRating)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                      percentile vs pool
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300 tabular-nums">
                      <span className={`font-bold ${pctileColor(skill.avgPercentile)}`}>
                        {skill.avgPercentile.toFixed(1)}
                      </span>
                      <span className="text-slate-500"> avg %ile across {skill.statsCounted}/{SKILL_RATING_STAT_COUNT} stats</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Better than{' '}
                      <span className={`font-bold ${pctileColor(skill.skillRating)}`}>
                        {Math.round(skill.skillRating)}%
                      </span>{' '}
                      of the pool
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-dark-600 overflow-hidden">
                  <div
                    className={`h-full ${pctileBg(skill.skillRating)} rounded-full transition-all duration-700`}
                    style={{ width: `${skill.skillRating}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  Each stat percentile is averaged into a composite score, then re-ranked
                  against everyone else's composite — so this number is the player's
                  position on the skill curve, not just an average.
                </p>
              </div>
            </section>
          )}

          {/* Top stat showcase */}
          {topStat && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} className="text-yellow-400" />
                <span className="text-[11px] uppercase tracking-wider font-bold text-yellow-400">
                  Signature Stat
                </span>
              </div>
              <div
                className={`relative rounded-xl p-5 border ${arch.borderClass} bg-gradient-to-br ${arch.gradientClass} overflow-hidden`}
              >
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-300/80 mb-1">
                      {topStat.label}
                    </div>
                    <div className={`text-4xl sm:text-5xl font-extrabold ${pctileColor(topStat.percentile)} tabular-nums leading-none`}>
                      {topStat.formatted}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-extrabold tabular-nums ${pctileColor(topStat.percentile)} leading-none`}>
                      {ordinal(topStat.percentile)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-300/80 mt-1">
                      percentile · {pctileLabel(topStat.percentile)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-dark-700/60 overflow-hidden">
                  <div
                    className={`h-full ${pctileBg(topStat.percentile)} rounded-full transition-all duration-700`}
                    style={{ width: `${topStat.percentile}%` }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Archetype fit breakdown */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-1 h-4 ${arch.barFromClass.replace('from-', 'bg-')} rounded-full`} />
              <span className={`text-[11px] uppercase tracking-wider font-bold ${arch.textClass}`}>
                {arch.role} Fit Breakdown
              </span>
            </div>
            <div className="space-y-2">
              {archetypeBreakdown.map((s) => (
                <div
                  key={s.key as string}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-700/40 border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-300 truncate">
                        {s.label}
                      </span>
                      {s.inverted && (
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">
                          (lower better)
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 tabular-nums ml-auto">
                        ×{s.weight}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-dark-600 overflow-hidden">
                      <div
                        className={`h-full ${pctileBg(s.percentile)} rounded-full transition-all duration-500`}
                        style={{ width: `${s.percentile}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <div className={`text-sm font-bold tabular-nums ${pctileColor(s.percentile)}`}>
                      {s.formatted}
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {ordinal(s.percentile)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Honor roll — other strong stats */}
          {honorRoll.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-neon-blue" />
                <span className="text-[11px] uppercase tracking-wider font-bold text-neon-blue">
                  Other Strengths
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {honorRoll.map((s) => (
                  <div
                    key={s.key as string}
                    className="rounded-lg bg-dark-700/40 border border-white/5 p-2.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
                      {s.label}
                    </div>
                    <div className={`text-base font-bold tabular-nums ${pctileColor(s.percentile)}`}>
                      {s.formatted}
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {ordinal(s.percentile)} %ile
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Secondary archetype */}
          {secondaryArch && secondary && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Secondary Archetype
                </span>
              </div>
              <div
                className={`flex items-center gap-3 rounded-xl p-3 border ${secondaryArch.borderClass} ${secondaryArch.bgClass}`}
              >
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${secondaryArch.gradientClass} border ${secondaryArch.borderClass} flex-shrink-0`}
                >
                  <secondaryArch.icon size={18} className={secondaryArch.textClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${secondaryArch.textClass}`}>
                    {secondaryArch.name}
                  </div>
                  <div className="text-xs text-slate-400 italic truncate">
                    "{secondaryArch.tagline}"
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xl font-extrabold ${secondaryArch.textClass} leading-none`}>
                    {Math.round(secondary.score)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                    fit
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
