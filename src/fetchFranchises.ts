const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: {
  franchises: CacheEntry<Franchise[]> | null;
  players: CacheEntry<CscPlayer[]> | null;
} = {
  franchises: null,
  players: null,
};

export interface FranchisePlayer {
  id: string;
  name: string;
  discordId: string;
  steam64Id: string;
  mmr: number;
}

export interface FranchiseTeam {
  id: string;
  name: string;
  captain: { steam64Id: string } | null;
  tier: {
    name: string;
    mmrCap: number;
  };
  players: FranchisePlayer[];
}

export interface Franchise {
  name: string;
  prefix: string;
  logo: { name: string } | null;
  gm: { name: string } | null;
  agms: { name: string }[] | null;
  teams: FranchiseTeam[];
}

export interface CscPlayer {
  id: string;
  steam64Id: string;
  name: string;
  discordId: string;
  faceitName: string | null;
  mmr: number;
  avatarUrl: string | null;
  contractDuration: number;
  tier: { name: string } | null;
  team: {
    name: string;
    franchise: {
      name: string;
      prefix: string;
    };
  } | null;
  type: PlayerType;
}

export type PlayerType =
  | 'SIGNED'
  | 'FREE_AGENT'
  | 'DRAFT_ELIGIBLE'
  | 'PERMANENT_FREE_AGENT'
  | 'SPECTATOR'
  | 'INACTIVE_RESERVE'
  | 'SIGNED_SUBBED'
  | 'TEMPSIGNED'
  | 'PERMFA_TEMP_SIGNED'
  | 'UNROSTERED_GM'
  | 'UNROSTERED_AGM'
  | 'INACTIVE'
  | 'SIGNED_PROMOTED'
  | 'EXPIRED';

const CSC_GRAPHQL_ENDPOINT = 'https://core.playcsc.com/graphql';

function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

export async function fetchFranchises(): Promise<Franchise[]> {
  // Return cached data if valid
  if (isCacheValid(cache.franchises)) {
    return cache.franchises.data;
  }
  const response = await fetch(CSC_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName: 'franchises',
      query: `query franchises {
        franchises(active: true) {
          name
          prefix
          logo {
            name
          }
          gm {
            name
          }
          agms {
            name
          }
          teams {
            id
            name
            captain {
              steam64Id
            }
            tier {
              name
              mmrCap
            }
            players {
              id
              name
              discordId
              steam64Id
              mmr
            }
          }
        }
      }`,
      variables: {},
    }),
  });

  const json = await response.json();
  const data = json.data?.franchises ?? [];
  
  // Store in cache
  cache.franchises = { data, timestamp: Date.now() };
  
  return data;
}

export async function fetchAllPlayers(): Promise<CscPlayer[]> {
  // Return cached data if valid
  if (isCacheValid(cache.players)) {
    return cache.players.data;
  }
  const response = await fetch(CSC_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query CscPlayers {
        players {
          id
          steam64Id
          name
          discordId
          faceitName
          mmr
          avatarUrl
          contractDuration
          tier {
            name
          }
          team {
            name
            franchise {
              name
              prefix
            }
          }
          type
        }
      }`,
      variables: {},
    }),
  });

  const json = await response.json();
  const data = json.data?.players ?? [];
  
  // Store in cache
  cache.players = { data, timestamp: Date.now() };
  
  return data;
}

export function clearCache(): void {
  cache.franchises = null;
  cache.players = null;
}

export function getPlayerTypeLabel(type: PlayerType): string {
  switch (type) {
    case 'SIGNED':
      return 'Signed';
    case 'SIGNED_PROMOTED':
      return 'Signed (Promoted)';
    case 'FREE_AGENT':
      return 'FA';
    case 'DRAFT_ELIGIBLE':
      return 'DE';
    case 'PERMANENT_FREE_AGENT':
      return 'PFA';
    case 'INACTIVE_RESERVE':
      return 'IR';
    case 'SPECTATOR':
      return 'Spectator';
    case 'SIGNED_SUBBED':
      return 'Subbed';
    case 'TEMPSIGNED':
      return 'Temp';
    case 'PERMFA_TEMP_SIGNED':
      return 'PFA Temp';
    case 'UNROSTERED_GM':
      return 'GM';
    case 'UNROSTERED_AGM':
      return 'AGM';
    case 'INACTIVE':
      return 'Inactive';
    case 'EXPIRED':
      return 'Expired';
    default:
      return type;
  }
}

export function getPlayerTypeColor(type: PlayerType): string {
  switch (type) {
    case 'SIGNED':
    case 'SIGNED_PROMOTED':
      return 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30';
    case 'FREE_AGENT':
      return 'text-neon-blue bg-neon-blue/15 border-neon-blue/30';
    case 'DRAFT_ELIGIBLE':
      return 'text-neon-cyan bg-neon-cyan/15 border-neon-cyan/30';
    case 'PERMANENT_FREE_AGENT':
      return 'text-neon-purple bg-neon-purple/15 border-neon-purple/30';
    case 'INACTIVE_RESERVE':
    case 'INACTIVE':
      return 'text-slate-400 bg-slate-400/15 border-slate-400/30';
    case 'UNROSTERED_GM':
    case 'UNROSTERED_AGM':
      return 'text-yellow-400 bg-yellow-400/15 border-yellow-400/30';
    default:
      return 'text-slate-400 bg-slate-400/15 border-slate-400/30';
  }
}
