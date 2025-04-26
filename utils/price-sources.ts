// Define the supported price sources
export type PriceSource =
  | "steam"
  | "buff163"
  | "skinport"
  | "csgofloat"
  | "dmarket"
  | "skinbaron"
  | "csgoempire"
  | "lootfarm"
  | "tradeit"

// Define supported games
export type GameType = "cs2" | "dota2"

// Interface for price data from any source
export interface ExternalPriceData {
  source: PriceSource
  price: number | null // Price in USD
  url?: string // URL to the item listing
  lastUpdated: number // Timestamp
  available?: number // Number of items available (if applicable)
  error?: string // Error message if fetch failed
  gameType: GameType // The game this price is for
}

// Combined price data with aggregated information
export interface AggregatedPriceData {
  sources: ExternalPriceData[]
  lowestPrice: number | null
  lowestSource: PriceSource | null
  averagePrice: number | null
  medianPrice: number | null
  steamPrice: number | null
  lastUpdated: number
  gameType: GameType
}

// Configuration for price sources with game support
export const PRICE_SOURCES: Record<
  PriceSource,
  { name: string; color: string; enabled: boolean; supportedGames: GameType[] }
> = {
  steam: {
    name: "Steam Market",
    color: "#171a21",
    enabled: true,
    supportedGames: ["cs2", "dota2"],
  },
  buff163: {
    name: "BUFF 163",
    color: "#f04337",
    enabled: true,
    supportedGames: ["cs2", "dota2"],
  },
  skinport: {
    name: "Skinport",
    color: "#ff5500",
    enabled: true,
    supportedGames: ["cs2"],
  },
  csgofloat: {
    name: "CSGOFloat",
    color: "#3498db",
    enabled: true,
    supportedGames: ["cs2"],
  },
  dmarket: {
    name: "DMarket",
    color: "#682cca",
    enabled: true,
    supportedGames: ["cs2", "dota2"],
  },
  skinbaron: {
    name: "Skinbaron",
    color: "#f8ac1c",
    enabled: true,
    supportedGames: ["cs2"],
  },
  csgoempire: {
    name: "CSGOEmpire",
    color: "#f0c419",
    enabled: true,
    supportedGames: ["cs2"],
  },
  lootfarm: {
    name: "Loot.farm",
    color: "#4caf50",
    enabled: true,
    supportedGames: ["cs2", "dota2"],
  },
  tradeit: {
    name: "Tradeit.gg",
    color: "#2196f3",
    enabled: true,
    supportedGames: ["cs2", "dota2"],
  },
}

// Helper function to get source display name
export function getSourceDisplayName(source: PriceSource): string {
  return PRICE_SOURCES[source]?.name || source
}

// Helper function to get source color
export function getSourceColor(source: PriceSource): string {
  return PRICE_SOURCES[source]?.color || "#888888"
}

// Helper function to get sources that support a specific game
export function getSourcesForGame(gameType: GameType): PriceSource[] {
  return Object.entries(PRICE_SOURCES)
    .filter(([_, config]) => config.enabled && config.supportedGames.includes(gameType))
    .map(([source]) => source as PriceSource)
}

// Helper function to convert appid to GameType
export function appidToGameType(appid: string | number): GameType {
  const appidNum = typeof appid === "string" ? Number.parseInt(appid, 10) : appid
  return appidNum === 570 ? "dota2" : "cs2" // Default to CS2 for any other appid
}

// Helper function to convert GameType to appid
export function gameTypeToAppid(gameType: GameType): number {
  return gameType === "dota2" ? 570 : 730 // CS2 appid is 730
}

// Helper function to get game name for display
export function getGameDisplayName(gameType: GameType): string {
  return gameType === "dota2" ? "Dota 2" : "CS2"
}
