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
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
  const res: YahooChartResponse = await myFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  const meta = res.chart.result?.[0]?.meta
  if (!meta) return null

  const price = meta.regularMarketPrice
  const change = meta.regularMarketChangePercent || ((price - meta.previousClose) / meta.previousClose) * 100

  return {
    price: price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    change: `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
    isUp: change > 0,
  }
}

export default defineSource({
  indices: async () => {
    const symbols = [
      { id: "sp500", sym: "%5EGSPC", name: "S&P 500" },
      { id: "nasdaq", sym: "%5EIXIC", name: "Nasdaq" },
      { id: "dow", sym: "%5EDJI", name: "Dow Jones" },
    ]
    const results = await Promise.all(symbols.map(async (s) => {
      const data = await fetchYahoo(s.sym)
      if (!data) return null
      return {
        id: s.id,
        title: s.name,
        url: `https://finance.yahoo.com/quote/${s.sym}`,
        extra: {
          info: data.price,
          prefix: data.change,
        },
      }
    }))
    return results.filter(Boolean) as any
  },
  commodities: async () => {
    const symbols = [
      { id: "gold", sym: "GC%3DF", name: "黄金 (Gold)" },
      { id: "oil", sym: "CL%3DF", name: "原油 (WTI)" },
      { id: "copper", sym: "HG%3DF", name: "铜 (Copper)" },
    ]
    const results = await Promise.all(symbols.map(async (s) => {
      const data = await fetchYahoo(s.sym)
      if (!data) return null
      return {
        id: s.id,
        title: s.name,
        url: `https://finance.yahoo.com/quote/${s.sym}`,
        extra: {
          info: data.price,
          prefix: data.change,
        },
      }
    }))
    return results.filter(Boolean) as any
  },
})
