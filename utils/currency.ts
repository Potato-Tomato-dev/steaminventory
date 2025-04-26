// Current exchange rate: 1 USD = approximately 3,500 MNT
// This should be updated regularly in a production environment
export const USD_TO_MNT_RATE = 3500

/**
 * Converts a USD price string (e.g. "$10.50") to MNT numeric value
 */
export function usdToMnt(usdPrice: string | null): number {
  if (!usdPrice) return 0

  // Extract numeric value from price string (e.g., "$10.50" -> 10.50)
  const numericValue = Number.parseFloat(usdPrice.replace(/[^0-9.]/g, ""))

  if (isNaN(numericValue)) return 0

  // Convert to MNT
  return Math.round(numericValue * USD_TO_MNT_RATE)
}

/**
 * Formats a MNT value to a readable string with the currency symbol
 */
export function formatMnt(amount: number): string {
  return `${amount.toLocaleString()}₮`
}

/**
 * Directly converts a USD price string to a formatted MNT string
 */
export function convertAndFormatPrice(usdPrice: string | null): string {
  if (!usdPrice) return "N/A"
  return formatMnt(usdToMnt(usdPrice))
}

/**
 * Formats a USD value to a readable string with the currency symbol
 */
export function formatUsd(amount: number | null): string {
  if (amount === null) return "N/A"
  return `$${amount.toFixed(2)}`
}

/**
 * Converts a numeric USD price to MNT
 */
export function convertUsdToMnt(usdPrice: number | null): number {
  if (usdPrice === null) return 0
  return Math.round(usdPrice * USD_TO_MNT_RATE)
}

/**
 * Formats a price in both USD and MNT
 */
export function formatPriceWithBothCurrencies(usdPrice: number | null): string {
  if (usdPrice === null) return "N/A"
  return `${formatUsd(usdPrice)} (${formatMnt(convertUsdToMnt(usdPrice))})`
}
