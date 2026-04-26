import type { PlayerStats, GroupedPlayer } from './types';
import { fetchAllPlayers, type CscPlayer } from './fetchFranchises';

/**
 * Player-stats API.
 *
 * One document per (match_id, steam_id) — see /home/admin/WebstormProjects/fragg-3.0-api/.
 * The parser at /home/admin/Documents/code/GolandProjects/ecorating/ ingests demos and
 * POSTs each match's player rows to the API. This client paginates through every
 * doc and aggregates them per-player (summing counters, weighting rates by
 * rounds_played) so the existing archetype/UI layer keeps the same per-player
 * `PlayerStats` shape it had when it was reading the legacy spreadsheet.
 *
 * Currently the API only stores regulation matches; combine and scrim aren't
 * separated yet, so every aggregate goes into the `regulation` bucket and
 * `scrim` is left empty.
 */

const STATS_API_BASE = 'https://fragg-3-0-api.vercel.app';
const PAGE_LIMIT = 500; // server caps ?limit at 500

type ApiDoc = Record<string, unknown> & {
  match_id?: string;
  steam_id?: string;
  name?: string;
  team_name?: string;
  rounds_played?: number;
  multi_kills?: {
    '1k'?: number;
    '2k'?: number;
    '3k'?: number;
    '4k'?: number;
    '5k'?: number;
  };
};

interface ApiResponse {
  total: number;
  count: number;
  skip: number;
  limit: number;
  results: ApiDoc[];
}

// ---------------------------------------------------------------------------
// Field maps: snake_case API field → camelCase PlayerStats key.
// ---------------------------------------------------------------------------

/**
 * Counters / cumulative event totals — summed across all of a player's matches.
 * Anything that grows linearly with games played goes here.
 */
const SUM_FIELDS: Record<string, keyof PlayerStats> = {
  rounds_played: 'roundsPlayed',
  rounds_won: 'roundsWon',
  rounds_lost: 'roundsLost',
  kills: 'kills',
  assists: 'assists',
  deaths: 'deaths',
  damage: 'damage',
  headshots: 'headshots',
  opening_kills: 'openingKills',
  opening_deaths: 'openingDeaths',
  opening_attempts: 'openingAttempts',
  opening_successes: 'openingSuccesses',
  rounds_won_after_opening: 'roundsWonAfterOpening',
  perfect_kills: 'perfectKills',
  trade_denials: 'tradeDenials',
  trade_kills: 'tradeKills',
  traded_deaths: 'tradedDeaths',
  fast_trades: 'fastTrades',
  clutch_rounds: 'clutchRounds',
  clutch_wins: 'clutchWins',
  clutch_1v1_attempts: 'clutch1v1Attempts',
  clutch_1v1_wins: 'clutch1v1Wins',
  clutch_1v2_attempts: 'clutch1v2Attempts',
  clutch_1v2_wins: 'clutch1v2Wins',
  clutch_1v3_attempts: 'clutch1v3Attempts',
  clutch_1v3_wins: 'clutch1v3Wins',
  clutch_1v4_attempts: 'clutch1v4Attempts',
  clutch_1v4_wins: 'clutch1v4Wins',
  clutch_1v5_attempts: 'clutch1v5Attempts',
  clutch_1v5_wins: 'clutch1v5Wins',
  awp_kills: 'awpKills',
  awp_deaths: 'awpDeaths',
  awp_deaths_no_kill: 'awpDeathsNoKill',
  rounds_with_awp_kill: 'roundsWithAwpKill',
  awp_multi_kill_rounds: 'awpMultiKillRounds',
  awp_opening_kills: 'awpOpeningKills',
  saved_by_teammate: 'savedByTeammate',
  saved_teammate: 'savedTeammate',
  opening_deaths_traded: 'openingDeathsTraded',
  support_rounds: 'supportRounds',
  assisted_kills: 'assistedKills',
  attack_rounds: 'attackRounds',
  last_alive_rounds: 'lastAliveRounds',
  saves_on_loss: 'savesOnLoss',
  utility_damage: 'utilityDamage',
  utility_kills: 'utilityKills',
  flashes_thrown: 'flashesThrown',
  flash_assists: 'flashAssists',
  team_flash_count: 'teamFlashCount',
  exit_frags: 'exitFrags',
  knife_kills: 'knifeKills',
  pistol_vs_rifle_kills: 'pistolVsRifleKills',
  early_deaths: 'earlyDeaths',
  low_buy_kills: 'lowBuyKills',
  disadvantaged_buy_kills: 'disadvantagedBuyKills',
  man_advantage_kills: 'manAdvantageKills',
  man_disadvantage_deaths: 'manDisadvantageDeaths',
  pistol_rounds_played: 'pistolRoundsPlayed',
  pistol_round_kills: 'pistolRoundKills',
  pistol_round_deaths: 'pistolRoundDeaths',
  pistol_round_damage: 'pistolRoundDamage',
  pistol_rounds_won: 'pistolRoundsWon',
  pistol_round_survivals: 'pistolRoundSurvivals',
  pistol_round_multi_kills: 'pistolRoundMultiKills',
  t_rounds_played: 'tRoundsPlayed',
  t_kills: 'tKills',
  t_deaths: 'tDeaths',
  t_damage: 'tDamage',
  t_survivals: 'tSurvivals',
  t_rounds_with_multi_kill: 'tRoundsWithMultiKill',
  t_kast: 'tKast',
  t_clutch_rounds: 'tClutchRounds',
  t_clutch_wins: 'tClutchWins',
  t_man_advantage_kills: 'tManAdvantageKills',
  t_man_disadvantage_deaths: 'tManDisadvantageDeaths',
  t_opening_kills: 'tOpeningKills',
  t_opening_deaths: 'tOpeningDeaths',
  ct_rounds_played: 'ctRoundsPlayed',
  ct_kills: 'ctKills',
  ct_deaths: 'ctDeaths',
  ct_damage: 'ctDamage',
  ct_survivals: 'ctSurvivals',
  ct_rounds_with_multi_kill: 'ctRoundsWithMultiKill',
  ct_kast: 'ctKast',
  ct_clutch_rounds: 'ctClutchRounds',
  ct_clutch_wins: 'ctClutchWins',
  ct_man_advantage_kills: 'ctManAdvantageKills',
  ct_man_disadvantage_deaths: 'ctManDisadvantageDeaths',
  ct_opening_kills: 'ctOpeningKills',
  ct_opening_deaths: 'ctOpeningDeaths',
  rounds_with_kill: 'roundsWithKill',
  rounds_with_multi_kill: 'roundsWithMultiKill',
  kills_in_won_rounds: 'killsInWonRounds',
  damage_in_won_rounds: 'damageInWonRounds',
  smokes_thrown: 'smokesThrown',
  hes_thrown: 'hesThrown',
  molotovs_thrown: 'molotovsThrown',
  total_nades_thrown: 'totalNadesThrown',
  he_damage: 'heDamage',
  fire_damage: 'fireDamage',
  damage_taken: 'damageTaken',
  enemies_flashed: 'enemiesFlashed',
  eco_kill_value: 'ecoKillValue',
  eco_death_value: 'ecoDeathValue',
  duel_swing: 'duelSwing',
  econ_impact: 'econImpact',
  round_impact: 'roundImpact',
  probability_swing: 'probabilitySwing',
  t_eco_kill_value: 'tEcoKillValue',
  ct_eco_kill_value: 'ctEcoKillValue',
};

/**
 * Rate / percentage / rating fields — weighted-averaged by rounds_played.
 *
 * Weighting by rounds means a 50-round match counts ~3× more than a 16-round
 * pistol-stomp blowout, which matches how a season-long aggregate would have
 * been derived in the legacy spreadsheet.
 */
const RATE_FIELDS: Record<string, keyof PlayerStats> = {
  adr: 'adr',
  kpr: 'kpr',
  dpr: 'dpr',
  kast: 'kast',
  survival: 'survival',
  headshot_pct: 'headshotPct',
  avg_time_to_kill: 'avgTimeToKill',
  avg_time_to_death: 'avgTimeToDeath',
  damage_per_kill: 'damagePerKill',
  time_alive_per_round: 'timeAlivePerRound',
  damage_per_round_win: 'damagePerRoundWin',
  kills_per_round_win: 'killsPerRoundWin',
  rounds_with_kill_pct: 'roundsWithKillPct',
  rounds_with_multi_kill_pct: 'roundsWithMultiKillPct',
  last_alive_pct: 'lastAlivePct',
  saves_per_round_loss: 'savesPerRoundLoss',
  opening_kills_per_round: 'openingKillsPerRound',
  opening_deaths_per_round: 'openingDeathsPerRound',
  opening_attempts_pct: 'openingAttemptsPct',
  opening_success_pct: 'openingSuccessPct',
  win_pct_after_opening_kill: 'winPctAfterOpeningKill',
  clutch_points_per_round: 'clutchPointsPerRound',
  clutch_1v1_win_pct: 'clutch1v1WinPct',
  trade_kills_per_round: 'tradeKillsPerRound',
  trade_kills_pct: 'tradeKillsPct',
  traded_deaths_per_round: 'tradedDeathsPerRound',
  traded_deaths_pct: 'tradedDeathsPct',
  saved_by_teammate_per_round: 'savedByTeammatePerRound',
  saved_teammate_per_round: 'savedTeammatePerRound',
  opening_deaths_traded_pct: 'openingDeathsTradedPct',
  assisted_kills_pct: 'assistedKillsPct',
  assists_per_round: 'assistsPerRound',
  support_rounds_pct: 'supportRoundsPct',
  man_advantage_kills_pct: 'manAdvantageKillsPct',
  man_disadvantage_deaths_pct: 'manDisadvantageDeathsPct',
  low_buy_kills_pct: 'lowBuyKillsPct',
  disadvantaged_buy_kills_pct: 'disadvantagedBuyKillsPct',
  attacks_per_round: 'attacksPerRound',
  awp_kills_per_round: 'awpKillsPerRound',
  awp_kills_pct: 'awpKillsPct',
  rounds_with_awp_kill_pct: 'roundsWithAwpKillPct',
  awp_multi_kill_rounds_per_round: 'awpMultiKillRoundsPerRound',
  awp_opening_kills_per_round: 'awpOpeningKillsPerRound',
  utility_damage_per_round: 'utilityDamagePerRound',
  utility_kills_per_100_rounds: 'utilityKillsPer100Rounds',
  flashes_thrown_per_round: 'flashesThrownPerRound',
  flash_assists_per_round: 'flashAssistsPerRound',
  enemy_flash_duration_per_round: 'enemyFlashDurationPerRound',
  team_flash_duration_per_round: 'teamFlashDurationPerRound',
  pistol_round_rating: 'pistolRoundRating',
  hltv_rating: 'hltvRating',
  final_rating: 'finalRating',
  t_rating: 'tRating',
  t_eco_rating: 'tEcoRating',
  ct_rating: 'ctRating',
  ct_eco_rating: 'ctEcoRating',
  duel_swing_per_round: 'duelSwingPerRound',
  probability_swing_per_round: 'probabilitySwingPerRound',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAllStatsDocs(): Promise<ApiDoc[]> {
  const docs: ApiDoc[] = [];
  let skip = 0;

  // Pull pages until we've drained `total`. The first page tells us how many
  // documents exist; subsequent pages just keep offsetting until we've got them.
  for (;;) {
    const url = `${STATS_API_BASE}/player-stats?limit=${PAGE_LIMIT}&skip=${skip}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`stats API ${url} returned ${res.status}`);
    }
    const page = (await res.json()) as ApiResponse;

    docs.push(...page.results);

    skip += page.results.length;
    if (page.results.length === 0 || skip >= page.total) break;
  }

  return docs;
}

/** Returns a zero-initialised PlayerStats; aggregator overwrites fields it knows about. */
function emptyStats(): PlayerStats {
  return {
    steamId: '',
    name: '',
    tier: '',
    games: 0,
    finalRating: 0,
    hltvRating: 0,
    roundsPlayed: 0,
    roundsWon: 0,
    roundsLost: 0,
    kills: 0,
    assists: 0,
    deaths: 0,
    damage: 0,
    adr: 0,
    kpr: 0,
    dpr: 0,
    kast: 0,
    survival: 0,
    headshots: 0,
    headshotPct: 0,
    avgTimeToKill: 0,
    openingKills: 0,
    openingDeaths: 0,
    openingAttempts: 0,
    openingSuccesses: 0,
    openingKillsPerRound: 0,
    openingDeathsPerRound: 0,
    openingAttemptsPct: 0,
    openingSuccessPct: 0,
    roundsWonAfterOpening: 0,
    winPctAfterOpeningKill: 0,
    ecoKillValue: 0,
    ecoDeathValue: 0,
    duelSwing: 0,
    duelSwingPerRound: 0,
    econImpact: 0,
    roundImpact: 0,
    probabilitySwing: 0,
    probabilitySwingPerRound: 0,
    clutchRounds: 0,
    clutchWins: 0,
    clutchPointsPerRound: 0,
    clutch1v1Attempts: 0,
    clutch1v1Wins: 0,
    clutch1v1WinPct: 0,
    tradeKills: 0,
    tradeKillsPerRound: 0,
    tradeKillsPct: 0,
    fastTrades: 0,
    tradedDeaths: 0,
    tradedDeathsPerRound: 0,
    tradedDeathsPct: 0,
    tradeDenials: 0,
    savedByTeammate: 0,
    savedByTeammatePerRound: 0,
    savedTeammate: 0,
    savedTeammatePerRound: 0,
    openingDeathsTraded: 0,
    openingDeathsTradedPct: 0,
    awpKills: 0,
    awpKillsPerRound: 0,
    awpKillsPct: 0,
    roundsWithAwpKill: 0,
    roundsWithAwpKillPct: 0,
    awpMultiKillRounds: 0,
    awpMultiKillRoundsPerRound: 0,
    awpOpeningKills: 0,
    awpOpeningKillsPerRound: 0,
    awpDeaths: 0,
    awpDeathsNoKill: 0,
    oneK: 0,
    twoK: 0,
    threeK: 0,
    fourK: 0,
    fiveK: 0,
    roundsWithKill: 0,
    roundsWithKillPct: 0,
    roundsWithMultiKill: 0,
    roundsWithMultiKillPct: 0,
    killsInWonRounds: 0,
    killsPerRoundWin: 0,
    damageInWonRounds: 0,
    damagePerRoundWin: 0,
    perfectKills: 0,
    damagePerKill: 0,
    knifeKills: 0,
    pistolVsRifleKills: 0,
    supportRounds: 0,
    supportRoundsPct: 0,
    assistedKills: 0,
    assistedKillsPct: 0,
    assistsPerRound: 0,
    attackRounds: 0,
    attacksPerRound: 0,
    timeAlivePerRound: 0,
    lastAliveRounds: 0,
    lastAlivePct: 0,
    savesOnLoss: 0,
    savesPerRoundLoss: 0,
    utilityDamage: 0,
    utilityDamagePerRound: 0,
    utilityKills: 0,
    utilityKillsPer100Rounds: 0,
    flashesThrown: 0,
    flashesThrownPerRound: 0,
    flashAssists: 0,
    flashAssistsPerRound: 0,
    enemyFlashDurationPerRound: 0,
    teamFlashCount: 0,
    teamFlashDurationPerRound: 0,
    exitFrags: 0,
    earlyDeaths: 0,
    manAdvantageKills: 0,
    manAdvantageKillsPct: 0,
    manDisadvantageDeaths: 0,
    manDisadvantageDeathsPct: 0,
    lowBuyKills: 0,
    lowBuyKillsPct: 0,
    disadvantagedBuyKills: 0,
    disadvantagedBuyKillsPct: 0,
    pistolRoundsPlayed: 0,
    pistolRoundKills: 0,
    pistolRoundDeaths: 0,
    pistolRoundDamage: 0,
    pistolRoundsWon: 0,
    pistolRoundSurvivals: 0,
    pistolRoundMultiKills: 0,
    pistolRoundRating: 0,
    tRoundsPlayed: 0,
    tKills: 0,
    tDeaths: 0,
    tDamage: 0,
    tSurvivals: 0,
    tRoundsWithMultiKill: 0,
    tEcoKillValue: 0,
    tKast: 0,
    tClutchRounds: 0,
    tClutchWins: 0,
    tManAdvantageKills: 0,
    tManAdvantageKillsPct: 0,
    tManDisadvantageDeaths: 0,
    tManDisadvantageDeathsPct: 0,
    tRating: 0,
    tEcoRating: 0,
    ctRoundsPlayed: 0,
    ctKills: 0,
    ctDeaths: 0,
    ctDamage: 0,
    ctSurvivals: 0,
    ctRoundsWithMultiKill: 0,
    ctEcoKillValue: 0,
    ctKast: 0,
    ctClutchRounds: 0,
    ctClutchWins: 0,
    ctManAdvantageKills: 0,
    ctManAdvantageKillsPct: 0,
    ctManDisadvantageDeaths: 0,
    ctManDisadvantageDeathsPct: 0,
    ctRating: 0,
    ctEcoRating: 0,
    clutch1v2Attempts: 0,
    clutch1v2Wins: 0,
    clutch1v3Attempts: 0,
    clutch1v3Wins: 0,
    clutch1v4Attempts: 0,
    clutch1v4Wins: 0,
    clutch1v5Attempts: 0,
    clutch1v5Wins: 0,
    smokesThrown: 0,
    hesThrown: 0,
    molotovsThrown: 0,
    totalNadesThrown: 0,
    heDamage: 0,
    fireDamage: 0,
    damageTaken: 0,
    avgTimeToDeath: 0,
    tOpeningKills: 0,
    tOpeningDeaths: 0,
    ctOpeningKills: 0,
    ctOpeningDeaths: 0,
    enemiesFlashed: 0,
    // Per-map ratings — not exposed by the new API yet. Defaulted to 0 so the
    // existing PlayerStats shape stays satisfied; the modal/archetype layers
    // tolerate zeros here.
    ancientRating: 0,
    ancientGames: 0,
    anubisRating: 0,
    anubisGames: 0,
    dust2Rating: 0,
    dust2Games: 0,
    infernoRating: 0,
    infernoGames: 0,
    mirageRating: 0,
    mirageGames: 0,
    nukeRating: 0,
    nukeGames: 0,
    overpassRating: 0,
    overpassGames: 0,
  };
}

/**
 * Aggregates a player's per-match docs into one PlayerStats row matching the
 * shape the rest of the app expects.
 */
function aggregate(steamId: string, docs: ApiDoc[]): PlayerStats {
  const out = emptyStats();
  out.steamId = steamId;
  out.games = docs.length;

  // Player name: pick the most recent doc's name (docs come back insertion-ordered).
  const lastNamed = [...docs].reverse().find((d) => typeof d.name === 'string' && d.name);
  out.name = (lastNamed?.name as string) ?? '';

  const totalRounds = docs.reduce((s, d) => s + num(d.rounds_played), 0);

  // Sum fields.
  for (const [snake, camel] of Object.entries(SUM_FIELDS)) {
    let sum = 0;
    for (const d of docs) sum += num(d[snake]);
    (out as unknown as Record<string, number>)[camel as string] = sum;
  }

  // multi_kills sub-doc → top-level oneK..fiveK counters.
  for (const d of docs) {
    const mk = d.multi_kills ?? {};
    out.oneK += num(mk['1k']);
    out.twoK += num(mk['2k']);
    out.threeK += num(mk['3k']);
    out.fourK += num(mk['4k']);
    out.fiveK += num(mk['5k']);
  }

  // Rate fields — weighted average by rounds_played per match.
  if (totalRounds > 0) {
    for (const [snake, camel] of Object.entries(RATE_FIELDS)) {
      let weighted = 0;
      for (const d of docs) {
        weighted += num(d[snake]) * num(d.rounds_played);
      }
      (out as unknown as Record<string, number>)[camel as string] = weighted / totalRounds;
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchPlayerStats(): Promise<GroupedPlayer[]> {
  const [docs, cscPlayers] = await Promise.all([
    fetchAllStatsDocs(),
    fetchAllPlayers().catch(() => [] as CscPlayer[]),
  ]);

  // Build maps of CSC player metadata. Prefer steam64Id matching (exact);
  // fall back to lowercase-name matching so players whose steam ID isn't
  // populated in CSC core still pick up a tier.
  const cscBySteam = new Map<string, CscPlayer>();
  const cscByName = new Map<string, CscPlayer>();
  for (const p of cscPlayers) {
    if (p.steam64Id) cscBySteam.set(p.steam64Id, p);
    if (p.name) cscByName.set(p.name.toLowerCase(), p);
  }

  // Group docs by steam_id.
  const grouped = new Map<string, ApiDoc[]>();
  for (const d of docs) {
    if (!d.steam_id) continue;
    let list = grouped.get(d.steam_id);
    if (!list) {
      list = [];
      grouped.set(d.steam_id, list);
    }
    list.push(d);
  }

  const players: GroupedPlayer[] = [];
  for (const [steamId, playerDocs] of grouped) {
    const stats = aggregate(steamId, playerDocs);

    const csc =
      cscBySteam.get(steamId) ??
      (stats.name ? cscByName.get(stats.name.toLowerCase()) : undefined);

    const cscTier = csc?.tier?.name ?? null;
    const cscPlayerType = csc?.type ?? null;

    // The legacy `stats.tier` field was a string label shown next to the
    // player's name. Use the CSC tier when available; otherwise fall back to
    // the team_name from the most recent match so the badge still says
    // something useful.
    const lastTeam = [...playerDocs].reverse().find((d) => d.team_name)?.team_name ?? '';
    stats.tier = cscTier ?? lastTeam;

    players.push({
      steamId,
      name: stats.name,
      cscTier,
      cscPlayerType,
      regulation: [{ stats, tier: stats.tier }],
      scrim: [], // API does not currently distinguish scrim/combine matches.
    });
  }

  return players;
}
