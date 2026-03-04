interface YahooChartResponse {
  chart: {
    result: {
      meta: {
        symbol: string
        regularMarketPrice: number
        previousClose: number
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
    const change = meta.regularMarketChangePercent || ((price - (meta.previousClose || meta.chartPreviousClose || 0)) / (meta.previousClose || meta.chartPreviousClose || 1)) * 100

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

export default defineSource({
  indices: async () => {
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
    return (results.filter(Boolean) as any).length > 0 ? results.filter(Boolean) : null
  },
  commodities: async () => {
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
    return (results.filter(Boolean) as any).length > 0 ? results.filter(Boolean) : null
  },
})
