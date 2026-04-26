import type { LucideIcon } from 'lucide-react';
import {
  Crosshair,
  Zap,
  Eye,
  Shield,
  Sparkles,
  Users,
  Trophy,
  Flame,
  Star,
  Coins,
} from 'lucide-react';
import type { GroupedPlayer, PlayerStats } from './types';

/**
 * Role-based player archetypes for Counter-Strike 2.
 *
 * Each archetype is defined by a small set of weighted stats (with optional
 * inversion for "lower is better"). For each player, every archetype is given
 * a 0-100 match score derived from the percentile of those stats inside the
 * current pool. The archetype with the highest score is the player's primary;
 * the runner-up is shown as their secondary if it's strong enough.
 *
 * The stat keys here all map to fields on PlayerStats (src/types.ts) which are
 * computed by the parser at /home/admin/Documents/code/GolandProjects/ecorating/.
 */

interface ArchetypeStat {
  key: keyof PlayerStats;
  weight: number;
  /** If true, lower stat values fit the archetype better. */
  inverted?: boolean;
}

export interface HighlightStat {
  key: keyof PlayerStats;
  label: string;
  format: (v: number) => string;
  /** If true, lower is better — affects color tinting only. */
  inverted?: boolean;
}

export interface Archetype {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;

  /** Tailwind utility classes for theming. */
  textClass: string;
  bgClass: string;
  borderClass: string;
  gradientClass: string;
  ringClass: string;
  barFromClass: string;
  barToClass: string;

  icon: LucideIcon;

  /** Stats that define how well a player fits this archetype. */
  stats: ArchetypeStat[];

  /**
   * 'weighted' (default): weighted average of percentiles.
   * 'minBalance': minimum percentile across stats — heavily penalises any weak
   * stat. Useful for "well-rounded" archetypes.
   */
  scoreMode?: 'weighted' | 'minBalance';

  /** Stats highlighted on each player's card. */
  highlightStats: HighlightStat[];
}

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtFloat = (v: number) => v.toFixed(2);
const fmtFloat3 = (v: number) => v.toFixed(3);
const fmtInt = (v: number) => Math.round(v).toString();
const fmtADR = (v: number) => v.toFixed(1);

export const ARCHETYPES: Archetype[] = [
  // ---------------------------------------------------------------------------
  // 1. The Sharpshooter — AWPer / Sniper
  // ---------------------------------------------------------------------------
  {
    id: 'sharpshooter',
    name: 'The Sharpshooter',
    role: 'AWPer / Sniper',
    tagline: 'One bullet. One kill.',
    description:
      "Holds the angle. Pulls the trigger. Disappears. The Sharpshooter is the team's long-range answer — the player who turns a chokepoint into a wall and an opening duel into a highlight reel. A high share of their kills come down the scope.",
    textClass: 'text-violet-300',
    bgClass: 'bg-violet-500/15',
    borderClass: 'border-violet-500/30',
    gradientClass: 'from-violet-500/25 to-fuchsia-500/15',
    ringClass: 'ring-violet-500/40',
    barFromClass: 'from-violet-500',
    barToClass: 'to-fuchsia-500',
    icon: Crosshair,
    stats: [
      { key: 'awpKillsPct', weight: 4 },
      { key: 'awpKillsPerRound', weight: 3 },
      { key: 'roundsWithAwpKillPct', weight: 3 },
      { key: 'awpMultiKillRoundsPerRound', weight: 1.5 },
      { key: 'awpOpeningKillsPerRound', weight: 2 },
    ],
    highlightStats: [
      { key: 'awpKillsPerRound', label: 'AWP K/R', format: fmtFloat3 },
      { key: 'awpKillsPct', label: 'AWP Kill %', format: fmtPct },
      { key: 'awpOpeningKillsPerRound', label: 'AWP Open/R', format: fmtFloat3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. The Spearhead — Entry Fragger
  // ---------------------------------------------------------------------------
  {
    id: 'spearhead',
    name: 'The Spearhead',
    role: 'Entry Fragger',
    tagline: 'First in. Always.',
    description:
      "The tip of the spear. Throws their body and their crosshair into every site take. The Spearhead lives at 100mph, takes the hardest opening duels in the server, and either breaks the round wide open or buys time with their life.",
    textClass: 'text-red-300',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/30',
    gradientClass: 'from-red-500/25 to-orange-500/15',
    ringClass: 'ring-red-500/40',
    barFromClass: 'from-red-500',
    barToClass: 'to-orange-500',
    icon: Zap,
    stats: [
      { key: 'openingAttemptsPct', weight: 4 },
      { key: 'openingKillsPerRound', weight: 3 },
      { key: 'openingSuccessPct', weight: 1.5 },
      { key: 'attacksPerRound', weight: 2 },
      { key: 'tOpeningKills', weight: 1 },
    ],
    highlightStats: [
      { key: 'openingKillsPerRound', label: 'Entry K/R', format: fmtFloat3 },
      { key: 'openingAttemptsPct', label: 'Entry Attempts %', format: fmtPct },
      { key: 'openingSuccessPct', label: 'Entry Win %', format: fmtPct },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. The Phantom — Lurker
  // ---------------------------------------------------------------------------
  {
    id: 'phantom',
    name: 'The Phantom',
    role: 'Lurker',
    tagline: 'Patience kills.',
    description:
      "Cuts off rotations. Slips in late. Picks the corner the team forgot. The Phantom thrives in the quiet — usually the last one standing on the T side, finishing what their team started two rooms over. Avoids opening duels, prints damage when the round opens up.",
    textClass: 'text-indigo-300',
    bgClass: 'bg-indigo-500/15',
    borderClass: 'border-indigo-500/30',
    gradientClass: 'from-indigo-500/25 to-purple-500/15',
    ringClass: 'ring-indigo-500/40',
    barFromClass: 'from-indigo-500',
    barToClass: 'to-purple-500',
    icon: Eye,
    stats: [
      { key: 'tRating', weight: 3 },
      { key: 'lastAlivePct', weight: 2.5 },
      { key: 'manAdvantageKillsPct', weight: 2 },
      { key: 'timeAlivePerRound', weight: 1.5 },
      { key: 'savesPerRoundLoss', weight: 1.5 },
      // Lurkers don't take opening duels.
      { key: 'openingAttemptsPct', weight: 2.5, inverted: true },
    ],
    highlightStats: [
      { key: 'tRating', label: 'T Rating', format: fmtFloat3 },
      { key: 'lastAlivePct', label: 'Last Alive %', format: fmtPct },
      { key: 'manAdvantageKillsPct', label: 'Man Adv K %', format: fmtPct },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. The Wall — CT Anchor
  // ---------------------------------------------------------------------------
  {
    id: 'wall',
    name: 'The Wall',
    role: 'CT Anchor',
    tagline: 'You shall not pass.',
    description:
      "Plant the bomb? Good luck. The Wall locks down a bombsite, denies executes, and racks up CT-side damage. Every round survived is a round their team didn't have to play 4-vs-5. Saves the rifle when it's gone — wins the round when it isn't.",
    textClass: 'text-cyan-300',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-500/30',
    gradientClass: 'from-cyan-500/25 to-sky-500/15',
    ringClass: 'ring-cyan-500/40',
    barFromClass: 'from-cyan-500',
    barToClass: 'to-sky-500',
    icon: Shield,
    stats: [
      { key: 'ctRating', weight: 4 },
      { key: 'ctEcoRating', weight: 1 },
      { key: 'manDisadvantageDeathsPct', weight: 2, inverted: true },
      { key: 'savesPerRoundLoss', weight: 2 },
      { key: 'survival', weight: 1.5 },
      { key: 'ctOpeningDeaths', weight: 1, inverted: true },
    ],
    highlightStats: [
      { key: 'ctRating', label: 'CT Rating', format: fmtFloat3 },
      { key: 'savesPerRoundLoss', label: 'Saves/Loss', format: fmtFloat3 },
      {
        key: 'manDisadvantageDeathsPct',
        label: 'Disadv Death %',
        format: fmtPct,
        inverted: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. The Architect — Utility / Support
  // ---------------------------------------------------------------------------
  {
    id: 'architect',
    name: 'The Architect',
    role: 'Utility & Support',
    tagline: 'Wins the round before the bullets.',
    description:
      "The mind behind the map. The Architect throws the right flash, takes space with smoke and molly, and feeds the team frags they didn't have to earn. Their utility damage is loud, their flash assists are louder.",
    textClass: 'text-emerald-300',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/30',
    gradientClass: 'from-emerald-500/25 to-teal-500/15',
    ringClass: 'ring-emerald-500/40',
    barFromClass: 'from-emerald-500',
    barToClass: 'to-teal-500',
    icon: Sparkles,
    stats: [
      { key: 'utilityDamagePerRound', weight: 3 },
      { key: 'flashAssistsPerRound', weight: 3 },
      { key: 'enemyFlashDurationPerRound', weight: 2.5 },
      { key: 'supportRoundsPct', weight: 2 },
      { key: 'assistsPerRound', weight: 1.5 },
      { key: 'flashesThrownPerRound', weight: 1 },
      { key: 'utilityKillsPer100Rounds', weight: 1 },
    ],
    highlightStats: [
      { key: 'utilityDamagePerRound', label: 'Util DMG/R', format: fmtFloat },
      { key: 'flashAssistsPerRound', label: 'Flash Asst/R', format: fmtFloat3 },
      { key: 'supportRoundsPct', label: 'Support %', format: fmtPct },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. The Wingman — Trader / Cleanup
  // ---------------------------------------------------------------------------
  {
    id: 'wingman',
    name: 'The Wingman',
    role: 'Trader / Cleanup',
    tagline: 'Two seconds late. One kill heavier.',
    description:
      "Always on the entry's shoulder. The Wingman is the trade-frag specialist — when a teammate goes down, this is the player who makes their death cost the enemy a body too. Fast trades, quick reads, dependable damage.",
    textClass: 'text-amber-300',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/30',
    gradientClass: 'from-amber-500/25 to-yellow-500/15',
    ringClass: 'ring-amber-500/40',
    barFromClass: 'from-amber-500',
    barToClass: 'to-yellow-500',
    icon: Users,
    stats: [
      { key: 'tradeKillsPerRound', weight: 4 },
      { key: 'tradeKillsPct', weight: 3 },
      { key: 'openingDeathsTradedPct', weight: 1.5 },
      { key: 'fastTrades', weight: 2 },
      { key: 'attacksPerRound', weight: 1 },
    ],
    highlightStats: [
      { key: 'tradeKillsPerRound', label: 'Trade K/R', format: fmtFloat3 },
      { key: 'tradeKillsPct', label: 'Trade %', format: fmtPct },
      { key: 'fastTrades', label: 'Fast Trades', format: fmtInt },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. The Closer — 1vX Clutch Specialist
  // ---------------------------------------------------------------------------
  {
    id: 'closer',
    name: 'The Closer',
    role: '1vX Clutch Specialist',
    tagline: 'Ice in the veins.',
    description:
      "When the round comes down to the wire, this is the name on the scoreboard. The Closer wins the 1v2s nobody else would, cleans up 1v3s, and saves the rifle on losses so their team can buy back next round.",
    textClass: 'text-yellow-300',
    bgClass: 'bg-yellow-500/15',
    borderClass: 'border-yellow-500/30',
    gradientClass: 'from-yellow-500/25 to-amber-500/15',
    ringClass: 'ring-yellow-500/40',
    barFromClass: 'from-yellow-500',
    barToClass: 'to-amber-500',
    icon: Trophy,
    stats: [
      { key: 'clutchPointsPerRound', weight: 4 },
      { key: 'clutch1v1WinPct', weight: 2 },
      { key: 'clutchWins', weight: 2 },
      { key: 'clutch1v2Wins', weight: 2 },
      { key: 'clutch1v3Wins', weight: 1.5 },
      { key: 'lastAlivePct', weight: 1.5 },
      { key: 'savesPerRoundLoss', weight: 1 },
    ],
    highlightStats: [
      { key: 'clutchPointsPerRound', label: 'Clutch Pts/R', format: fmtFloat3 },
      { key: 'clutchWins', label: 'Clutches Won', format: fmtInt },
      { key: 'clutch1v1WinPct', label: '1v1 Win %', format: fmtPct },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. The Hammer — Star Rifler / Pure Fragger
  // ---------------------------------------------------------------------------
  {
    id: 'hammer',
    name: 'The Hammer',
    role: 'Star Rifler',
    tagline: 'Numbers on the board.',
    description:
      "Pure firepower. The Hammer wakes up wanting kills and finds them — fat HLTV rating, big ADR, multi-kill rounds whenever the team needs a frag drop. Wins the duels they're supposed to win and steals a few they shouldn't: high duel swing means rifle-vs-rifle wins are reliable and pistol-vs-rifle upsets are routine.",
    textClass: 'text-rose-300',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/30',
    gradientClass: 'from-rose-500/25 to-pink-500/15',
    ringClass: 'ring-rose-500/40',
    barFromClass: 'from-rose-500',
    barToClass: 'to-pink-500',
    icon: Flame,
    stats: [
      { key: 'hltvRating', weight: 3.5 },
      { key: 'kpr', weight: 3 },
      { key: 'adr', weight: 2.5 },
      { key: 'duelSwingPerRound', weight: 2.5 },
      { key: 'roundsWithMultiKillPct', weight: 2 },
      { key: 'finalRating', weight: 2 },
      { key: 'probabilitySwingPerRound', weight: 1.5 },
    ],
    highlightStats: [
      { key: 'hltvRating', label: 'HLTV', format: fmtFloat3 },
      { key: 'adr', label: 'ADR', format: fmtADR },
      { key: 'duelSwingPerRound', label: 'Duel Swing/R', format: fmtFloat3 },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. The Vanguard — Two-Way All-Around (balance archetype)
  // ---------------------------------------------------------------------------
  {
    id: 'vanguard',
    name: 'The Vanguard',
    role: 'Two-Way Star',
    tagline: 'Both sides. Every round.',
    description:
      "No weak side. The Vanguard turns up on T and CT in equal measure — solid frags, high KAST, the player you can plug into any role and trust to come out positive on rating. The minimum-percentile scoring here means a Vanguard is good at everything, not just one thing.",
    textClass: 'text-sky-300',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-500/30',
    gradientClass: 'from-sky-500/25 to-blue-500/15',
    ringClass: 'ring-sky-500/40',
    barFromClass: 'from-sky-500',
    barToClass: 'to-blue-500',
    icon: Star,
    scoreMode: 'minBalance',
    stats: [
      { key: 'tRating', weight: 1 },
      { key: 'ctRating', weight: 1 },
      { key: 'hltvRating', weight: 1 },
      { key: 'kast', weight: 1 },
      { key: 'kpr', weight: 1 },
    ],
    highlightStats: [
      { key: 'tRating', label: 'T Rating', format: fmtFloat3 },
      { key: 'ctRating', label: 'CT Rating', format: fmtFloat3 },
      { key: 'kast', label: 'KAST', format: fmtPct },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. The Maverick — Eco / Pistol Specialist
  // ---------------------------------------------------------------------------
  {
    id: 'maverick',
    name: 'The Maverick',
    role: 'Eco & Pistol Specialist',
    tagline: 'Saves into wins.',
    description:
      "Force-buy hero. The Maverick punishes overcommitted economies, lifts pistol rounds with a deagle, and turns 2-vs-5 buy disadvantages into points on the board. The ones who steal rounds you weren't supposed to win.",
    textClass: 'text-orange-300',
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-500/30',
    gradientClass: 'from-orange-500/25 to-amber-500/15',
    ringClass: 'ring-orange-500/40',
    barFromClass: 'from-orange-500',
    barToClass: 'to-amber-500',
    icon: Coins,
    stats: [
      { key: 'pistolRoundRating', weight: 3 },
      { key: 'lowBuyKillsPct', weight: 3 },
      { key: 'disadvantagedBuyKillsPct', weight: 3 },
      { key: 'pistolVsRifleKills', weight: 1.5 },
    ],
    highlightStats: [
      { key: 'pistolRoundRating', label: 'Pistol Rating', format: fmtFloat3 },
      { key: 'lowBuyKillsPct', label: 'Low Buy K %', format: fmtPct },
      { key: 'disadvantagedBuyKillsPct', label: 'Disadv K %', format: fmtPct },
    ],
  },
];

export const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

// =============================================================================
// Scoring
// =============================================================================

/**
 * Returns the percentile (0-100) of a value within a sorted array, using
 * average-rank for ties. If `inverted` is true, the percentile is flipped so
 * that lower stat values produce higher percentiles (good for "lower is
 * better" stats).
 */
function percentile(value: number, sorted: number[], inverted: boolean): number {
  if (sorted.length === 0) return 50;

  // Binary-search style count via linear scan — sorted is small (hundreds).
  let lt = 0;
  let eq = 0;
  for (const v of sorted) {
    if (v < value) lt++;
    else if (v === value) eq++;
    else break; // sorted ascending — done
  }
  const rank = lt + eq / 2;
  let p = (rank / sorted.length) * 100;
  if (inverted) p = 100 - p;
  return Math.max(0, Math.min(100, p));
}

export interface ArchetypeMatch {
  archetypeId: string;
  score: number; // 0-100
}

export interface ArchetypeAssignment {
  primary: ArchetypeMatch;
  secondary: ArchetypeMatch | null;
  scores: ArchetypeMatch[]; // sorted desc — full leaderboard for the player
}

/**
 * Threshold below which a runner-up is considered too weak to display as a
 * secondary archetype. 55 = clearly above average in the relevant stats.
 */
const SECONDARY_MIN_SCORE = 55;

/**
 * Assigns each player in the pool a primary + optional secondary archetype
 * based on their stat percentiles within that pool.
 */
export function assignArchetypes(
  pool: { gp: GroupedPlayer; stats: PlayerStats }[],
): Map<string, ArchetypeAssignment> {
  // Collect every stat key referenced by any archetype, then build a sorted
  // value array per key for percentile lookups.
  const statKeys = new Set<keyof PlayerStats>();
  for (const arch of ARCHETYPES) {
    for (const s of arch.stats) statKeys.add(s.key);
  }

  const sortedByKey = new Map<keyof PlayerStats, number[]>();
  for (const key of statKeys) {
    const arr: number[] = [];
    for (const p of pool) {
      const v = Number(p.stats[key]);
      if (!isNaN(v)) arr.push(v);
    }
    arr.sort((a, b) => a - b);
    sortedByKey.set(key, arr);
  }

  const result = new Map<string, ArchetypeAssignment>();

  for (const { gp, stats } of pool) {
    const scores: ArchetypeMatch[] = [];

    for (const arch of ARCHETYPES) {
      const pcts: number[] = [];
      const weights: number[] = [];

      for (const s of arch.stats) {
        const sorted = sortedByKey.get(s.key) ?? [];
        const v = Number(stats[s.key]);
        const p = isNaN(v) ? 50 : percentile(v, sorted, !!s.inverted);
        pcts.push(p);
        weights.push(s.weight);
      }

      let score: number;
      if (arch.scoreMode === 'minBalance') {
        score = pcts.length === 0 ? 50 : Math.min(...pcts);
      } else {
        let weighted = 0;
        let totalWeight = 0;
        for (let i = 0; i < pcts.length; i++) {
          weighted += pcts[i] * weights[i];
          totalWeight += weights[i];
        }
        score = totalWeight > 0 ? weighted / totalWeight : 50;
      }

      scores.push({ archetypeId: arch.id, score });
    }

    scores.sort((a, b) => b.score - a.score);
    const primary = scores[0];
    const secondary =
      scores[1] && scores[1].score >= SECONDARY_MIN_SCORE ? scores[1] : null;

    result.set(gp.steamId, { primary, secondary, scores });
  }

  return result;
}

// =============================================================================
// Stat display / percentile helpers (used by the player modal)
// =============================================================================

export interface StatDisplay {
  label: string;
  format: (v: number) => string;
  /** Lower values are better — affects color tinting and percentile direction. */
  inverted?: boolean;
}

/**
 * Display metadata (label + formatter) for stats referenced by archetypes or
 * surfaced in the showcase. Anything missing falls back to a derived label.
 */
export const STAT_DISPLAY: Partial<Record<keyof PlayerStats, StatDisplay>> = {
  hltvRating: { label: 'HLTV Rating', format: fmtFloat3 },
  finalRating: { label: 'Final Rating', format: fmtFloat3 },
  kpr: { label: 'Kills / Round', format: fmtFloat3 },
  dpr: { label: 'Deaths / Round', format: fmtFloat3, inverted: true },
  adr: { label: 'ADR', format: fmtADR },
  kast: { label: 'KAST', format: fmtPct },
  headshotPct: { label: 'Headshot %', format: fmtPct },
  survival: { label: 'Survival %', format: fmtPct },
  damagePerKill: { label: 'Damage / Kill', format: fmtADR },
  timeAlivePerRound: { label: 'Time Alive / Rd', format: (v) => v.toFixed(1) + 's' },

  openingKillsPerRound: { label: 'Entry Kills / Rd', format: fmtFloat3 },
  openingDeathsPerRound: { label: 'Entry Deaths / Rd', format: fmtFloat3, inverted: true },
  openingAttemptsPct: { label: 'Entry Attempts %', format: fmtPct },
  openingSuccessPct: { label: 'Entry Success %', format: fmtPct },
  attacksPerRound: { label: 'Attacks / Rd', format: fmtFloat3 },
  tOpeningKills: { label: 'T Opening Kills', format: fmtInt },
  ctOpeningDeaths: { label: 'CT Opening Deaths', format: fmtInt, inverted: true },

  awpKills: { label: 'AWP Kills', format: fmtInt },
  awpKillsPct: { label: 'AWP Kill %', format: fmtPct },
  awpKillsPerRound: { label: 'AWP Kills / Rd', format: fmtFloat3 },
  roundsWithAwpKillPct: { label: 'AWP Round %', format: fmtPct },
  awpMultiKillRoundsPerRound: { label: 'AWP Multi / Rd', format: fmtFloat3 },
  awpOpeningKillsPerRound: { label: 'AWP Open / Rd', format: fmtFloat3 },

  tradeKillsPerRound: { label: 'Trade Kills / Rd', format: fmtFloat3 },
  tradeKillsPct: { label: 'Trade Kill %', format: fmtPct },
  fastTrades: { label: 'Fast Trades', format: fmtInt },
  openingDeathsTradedPct: { label: 'Open Death Trade %', format: fmtPct },

  clutchPointsPerRound: { label: 'Clutch Points / Rd', format: fmtFloat3 },
  clutchWins: { label: 'Clutches Won', format: fmtInt },
  clutch1v1WinPct: { label: '1v1 Win %', format: fmtPct },
  clutch1v2Wins: { label: '1v2 Wins', format: fmtInt },
  clutch1v3Wins: { label: '1v3 Wins', format: fmtInt },
  lastAlivePct: { label: 'Last Alive %', format: fmtPct },
  savesPerRoundLoss: { label: 'Saves / Loss', format: fmtFloat3 },

  utilityDamagePerRound: { label: 'Util DMG / Rd', format: fmtFloat },
  flashAssistsPerRound: { label: 'Flash Asst / Rd', format: fmtFloat3 },
  flashesThrownPerRound: { label: 'Flashes / Rd', format: fmtFloat3 },
  enemyFlashDurationPerRound: { label: 'Enemy Flash / Rd', format: fmtFloat },
  utilityKillsPer100Rounds: { label: 'Util Kills / 100', format: fmtFloat },
  supportRoundsPct: { label: 'Support %', format: fmtPct },
  assistsPerRound: { label: 'Assists / Rd', format: fmtFloat3 },

  tRating: { label: 'T Rating', format: fmtFloat3 },
  ctRating: { label: 'CT Rating', format: fmtFloat3 },
  tEcoRating: { label: 'T Eco Rating', format: fmtFloat3 },
  ctEcoRating: { label: 'CT Eco Rating', format: fmtFloat3 },

  pistolRoundRating: { label: 'Pistol Rating', format: fmtFloat3 },
  pistolVsRifleKills: { label: 'Pistol vs Rifle K', format: fmtInt },
  lowBuyKillsPct: { label: 'Low Buy Kill %', format: fmtPct },
  disadvantagedBuyKillsPct: { label: 'Disadv Kill %', format: fmtPct },

  manAdvantageKillsPct: { label: 'Man Adv Kill %', format: fmtPct },
  manDisadvantageDeathsPct: { label: 'Man Disadv Death %', format: fmtPct, inverted: true },

  duelSwingPerRound: { label: 'Duel Swing / Rd', format: fmtFloat3 },
  probabilitySwingPerRound: { label: 'Prob Swing / Rd', format: fmtFloat3 },
  econImpact: { label: 'Econ Impact', format: fmtFloat },
  roundImpact: { label: 'Round Impact', format: fmtFloat },

  roundsWithMultiKillPct: { label: 'Multi-Kill %', format: fmtPct },
  roundsWithKillPct: { label: 'Round w/ Kill %', format: fmtPct },
  killsPerRoundWin: { label: 'Kills / Round Win', format: fmtFloat3 },
  damagePerRoundWin: { label: 'DMG / Round Win', format: fmtADR },
};

/**
 * Curated list of "showcase-worthy" stats — these compete for the player's
 * highlighted #1 stat in the modal. Excludes redundant signals (e.g. having
 * both KPR and HLTV would double-count fragging).
 */
export const SHOWCASE_KEYS: (keyof PlayerStats)[] = [
  'hltvRating',
  'adr',
  'kast',
  'headshotPct',
  'survival',
  'openingKillsPerRound',
  'openingSuccessPct',
  'awpKillsPct',
  'awpKillsPerRound',
  'awpOpeningKillsPerRound',
  'tradeKillsPerRound',
  'tradeKillsPct',
  'clutchPointsPerRound',
  'clutch1v1WinPct',
  'lastAlivePct',
  'utilityDamagePerRound',
  'flashAssistsPerRound',
  'enemyFlashDurationPerRound',
  'duelSwingPerRound',
  'probabilitySwingPerRound',
  'tRating',
  'ctRating',
  'pistolRoundRating',
  'lowBuyKillsPct',
  'disadvantagedBuyKillsPct',
  'manAdvantageKillsPct',
  'roundsWithMultiKillPct',
  'savesPerRoundLoss',
];

function humanizeKey(key: string): string {
  return key
    .replace(/Pct$/, ' %')
    .replace(/PerRound$/, ' / Rd')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function getStatDisplay(key: keyof PlayerStats): StatDisplay {
  const d = STAT_DISPLAY[key];
  if (d) return d;
  return {
    label: humanizeKey(String(key)),
    format: (v) => (Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2)),
  };
}

export interface ComputedStat {
  key: keyof PlayerStats;
  label: string;
  value: number;
  /**
   * Percentile relative to the pool (0-100). Already inverted for "lower is
   * better" stats, so higher percentile always means "better fit".
   */
  percentile: number;
  inverted: boolean;
  /** Pre-formatted value string ready to render. */
  formatted: string;
}

function buildSortedPool(
  pool: { stats: PlayerStats }[],
  keys: Iterable<keyof PlayerStats>,
): Map<keyof PlayerStats, number[]> {
  const sortedByKey = new Map<keyof PlayerStats, number[]>();
  for (const key of keys) {
    if (sortedByKey.has(key)) continue;
    const arr: number[] = [];
    for (const p of pool) {
      const v = Number(p.stats[key]);
      if (!isNaN(v)) arr.push(v);
    }
    arr.sort((a, b) => a - b);
    sortedByKey.set(key, arr);
  }
  return sortedByKey;
}

/**
 * Compute percentiles for the curated SHOWCASE_KEYS, returning the list
 * sorted with the player's strongest stat first.
 */
export function computeShowcasePercentiles(
  stats: PlayerStats,
  pool: { stats: PlayerStats }[],
): ComputedStat[] {
  const sortedByKey = buildSortedPool(pool, SHOWCASE_KEYS);
  const out: ComputedStat[] = [];
  for (const key of SHOWCASE_KEYS) {
    const display = getStatDisplay(key);
    const v = Number(stats[key]);
    const sorted = sortedByKey.get(key) ?? [];
    const p = isNaN(v) ? 50 : percentile(v, sorted, !!display.inverted);
    out.push({
      key,
      label: display.label,
      value: v,
      percentile: p,
      inverted: !!display.inverted,
      formatted: display.format(v),
    });
  }
  return out.sort((a, b) => b.percentile - a.percentile);
}

// =============================================================================
// Overall Skill Rating
// =============================================================================

/**
 * Stats that contribute to a player's overall Skill Rating. The list is
 * intentionally broad: every per-round / percentage / rating stat that
 * reflects performance. We exclude raw counts (kills, games, side-rounds)
 * because those measure volume of play, not skill. Stats marked `inverted`
 * are "lower-is-better" (DPR, opening deaths, etc.) and are flipped before
 * averaging so higher percentile always means "better".
 */
const SKILL_RATING_KEYS: { key: keyof PlayerStats; inverted?: boolean }[] = [
  // Core combat
  { key: 'finalRating' },
  { key: 'hltvRating' },
  { key: 'kpr' },
  { key: 'dpr', inverted: true },
  { key: 'adr' },
  { key: 'kast' },
  { key: 'survival' },
  { key: 'headshotPct' },
  { key: 'avgTimeToKill', inverted: true },
  { key: 'damagePerKill' },
  { key: 'timeAlivePerRound' },
  { key: 'killsPerRoundWin' },
  { key: 'damagePerRoundWin' },
  { key: 'roundsWithKillPct' },
  { key: 'roundsWithMultiKillPct' },

  // Opening duels
  { key: 'openingKillsPerRound' },
  { key: 'openingDeathsPerRound', inverted: true },
  { key: 'openingSuccessPct' },
  { key: 'winPctAfterOpeningKill' },

  // Trading & team play
  { key: 'tradeKillsPerRound' },
  { key: 'tradeKillsPct' },
  { key: 'openingDeathsTradedPct' },

  // Clutch / late-round
  { key: 'clutchPointsPerRound' },
  { key: 'clutch1v1WinPct' },
  { key: 'savesPerRoundLoss' },
  { key: 'lastAlivePct' },

  // Round impact
  { key: 'econImpact' },
  { key: 'roundImpact' },
  { key: 'duelSwingPerRound' },
  { key: 'probabilitySwingPerRound' },

  // Combat situations
  { key: 'manAdvantageKillsPct' },
  { key: 'manDisadvantageDeathsPct', inverted: true },
  { key: 'lowBuyKillsPct' },
  { key: 'disadvantagedBuyKillsPct' },

  // Side-specific ratings
  { key: 'tRating' },
  { key: 'ctRating' },
  { key: 'tEcoRating' },
  { key: 'ctEcoRating' },
  { key: 'pistolRoundRating' },

  // Utility
  { key: 'utilityDamagePerRound' },
  { key: 'utilityKillsPer100Rounds' },
  { key: 'flashAssistsPerRound' },
  { key: 'enemyFlashDurationPerRound' },
  { key: 'teamFlashDurationPerRound', inverted: true },

  // Support play
  { key: 'supportRoundsPct' },
  { key: 'assistedKillsPct' },
  { key: 'assistsPerRound' },
  { key: 'attacksPerRound' },
];

export interface SkillRating {
  /** Average percentile across all SKILL_RATING_KEYS for this player. */
  avgPercentile: number;
  /** Percentile of avgPercentile within the pool — the public "skill rating". */
  skillRating: number;
  /** Number of stats that contributed (i.e. had numeric values). */
  statsCounted: number;
}

/**
 * Compute every player's overall Skill Rating in one pass.
 *
 * Two-stage percentile:
 *   1. For each stat in SKILL_RATING_KEYS, percentile-rank the player against
 *      the pool (inverting "lower-is-better" stats).
 *   2. Average those percentiles → "raw composite percentile".
 *   3. Re-percentile the raw composite against everyone else's raw composite.
 *      That's the player's Skill Rating (0-100).
 *
 * Stage 3 is what makes the metric meaningful even when raw averages cluster
 * tightly — it spreads players across the full 0-100 range.
 */
export function computeSkillRatings(
  pool: { gp: GroupedPlayer; stats: PlayerStats }[],
): Map<string, SkillRating> {
  const sortedByKey = buildSortedPool(
    pool,
    SKILL_RATING_KEYS.map((k) => k.key),
  );

  // Stage 1+2: each player's average percentile across all skill stats.
  const rawAverages: { steamId: string; avg: number; count: number }[] = [];
  for (const { gp, stats } of pool) {
    let sum = 0;
    let count = 0;
    for (const { key, inverted } of SKILL_RATING_KEYS) {
      const v = Number(stats[key]);
      if (isNaN(v)) continue;
      const sorted = sortedByKey.get(key) ?? [];
      const p = percentile(v, sorted, !!inverted);
      sum += p;
      count++;
    }
    const avg = count > 0 ? sum / count : 50;
    rawAverages.push({ steamId: gp.steamId, avg, count });
  }

  // Stage 3: percentile of each player's avg vs all averages.
  const sortedAvgs = rawAverages.map((r) => r.avg).sort((a, b) => a - b);

  const result = new Map<string, SkillRating>();
  for (const { steamId, avg, count } of rawAverages) {
    const skillRating = percentile(avg, sortedAvgs, false);
    result.set(steamId, {
      avgPercentile: avg,
      skillRating,
      statsCounted: count,
    });
  }
  return result;
}

export const SKILL_RATING_STAT_COUNT = SKILL_RATING_KEYS.length;

/**
 * Compute percentiles for the archetype's own defining stats. Useful for the
 * "fit breakdown" section in the modal.
 */
export function computeArchetypeStatPercentiles(
  stats: PlayerStats,
  arch: Archetype,
  pool: { stats: PlayerStats }[],
): (ComputedStat & { weight: number })[] {
  const keys = arch.stats.map((s) => s.key);
  const sortedByKey = buildSortedPool(pool, keys);
  return arch.stats.map((s) => {
    const display = getStatDisplay(s.key);
    const v = Number(stats[s.key]);
    const sorted = sortedByKey.get(s.key) ?? [];
    // Invert direction comes from the archetype's own definition.
    const p = isNaN(v) ? 50 : percentile(v, sorted, !!s.inverted);
    return {
      key: s.key,
      label: display.label,
      value: v,
      percentile: p,
      inverted: !!s.inverted,
      formatted: display.format(v),
      weight: s.weight,
    };
  });
}
