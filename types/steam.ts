// Steam Inventory Types

// Asset represents an item instance in a user's inventory
export interface SteamAsset {
    assetid: string // Unique identifier for this specific item instance
    classid: string // Identifier for the item class/type
    instanceid: string // Instance identifier (usually "0" for most items)
    amount: string // Quantity (usually "1" for most items)
    pos?: number // Position in inventory (optional)
  }
  
  // Description contains the details about an item class
  export interface SteamItemDescription {
    classid: string // Matches with asset's classid
    instanceid?: string // Making this optional in SteamItemDescription to resolve the conflict
    name: string // Item name (e.g., "AK-47 | Asiimov")
    market_name?: string // Full market name
    market_hash_name?: string // Hash name used in market URLs
    name_color?: string // Hex color code for the item name (without #)
    background_color?: string // Hex color code for background (without #)
    type: string // Item type (e.g., "Rifle", "Knife", "Gloves")
    descriptions?: Array<{
      // Array of description texts
      type: string
      value: string
      color?: string
    }>
    icon_url: string // URL path to the item icon (needs to be prefixed)
    icon_url_large?: string // URL path to the large icon
    tradable: number // 1 if tradable, 0 if not
    marketable?: number // 1 if marketable, 0 if not
    commodity?: number // 1 if commodity, 0 if not
    market_tradable_restriction?: number // Trade restriction in days
    market_marketable_restriction?: number // Market restriction in days
    fraudwarnings?: string[] // Fraud warnings if any
    tags?: Array<{
      // Tags for categorization
      category: string
      internal_name: string
      localized_category_name: string
      localized_tag_name: string
      color?: string
    }>
  }
  
  // Instead of extending both interfaces directly, create a merged interface
  export interface SteamInventoryItem {
    // Include all properties from SteamAsset
    assetid: string
    classid: string
    instanceid: string // Use the required version from SteamAsset
    amount: string
    pos?: number
  
    // Include all properties from SteamItemDescription except instanceid (already included above)
    name: string
    market_name?: string
    market_hash_name?: string
    name_color?: string
    background_color?: string
    type: string
    descriptions?: Array<{
      type: string
      value: string
      color?: string
    }>
    icon_url: string
    icon_url_large?: string
    tradable: number
    marketable?: number
    commodity?: number
    market_tradable_restriction?: number
    market_marketable_restriction?: number
    fraudwarnings?: string[]
    tags?: Array<{
      category: string
      internal_name: string
      localized_category_name: string
      localized_tag_name: string
      color?: string
    }>
  
    // Additional properties specific to the combined item
      selected?: boolean // UI state for selection
    appid?: number
  }
  
  // Complete inventory response from API
  export interface SteamInventoryResponse {
    assets: SteamAsset[]
    descriptions: SteamItemDescription[]
    total_inventory_count?: number
    success?: number
    rwgrsn?: number
    error?: string
  }
  
  // Trade offer request
  export interface TradeOfferRequest {
    item: SteamInventoryItem[]
    userTradeUrl: string
  }
  
  // Trade offer response
  export interface TradeOfferResponse {
    success: boolean
    tradeOfferId?: string
    message?: string
    error?: string
  }
  
  // User data
  export interface SteamUser {
    id: string
    name?: string
    avatar?: string
    profileUrl?: string
  }
  
  // Auth response
  export interface AuthResponse {
    user: SteamUser | Record<string, never>
  }
  