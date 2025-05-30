"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Head from "next/head"
import Link from "next/link"
import {
  RefreshCw,
  Send,
  LogIn,
  Search,
  X,
  Link2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Settings,
  Gamepad2,
} from "lucide-react"
import type { SteamInventoryItem, SteamInventoryResponse, AuthResponse } from "../types/steam"
import { ItemCard } from "../components/item-card"
import { formatMnt } from "../utils/currency"
import { type GameType, getGameDisplayName, PRICE_SOURCES, type PriceSource } from "../utils/price-sources"

export default function Trade() {
  const [steamId, setSteamId] = useState<string | null>(null)
  const [items, setItems] = useState<SteamInventoryItem[]>([])
  const [game, setGame] = useState<GameType>("cs2")
  const [selectedItems, setSelectedItems] = useState<SteamInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isTrading, setIsTrading] = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [tradeResult, setTradeResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showTroubleshooting, setShowTroubleshooting] = useState<boolean>(false)
  const [tradeUrl, setTradeUrl] = useState<string>("")
  const [tradeUrlError, setTradeUrlError] = useState<string | null>(null)
  const [showTradeUrlHelp, setShowTradeUrlHelp] = useState<boolean>(false)
  const [showPriceSettings, setShowPriceSettings] = useState<boolean>(false)
  const [enabledSources, setEnabledSources] = useState<Record<PriceSource, boolean>>(() => {
    // Initialize with all sources enabled
    const initialState: Record<PriceSource, boolean> = {} as Record<PriceSource, boolean>
    Object.keys(PRICE_SOURCES).forEach((source) => {
      initialState[source as PriceSource] = true
    })
    return initialState
  })

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data: AuthResponse) => {
        if (data.user && data.user.id) {
          setSteamId(data.user.id)
          setIsLoggedIn(true)
          // Automatically fetch CS2 inventory when logged in
          fetchInventory("cs2")
        }
      })
      .catch((error) => {
        console.error("Failed to check auth status:", error)
      })

    // Load saved trade URL from localStorage if available
    const savedTradeUrl = localStorage.getItem("steamTradeUrl")
    if (savedTradeUrl) {
      setTradeUrl(savedTradeUrl)
      validateTradeUrl(savedTradeUrl)
    }

    // Load saved price source settings from localStorage if available
    const savedPriceSettings = localStorage.getItem("priceSourceSettings")
    if (savedPriceSettings) {
      try {
        const parsedSettings = JSON.parse(savedPriceSettings)
        setEnabledSources(parsedSettings)
      } catch (error) {
        console.error("Failed to parse saved price settings:", error)
      }
    }
  }, [])

  const handleSteamLogin = () => {
    // Redirect to Steam login
    window.location.href = "/api/auth/steam"
  }

  const fetchInventory = async (selectedGame?: GameType) => {
    if (!steamId) return

    // If a game is provided, update the state
    if (selectedGame) {
      setGame(selectedGame)
    }

    // Use either the provided game or the current state
    const gameToFetch = selectedGame || game

    setIsLoading(true)
    setTradeResult(null)
    try {
      const response = await fetch(`/api/inventory?steamId=${steamId}&game=${gameToFetch}`)
      const data: SteamInventoryResponse = await response.json()
      if (data && data.assets) {
        const tradableItems = data.assets
          .map((asset) => {
            const description = data.descriptions.find((desc) => desc.classid === asset.classid)
            if (!description) return null

            // Create a merged item with properties from both asset and description
            const mergedItem: SteamInventoryItem = {
              // Properties from asset
              assetid: asset.assetid,
              classid: asset.classid,
              instanceid: asset.instanceid,
              amount: asset.amount,
              pos: asset.pos,

              // Properties from description
              name: description.name,
              market_name: description.market_name || description.name,
              market_hash_name: description.market_hash_name || description.name,
              name_color: description.name_color,
              background_color: description.background_color,
              type: description.type,
              descriptions: description.descriptions,
              icon_url: description.icon_url,
              icon_url_large: description.icon_url_large,
              tradable: description.tradable,
              marketable: description.marketable,
              commodity: description.commodity,
              market_tradable_restriction: description.market_tradable_restriction,
              market_marketable_restriction: description.market_marketable_restriction,
              fraudwarnings: description.fraudwarnings,
              tags: description.tags,

              // Add appid based on game
              appid: gameToFetch === "dota2" ? 570 : 730,
            }

            return mergedItem
          })
          .filter((item): item is SteamInventoryItem => item !== null && item.tradable === 1)

        setItems(tradableItems)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelectItem = (item: SteamInventoryItem) => {
    setSelectedItems((prevSelected) => {
      const newSelectedItems = prevSelected.some((i) => i.assetid === item.assetid)
        ? prevSelected.filter((i) => i.assetid !== item.assetid)
        : [...prevSelected, item]
      return newSelectedItems
    })
  }

  const validateTradeUrl = (url: string): boolean => {
    // Basic validation for Steam trade URL format
    const tradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/

    if (!url.trim()) {
      setTradeUrlError("Trade URL is required")
      return false
    }

    if (!tradeUrlRegex.test(url)) {
      setTradeUrlError("Invalid trade URL format. Please enter a valid Steam trade URL.")
      return false
    }

    setTradeUrlError(null)
    return true
  }

  const handleTradeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setTradeUrl(newUrl)

    // Don't show error while typing, only validate on blur
    if (tradeUrlError) {
      validateTradeUrl(newUrl)
    }
  }

  const handleTradeUrlBlur = () => {
    if (validateTradeUrl(tradeUrl)) {
      // Save valid trade URL to localStorage
      localStorage.setItem("steamTradeUrl", tradeUrl)
    }
  }

  const handleSourceToggle = (source: PriceSource) => {
    setEnabledSources((prev) => {
      const updated = { ...prev, [source]: !prev[source] }
      // Save to localStorage
      localStorage.setItem("priceSourceSettings", JSON.stringify(updated))
      return updated
    })
  }

  const sendTrade = async () => {
    if (selectedItems.length === 0) {
      setTradeResult({ success: false, message: "Please select at least one item." })
      return
    }

    if (!validateTradeUrl(tradeUrl)) {
      setTradeResult({ success: false, message: "Please enter a valid Steam trade URL." })
      return
    }

    setIsTrading(true)
    setTradeResult(null)

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: selectedItems,
          userTradeUrl: tradeUrl,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTradeResult({
          success: true,
          message: `Trade offer sent successfully! ${data.itemCount} item(s) included in the trade.`,
        })
        setSelectedItems([]) // Clear selection after successful trade
      } else {
        setTradeResult({
          success: false,
          message: data.error || "Failed to send trade offer. Please try again.",
        })
      }
    } catch (error) {
      console.error("Trade Error:", error)
      setTradeResult({ success: false, message: "Network error. Please try again." })
    } finally {
      setIsTrading(false)
    }
  }

  // Filter items based on search term
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate total value of selected items
  const calculateTotalValue = useCallback(() => {
    // This is a placeholder - in a real implementation, you would use the actual price data
    // from your price aggregation system
    const totalMnt = 0
    // Implementation would depend on how you're storing price data
    return formatMnt(totalMnt)
  }, [selectedItems])

  return (
    <>
      <Head>
        <title>Trade Inventory | Tengri-Skins</title>
        <meta name="description" content="Trade your CS:GO and Dota 2 items on Tengri-Skins" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black to-red-950">
        {/* Header */}
        <header className="bg-black/80 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-bold text-xl">
                <span className="text-yellow-500">TENGRI</span>-SKINS
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/" className="hover:text-yellow-500">
                  HOME
                </Link>
                <Link href="/trade" className="text-yellow-500">
                  TRADE
                </Link>
                <Link href="#" className="hover:text-yellow-500">
                  MARKETPLACE
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-yellow-500 text-black px-4 py-2 rounded font-medium">SIGN UP</button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                <span className="text-yellow-500">Steam</span> Inventory Trade
              </h1>
              <p className="text-gray-300">
                Trade your CS:GO and Dota 2 items securely on Tengri-Skins. Select the items you want to trade and send
                them directly to our bots.
              </p>
            </div>

            {!isLoggedIn ? (
              <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Login with Steam to Access Your Inventory</h2>
                <p className="text-gray-300 mb-8">
                  You need to connect your Steam account to view and trade your inventory items.
                </p>
                <button
                  onClick={handleSteamLogin}
                  className="bg-[#1b2838] hover:bg-[#2a3f5a] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <LogIn className="w-5 h-5" />
                  Login with Steam
                </button>
              </div>
            ) : (
              <>
                {/* Trade URL Input */}
                <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Your Steam Trade URL</h2>
                    <button
                      onClick={() => setShowTradeUrlHelp(!showTradeUrlHelp)}
                      className="text-gray-400 hover:text-yellow-500 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {showTradeUrlHelp ? "Hide Help" : "How to find your Trade URL"}
                    </button>
                  </div>

                  {showTradeUrlHelp && (
                    <div className="bg-gray-800/50 rounded p-4 mb-4 text-gray-300 text-sm">
                      <h3 className="font-bold text-yellow-500 mb-2">How to find your Steam Trade URL:</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Log in to your Steam account</li>
                        <li>Click on your profile name in the top-right corner</li>
                        <li>Select "Inventory" from the dropdown menu</li>
                        <li>Click on "Trade Offers" in the top-right of your inventory page</li>
                        <li>Click on "Who can send me Trade Offers?"</li>
                        <li>Under "Third-Party Sites", you'll find your Trade URL</li>
                        <li>Click "Copy" and paste it here</li>
                      </ol>
                      <div className="mt-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-yellow-500" />
                        <a
                          href="https://steamcommunity.com/my/tradeoffers/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-500 hover:underline"
                        >
                          Open Steam Trade Offers Settings
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="https://steamcommunity.com/tradeoffer/new/?partner=XXXXXXXXX&token=XXXXXXXX"
                      value={tradeUrl}
                      onChange={handleTradeUrlChange}
                      onBlur={handleTradeUrlBlur}
                      className={`w-full bg-gray-800 border rounded px-10 py-2 text-white focus:outline-none focus:ring-2 ${
                        tradeUrlError
                          ? "border-red-500 focus:ring-red-500"
                          : tradeUrl
                            ? "border-green-500 focus:ring-green-500"
                            : "border-gray-700 focus:ring-yellow-500"
                      }`}
                    />
                    {tradeUrl && !tradeUrlError && (
                      <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                    )}
                  </div>

                  {tradeUrlError && (
                    <p className="mt-2 text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {tradeUrlError}
                    </p>
                  )}

                  <p className="mt-2 text-gray-400 text-sm">
                    Your trade URL is required to send items. We'll save it for future trades.
                  </p>
                </div>

                {/* Game Selection and Controls */}
                <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-6 mb-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-white">Game Selection:</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchInventory("cs2")}
                          className={`px-4 py-2 rounded flex items-center gap-2 ${game === "cs2" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white hover:bg-gray-700"}`}
                        >
                          {game === "cs2" && isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Gamepad2 className="w-4 h-4" />
                          )}
                          CS2
                        </button>
                        <button
                          onClick={() => fetchInventory("dota2")}
                          className={`px-4 py-2 rounded flex items-center gap-2 ${game === "dota2" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white hover:bg-gray-700"}`}
                        >
                          {game === "dota2" && isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Gamepad2 className="w-4 h-4" />
                          )}
                          Dota 2
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPriceSettings(!showPriceSettings)}
                        className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Price Settings
                      </button>
                      <button
                        onClick={sendTrade}
                        disabled={selectedItems.length === 0 || isTrading || !!tradeUrlError || !tradeUrl}
                        className={`px-4 py-2 rounded flex items-center gap-2 ${
                          selectedItems.length === 0 || isTrading || !!tradeUrlError || !tradeUrl
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-yellow-500 hover:bg-yellow-400 text-black"
                        }`}
                      >
                        {isTrading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Trade ({selectedItems.length})
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Price Settings Panel */}
                  {showPriceSettings && (
                    <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-yellow-500" />
                        Price Source Settings
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        We aggregate prices from multiple sources to show you the best deals. You can customize which
                        sources to use below.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(PRICE_SOURCES).map(([key, config]) => (
                          <div key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`source-${key}`}
                              checked={enabledSources[key as PriceSource]}
                              onChange={() => handleSourceToggle(key as PriceSource)}
                              className="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                            />
                            <label
                              htmlFor={`source-${key}`}
                              className="text-sm flex items-center gap-1"
                              style={{ color: config.color }}
                            >
                              {config.name}
                              {!config.supportedGames.includes(game) && (
                                <span className="text-gray-500 text-xs">(Not for {getGameDisplayName(game)})</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm"
                          onClick={() => setShowPriceSettings(false)}
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search bar - always visible */}
                  <div className="mt-4 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search items by name or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected items summary */}
                  {selectedItems.length > 0 && (
                    <div className="mt-2 mb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-800/50 rounded p-3">
                        <div>
                          <span className="text-white">Selected: </span>
                          <span className="text-yellow-500 font-bold">{selectedItems.length} items</span>
                          <span className="text-white mx-2">|</span>
                          <span className="text-white">Total value: </span>
                          <span className="text-green-500 font-bold">{calculateTotalValue()}</span>
                        </div>
                        <button
                          onClick={() => setSelectedItems([])}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                        >
                          <X className="w-4 h-4" />
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Trade result message */}
                  {tradeResult && (
                    <div
                      className={`mt-4 p-3 rounded ${
                        tradeResult.success
                          ? "bg-green-900/30 border border-green-700/30 text-green-300"
                          : "bg-red-900/30 border border-red-700/30 text-red-300"
                      }`}
                    >
                      {tradeResult.message}
                    </div>
                  )}
                  {tradeResult && !tradeResult.success && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                        className="text-yellow-500 hover:text-yellow-400 text-sm flex items-center gap-1"
                      >
                        <HelpCircle className="w-4 h-4" />
                        {showTroubleshooting ? "Hide troubleshooting tips" : "Show troubleshooting tips"}
                      </button>

                      {showTroubleshooting && (
                        <div className="mt-2 bg-gray-800/50 rounded p-4 text-gray-300 text-sm">
                          <h3 className="font-bold text-yellow-500 mb-2">Troubleshooting Tips:</h3>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Make sure your trade URL is correct and up-to-date</li>
                            <li>Check if you have any trade holds or restrictions on your account</li>
                            <li>Verify that the bot is properly authenticated (admin may need to re-authenticate)</li>
                            <li>Ensure your inventory is public and items are tradable</li>
                            <li>Try refreshing your inventory before trading</li>
                            <li>If the error persists, try again later or contact support</li>
                          </ul>

                          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/30 rounded">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <p>
                                <span className="font-bold text-yellow-500">Note:</span> Steam has various security
                                measures that can temporarily prevent trades. These include new devices, recent password
                                changes, or Steam Guard settings.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inventory Grid with Loading State */}
                {isLoading ? (
                  <div className="bg-gray-900/50 rounded-lg p-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-500" />
                    <p className="text-gray-300">Loading your {getGameDisplayName(game)} inventory...</p>
                    <p className="text-gray-400 text-sm mt-2">
                      This may take a moment depending on the size of your inventory.
                    </p>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.assetid}
                        item={item}
                        isSelected={selectedItems.some((i) => i.assetid === item.assetid)}
                        onSelect={() => toggleSelectItem(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900/50 rounded-lg p-12 text-center">
                    <p className="text-gray-300 mb-4">
                      {items.length > 0
                        ? "No items match your search. Try a different search term."
                        : "No items found in your inventory."}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {items.length > 0
                        ? "Try searching for a different item name or type."
                        : "Your inventory may be private or you may not have any tradable items."}
                    </p>
                    <button
                      onClick={() => fetchInventory()}
                      className="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Inventory
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-red-950 to-black text-white py-12 px-4 mt-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-xl mb-4">
                  <span className="text-yellow-500">TENGRI</span>-SKINS
                </h3>
                <p className="text-gray-400 mb-4">
                  The premier marketplace for CS:GO and Dota 2 items with over 100,000 items and the best prices.
                </p>
                <div className="flex gap-4">
                  {["facebook", "twitter", "instagram", "discord"].map((social) => (
                    <a key={social} href="#" className="text-gray-400 hover:text-white">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="sr-only">{social}</span>
                        <div className="w-4 h-4"></div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">Marketplace</h3>
                <ul className="space-y-2">
                  {["All Items", "CS2 Items", "Dota 2 Items", "Special Offers"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-400 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Help & Support</h3>
                <ul className="space-y-2">
                  {["FAQ", "Contact Us", "Terms of Service", "Privacy Policy"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-400 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>© 2025 Tengri-Skins | All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
