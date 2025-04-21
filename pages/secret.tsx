"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { Shield, RefreshCw, ShieldCheck, AlertTriangle, Lock } from "lucide-react"

export default function Secret() {
  const [steamGuardCode, setSteamGuardCode] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
  const [botStatus, setBotStatus] = useState({ isLoggedIn: false, cooldownRemaining: 0 })
  const [countdown, setCountdown] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check bot status on load and periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/bot/auth")
        const data = await response.json()
        setBotStatus(data)

        if (data.cooldownRemaining > 0) {
          setCountdown(Math.ceil(data.cooldownRemaining / 1000))
        }
      } catch (error) {
        console.error("Failed to check bot status:", error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Countdown timer for cooldown
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault()

    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HINT) {
      setIsAuthenticated(true)
      setAdminPassword("")
    } else {
      setMessage({ text: "Invalid admin password", type: "error" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!steamGuardCode) {
      setMessage({ text: "Steam Guard code is required", type: "error" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/bot/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamGuardCode,
          adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HINT, // This is just a placeholder
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ text: data.message, type: "success" })
        setSteamGuardCode("") // Clear the input
      } else {
        setMessage({ text: data.message, type: "error" })
      }
    } catch (error) {
      setMessage({ text: "Failed to connect to server", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Bot Control | Tengri-Skins</title>
        <meta name="description" content="Secure bot control panel" />
        <meta name="robots" content="noindex, nofollow" />
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
                <Link href="/trade" className="hover:text-yellow-500">
                  TRADE
                </Link>
                <Link href="#" className="hover:text-yellow-500">
                  MARKETPLACE
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-4">
                <span className="text-yellow-500">Bot</span> Control Panel
              </h1>
              <p className="text-gray-300">Secure area for Steam bot authentication</p>
            </div>

            {!isAuthenticated ? (
              <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Admin Authentication</h2>

                {message && (
                  <div
                    className={`mb-4 p-3 rounded ${
                      message.type === "success"
                        ? "bg-green-900/30 border border-green-700/30 text-green-300"
                        : message.type === "error"
                          ? "bg-red-900/30 border border-red-700/30 text-red-300"
                          : "bg-blue-900/30 border border-blue-700/30 text-blue-300"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleAdminAuth}>
                  <div className="mb-4">
                    <label htmlFor="adminPassword" className="block text-gray-300 mb-2">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="password"
                        id="adminPassword"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Enter admin password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded font-medium bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Access Control Panel
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-3 h-3 rounded-full ${botStatus.isLoggedIn ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <h2 className="text-xl font-bold text-white">
                      Bot Status: {botStatus.isLoggedIn ? "Online" : "Offline"}
                    </h2>
                  </div>

                  {botStatus.isLoggedIn ? (
                    <div className="bg-green-900/20 border border-green-700/30 rounded p-4 flex items-center gap-3">
                      <ShieldCheck className="text-green-500 w-6 h-6" />
                      <p className="text-green-300">Bot is currently active and ready to process trades.</p>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-700/30 rounded p-4 flex items-center gap-3">
                      <AlertTriangle className="text-yellow-500 w-6 h-6" />
                      <p className="text-yellow-300">
                        Bot is offline. Please authenticate using your Steam Guard code.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-gray-900 to-red-900/50 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Steam Guard Authentication</h2>

                  {message && (
                    <div
                      className={`mb-4 p-3 rounded ${
                        message.type === "success"
                          ? "bg-green-900/30 border border-green-700/30 text-green-300"
                          : message.type === "error"
                            ? "bg-red-900/30 border border-red-700/30 text-red-300"
                            : "bg-blue-900/30 border border-blue-700/30 text-blue-300"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="steamGuardCode" className="block text-gray-300 mb-2">
                        Steam Guard Code
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          id="steamGuardCode"
                          value={steamGuardCode}
                          onChange={(e) => setSteamGuardCode(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="Enter your Steam Guard code"
                          maxLength={5}
                          disabled={isLoading || countdown > 0}
                        />
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        Enter the 5-digit code from your Steam Mobile Authenticator
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || countdown > 0}
                      className={`w-full py-2 px-4 rounded font-medium flex items-center justify-center gap-2 ${
                        isLoading || countdown > 0
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-400 text-black"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Authenticating...
                        </>
                      ) : countdown > 0 ? (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Cooldown: {countdown}s
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Authenticate Bot
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-red-950 to-black text-white py-8 px-4 mt-12">
          <div className="container mx-auto text-center">
            <p className="text-gray-500 text-sm">© 2025 Tengri-Skins | Secure Area</p>
          </div>
        </footer>
      </div>
    </>
  )
}
