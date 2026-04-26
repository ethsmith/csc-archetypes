/**
 * Centralized stat ranges configuration
 * 
 * This file contains all threshold values for determining if a stat is
 * good, average, or bad. Update values here to reflect changes across
 * the entire application.
 * 
 * Each stat has three thresholds:
 * - good: Value at or above this is considered good (green)
 * - average: Value at or above this is considered average (yellow/blue)
 * - bad: Values below average are considered bad (red/orange)
 * 
 * For inverted stats (where lower is better), set inverted: true
 */

export interface StatRange {
  good: number;
  average: number;
  inverted?: boolean; // If true, lower values are better
}

export interface StatRanges {
  // Core Stats
  hltvRating: StatRange;
  finalRating: StatRange;
  adr: StatRange;
  kpr: StatRange;
  dpr: StatRange;
  kast: StatRange;
  kdRatio: StatRange;
  headshotPct: StatRange;
  survival: StatRange;
  avgTimeToKill: StatRange;
  damagePerKill: StatRange;
  timeAlivePerRound: StatRange;

  // Opening Duels
  openingKillsPerRound: StatRange;
  openingDeathsPerRound: StatRange;
  openingAttemptsPct: StatRange;
  openingSuccessPct: StatRange;
  winPctAfterOpeningKill: StatRange;
  attacksPerRound: StatRange;

  // Clutch
  clutchPointsPerRound: StatRange;
  clutch1v1WinPct: StatRange;
  lastAlivePct: StatRange;
  savesPerRoundLoss: StatRange;

  // Trading
  tradeKillsPerRound: StatRange;
  tradeKillsPct: StatRange;
  tradedDeathsPct: StatRange;
  savedTeammatePerRound: StatRange;
  savedByTeammatePerRound: StatRange;
  openingDeathsTradedPct: StatRange;

  // Support
  assistsPerRound: StatRange;
  supportRoundsPct: StatRange;
  assistedKillsPct: StatRange;

  // AWP/Sniping
  awpKillsPerRound: StatRange;
  awpKillsPct: StatRange;
  roundsWithAwpKillPct: StatRange;
  awpMultiKillRoundsPerRound: StatRange;
  awpOpeningKillsPerRound: StatRange;

  // Utility
  utilityDamagePerRound: StatRange;
  utilityKillsPer100Rounds: StatRange;
  flashesThrownPerRound: StatRange;
  flashAssistsPerRound: StatRange;
  enemyFlashDurationPerRound: StatRange;

  // Multi-kills
  roundsWithKillPct: StatRange;
  roundsWithMultiKillPct: StatRange;
  killsPerRoundWin: StatRange;
  damagePerRoundWin: StatRange;

  // Pistol Rounds
  pistolRoundRating: StatRange;

  // Side-specific
  tRating: StatRange;
  ctRating: StatRange;
  tEcoRating: StatRange;
  ctEcoRating: StatRange;

  // Economy & Impact
  econImpact: StatRange;
  roundImpact: StatRange;
  probabilitySwingPerRound: StatRange;
  duelSwingPerRound: StatRange;

  // Map Ratings
  mapRating: StatRange; // Generic for all map ratings

  // Trading extras
  tradedDeathsPerRound: StatRange;

  // Combat Situations
  manAdvantageKillsPct: StatRange;
  manDisadvantageDeathsPct: StatRange;
  exitFrags: StatRange;
  earlyDeaths: StatRange;

  // Buy Situations
  lowBuyKillsPct: StatRange;
  disadvantagedBuyKillsPct: StatRange;

  // Team Flash (inverted - lower is better)
  teamFlashDurationPerRound: StatRange;

  // Team Metrics
  mmrUsagePct: StatRange;
  ratingSpread: StatRange;
  mmrEfficiency: StatRange;
}

/**
 * Default stat ranges
 * Values are based on actual CSC league data (555 players analyzed)
 * - "average" = median (50th percentile)
 * - "good" = p75 (75th percentile, top 25%)
 */
export const statRanges: StatRanges = {
  // Core Stats (from actual data)
  hltvRating: { good: 0.54, average: 0.397 }, // p75=0.54, median=0.397
  finalRating: { good: 1.151, average: 1.031 }, // p75=1.151, median=1.031
  adr: { good: 81.25, average: 74.58 }, // p75=81.25, median=74.58
  kpr: { good: 0.767, average: 0.682 }, // p75=0.767, median=0.682
  dpr: { good: 0.657, average: 0.707, inverted: true }, // p25=0.657, median=0.707 (lower is better)
  kast: { good: 0.764, average: 0.714 }, // p75=0.764, median=0.714
  kdRatio: { good: 1.1, average: 1.0 }, // Calculated: good K/D > 1.1, average ~1.0
  headshotPct: { good: 0.507, average: 0.432 }, // p75=0.507, median=0.432
  survival: { good: 0.347, average: 0.296 }, // p75=0.347, median=0.296
  avgTimeToKill: { good: 0.338, average: 0.422, inverted: true }, // p25=0.338, median=0.422 (lower is better)
  damagePerKill: { good: 116.18, average: 108.92 }, // p75=116.18, median=108.92
  timeAlivePerRound: { good: 63.9, average: 59.91 }, // p75=63.9, median=59.91

  // Opening Duels
  openingKillsPerRound: { good: 0.125, average: 0.096 }, // p75=0.125, median=0.096
  openingDeathsPerRound: { good: 0.071, average: 0.095, inverted: true }, // p25=0.071, median=0.095 (lower is better)
  openingAttemptsPct: { good: 0.238, average: 0.195 }, // p75=0.238, median=0.195
  openingSuccessPct: { good: 0.591, average: 0.5 }, // p75=0.591, median=0.5
  winPctAfterOpeningKill: { good: 0.833, average: 0.727 }, // p75=0.833, median=0.727
  attacksPerRound: { good: 0.517, average: 0.47 }, // p75=0.517, median=0.47

  // Clutch
  clutchPointsPerRound: { good: 0.013, average: 0.01 }, // p75=0.013, median=0.01
  clutch1v1WinPct: { good: 1.0, average: 1.0 }, // Most players at 100% (small sample)
  lastAlivePct: { good: 0.042, average: 0.028 }, // p75=0.042, median=0.028
  savesPerRoundLoss: { good: 0.077, average: 0.051 }, // p75=0.077, median=0.051

  // Trading
  tradeKillsPerRound: { good: 0.146, average: 0.118 }, // p75=0.146, median=0.118
  tradeKillsPct: { good: 0.214, average: 0.174 }, // p75=0.214, median=0.174
  tradedDeathsPct: { good: 0.222, average: 0.182 }, // p75=0.222, median=0.182
  savedTeammatePerRound: { good: 0.157, average: 0.126 }, // p75=0.157, median=0.126
  savedByTeammatePerRound: { good: 0.156, average: 0.128 }, // p75=0.156, median=0.128
  openingDeathsTradedPct: { good: 0.333, average: 0.222 }, // p75=0.333, median=0.222

  // Support
  assistsPerRound: { good: 0.288, average: 0.238 }, // p75=0.288, median=0.238
  supportRoundsPct: { good: 0.429, average: 0.349 }, // p75=0.429, median=0.349
  assistedKillsPct: { good: 0.432, average: 0.343 }, // p75=0.432, median=0.343

  // AWP/Sniping
  awpKillsPerRound: { good: 0.216, average: 0.051 }, // p75=0.216, median=0.051
  awpKillsPct: { good: 0.308, average: 0.078 }, // p75=0.308, median=0.078
  roundsWithAwpKillPct: { good: 0.153, average: 0.043 }, // p75=0.153, median=0.043
  awpMultiKillRoundsPerRound: { good: 0.067, average: 0.038 }, // p75=0.067, median=0.038
  awpOpeningKillsPerRound: { good: 0.063, average: 0.037 }, // p75=0.063, median=0.037

  // Utility
  utilityDamagePerRound: { good: 5.95, average: 4.1 }, // p75=5.95, median=4.1
  utilityKillsPer100Rounds: { good: 2.54, average: 1.68 }, // p75=2.54, median=1.68
  flashesThrownPerRound: { good: 0.575, average: 0.402 }, // p75=0.575, median=0.402
  flashAssistsPerRound: { good: 0.544, average: 0.36 }, // p75=0.544, median=0.36
  enemyFlashDurationPerRound: { good: 1.335, average: 0.863 }, // p75=1.335, median=0.863

  // Multi-kills
  roundsWithKillPct: { good: 0.517, average: 0.47 }, // p75=0.517, median=0.47
  roundsWithMultiKillPct: { good: 0.195, average: 0.165 }, // p75=0.195, median=0.165
  killsPerRoundWin: { good: 1.064, average: 0.938 }, // p75=1.064, median=0.938
  damagePerRoundWin: { good: 104.23, average: 93.34 }, // p75=104.23, median=93.34

  // Pistol Rounds
  pistolRoundRating: { good: 0.557, average: 0.213 }, // p75=0.557, median=0.213

  // Side-specific
  tRating: { good: 0.506, average: 0.312 }, // p75=0.506, median=0.312
  ctRating: { good: 0.709, average: 0.491 }, // p75=0.709, median=0.491
  tEcoRating: { good: 1.12, average: 0.96 }, // p75=1.12, median=0.96
  ctEcoRating: { good: 1.256, average: 1.113 }, // p75=1.256, median=1.113

  // Economy & Impact
  econImpact: { good: 17.36, average: 15.18 }, // p75=17.36, median=15.18
  roundImpact: { good: 17.36, average: 15.18 }, // Same as econImpact
  probabilitySwingPerRound: { good: 0.046, average: 0.031 }, // p75=0.046, median=0.031
  duelSwingPerRound: { good: 0.05, average: 0.03 }, // Estimated based on similar impact stats

  // Map Ratings
  mapRating: { good: 1.22, average: 1.03 }, // Approx p75 and median across all maps

  // Trading extras
  tradedDeathsPerRound: { good: 0.156, average: 0.129 }, // p75=0.156, median=0.129

  // Combat Situations
  manAdvantageKillsPct: { good: 0.234, average: 0.198 }, // p75=0.234, median=0.198
  manDisadvantageDeathsPct: { good: 0.16, average: 0.196, inverted: true }, // p25=0.16, median=0.196 (lower is better)
  exitFrags: { good: 0, average: 0 }, // No data (all zeros)
  earlyDeaths: { good: 12, average: 18, inverted: true }, // p25=12, median=18 (lower is better)

  // Buy Situations
  lowBuyKillsPct: { good: 0.519, average: 0.442 }, // p75=0.519, median=0.442
  disadvantagedBuyKillsPct: { good: 0.353, average: 0.287 }, // p75=0.353, median=0.287

  // Team Flash (inverted - lower is better)
  teamFlashDurationPerRound: { good: 0.218, average: 0.39, inverted: true }, // p25=0.218, median=0.39 (lower is better)

  // Team Metrics (keeping original values as these are team-level, not player stats)
  mmrUsagePct: { good: 80, average: 95, inverted: true },
  ratingSpread: { good: 0.25, average: 0.35, inverted: true },
  mmrEfficiency: { good: 2.8, average: 2.4 },
};

/**
 * Get the color class for a stat value based on its range
 * @param value The stat value
 * @param range The stat range configuration
 * @returns Tailwind color class
 */
export function getStatColor(value: number, range: StatRange): string {
  if (range.inverted) {
    if (value <= range.good) return 'text-emerald-400';
    if (value <= range.average) return 'text-neon-blue';
    return 'text-red-400';
  } else {
    if (value >= range.good) return 'text-emerald-400';
    if (value >= range.average) return 'text-neon-blue';
    return 'text-red-400';
  }
}

/**
 * Get the background color class for a stat value based on its range
 * @param value The stat value
 * @param range The stat range configuration
 * @returns Tailwind background color class
 */
export function getStatBgColor(value: number, range: StatRange): string {
  if (range.inverted) {
    if (value <= range.good) return 'bg-emerald-400';
    if (value <= range.average) return 'bg-neon-blue';
    return 'bg-red-400';
  } else {
    if (value >= range.good) return 'bg-emerald-400';
    if (value >= range.average) return 'bg-neon-blue';
    return 'bg-red-400';
  }
}

/**
 * Get the rating tier label for a stat value
 * @param value The stat value
 * @param range The stat range configuration
 * @returns 'good' | 'average' | 'bad'
 */
export function getStatTier(value: number, range: StatRange): 'good' | 'average' | 'bad' {
  if (range.inverted) {
    if (value <= range.good) return 'good';
    if (value <= range.average) return 'average';
    return 'bad';
  } else {
    if (value >= range.good) return 'good';
    if (value >= range.average) return 'average';
    return 'bad';
  }
}

/**
 * Get a human-readable label for a rating value
 * @param rating The rating value (e.g., HLTV rating)
 * @returns Label like 'Excellent', 'Good', 'Average', 'Needs work'
 */
export function getRatingLabel(rating: number): string {
  if (rating >= statRanges.hltvRating.good + 0.1) return 'Excellent';
  if (rating >= statRanges.hltvRating.good) return 'Good';
  if (rating >= statRanges.hltvRating.average) return 'Average';
  return 'Needs work';
}

/**
 * Percentile thresholds for rating colors
 * Used in HLTV-style rating cards
 */
export const percentileThresholds = {
  excellent: 80, // Green
  good: 60,      // Blue
  average: 40,   // Yellow
  belowAverage: 20, // Orange
  // Below 20 is red
};

/**
 * Get color for a percentile value
 * @param percentile 0-100 percentile value
 * @returns Tailwind color class
 */
export function getPercentileColor(percentile: number): string {
  if (percentile >= percentileThresholds.excellent) return 'text-emerald-400';
  if (percentile >= percentileThresholds.good) return 'text-neon-blue';
  if (percentile >= percentileThresholds.average) return 'text-yellow-400';
  if (percentile >= percentileThresholds.belowAverage) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get background color for a percentile value
 * @param percentile 0-100 percentile value
 * @returns Tailwind background color class
 */
export function getPercentileBgColor(percentile: number): string {
  if (percentile >= percentileThresholds.excellent) return 'bg-emerald-400';
  if (percentile >= percentileThresholds.good) return 'bg-neon-blue';
  if (percentile >= percentileThresholds.average) return 'bg-yellow-400';
  if (percentile >= percentileThresholds.belowAverage) return 'bg-orange-400';
  return 'bg-red-400';
}
