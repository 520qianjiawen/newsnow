interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        symbol: string
        regularMarketPrice: number
        previousClose: number
        chartPreviousClose?: number
        regularMarketChangePercent: number
      }
    }[]
  }
}

async function fetchYahoo(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
    const res: YahooChartResponse = await myFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    const meta = res.chart.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice
    const prev = meta.previousClose || meta.chartPreviousClose || 0
    const change = meta.regularMarketChangePercent || (prev ? ((price - prev) / prev) * 100 : 0)

    return {
      price: price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
      isUp: change > 0,
    }
  } catch (e) {
    console.error(`Yahoo Finance fetch failed for ${symbol}:`, e)
    return null
  }
}

async function indices() {
  const symbols = [
    { id: "sp500", sym: "^GSPC", name: "S&P 500" },
    { id: "nasdaq", sym: "^IXIC", name: "Nasdaq" },
    { id: "dow", sym: "^DJI", name: "Dow Jones" },
  ]
  const results = await Promise.all(symbols.map(async (s) => {
    const data = await fetchYahoo(s.sym)
    if (!data) return null
    return {
      id: s.id,
      title: s.name,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(s.sym)}`,
      extra: {
        info: data.price,
        prefix: data.change,
      },
    }
  }))
  const filtered = results.filter(Boolean)
  return filtered.length > 0 ? filtered : null
}

async function commodities() {
  const symbols = [
    { id: "gold", sym: "GC=F", name: "黄金 (Gold)" },
    { id: "oil", sym: "CL=F", name: "原油 (WTI)" },
    { id: "copper", sym: "HG=F", name: "铜 (Copper)" },
  ]
  const results = await Promise.all(symbols.map(async (s) => {
    const data = await fetchYahoo(s.sym)
    if (!data) return null
    return {
      id: s.id,
      title: s.name,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(s.sym)}`,
      extra: {
        info: data.price,
        prefix: data.change,
      },
    }
  }))
  const filtered = results.filter(Boolean)
  return filtered.length > 0 ? filtered : null
}

export default defineSource({
  "finance-indices": indices,
  "finance-commodities": commodities,
})
