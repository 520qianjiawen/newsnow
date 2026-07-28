import process from "node:process"
import type { NewsItem } from "@shared/types"

type LongbridgeModule = Record<string, any>
type RankRecord = Record<string, any>

async function importLongbridge() {
  try {
    const moduleName = "longbridge"
    return await import(moduleName) as LongbridgeModule
  } catch {
    throw new Error("Longbridge SDK is not installed. Run `pnpm add longbridge` before enabling this source.")
  }
}

function createConfig(sdk: LongbridgeModule) {
  const Config = sdk.Config
  if (!Config) throw new Error("Longbridge SDK does not export Config")

  if (typeof Config.fromEnv === "function") return Config.fromEnv()
  if (typeof Config.fromApikeyEnv === "function") return Config.fromApikeyEnv()
  if (typeof Config.fromApiKeyEnv === "function") return Config.fromApiKeyEnv()

  throw new Error("Longbridge SDK does not provide an environment config factory")
}

async function createMarketContext(sdk: LongbridgeModule, config: any) {
  const MarketContext = sdk.MarketContext
  if (!MarketContext) throw new Error("Longbridge SDK does not export MarketContext")

  if (typeof MarketContext.new === "function") return await MarketContext.new(config)
  if (typeof MarketContext.create === "function") return await MarketContext.create(config)

  return new MarketContext(config)
}

function rankListFrom(raw: any): RankRecord[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.lists)) return raw.lists
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

function numberFrom(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value !== "string" && typeof value !== "object") return 0
  const text = String(value ?? "")
  const n = Number(text.replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  })
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
}

function textFrom(item: RankRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (value !== undefined && value !== null && String(value)) return String(value)
  }
  return ""
}

function getRankLimit() {
  const limit = Number(process.env.LONGBRIDGE_RANK_LIMIT || 30)
  if (!Number.isFinite(limit)) return 30
  return Math.max(1, Math.min(50, Math.trunc(limit)))
}

async function usStocks() {
  const sdk = await importLongbridge()
  const context = await createMarketContext(sdk, createConfig(sdk))
  const rankKey = process.env.LONGBRIDGE_RANK_KEY || "hot_all-us"
  const rawRanks = await context.rankList(rankKey, false)
  const items = rankListFrom(rawRanks).slice(0, getRankLimit()).map((item, index): NewsItem | null => {
    const symbol = textFrom(item, "symbol")
    if (!symbol) return null

    const code = textFrom(item, "code") || symbol.replace(".US", "")
    const name = textFrom(item, "name") || code
    const industry = textFrom(item, "industry")
    const article = item.article?.title ? String(item.article.title) : ""
    const price = numberFrom(item.lastDone ?? item.last_done)
    const chg = numberFrom(item.chg)

    return {
      id: `longbridge-us-rank-${symbol}`,
      title: `${index + 1}. ${name} (${code})`,
      url: `https://longbridge.com/quote/${symbol}`,
      extra: {
        hover: article || industry || undefined,
        info: `${price ? `$${formatPrice(price)}` : ""}${industry ? ` · ${industry}` : ""}`,
        prefix: formatPercent(chg),
      },
    }
  }).filter((item): item is NewsItem => Boolean(item))

  if (!items.length) throw new Error("Cannot fetch Longbridge US rank list")
  return items
}

export default defineSource({
  "longbridge-us": usStocks,
})
