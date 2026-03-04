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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Origin": "https://finance.yahoo.com",
        "Referer": "https://finance.yahoo.com/",
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
  } catch {
    // silent fail
    return null
  }
}

async function indices() {
  const symbols = [
    { id: "sse", sym: "000001.SS", name: "上证指数" },
    { id: "hsi", sym: "^HSI", name: "恒生指数" },
    { id: "nasdaq", sym: "^IXIC", name: "纳斯达克指数" },
  ]
  const results = await Promise.all(symbols.map(async (s) => {
    const data = await fetchYahoo(s.sym)
    if (!data) return null
    return {
      id: `finance-indices-${s.id}`,
      title: s.name,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(s.sym)}`,
      extra: {
        info: data.price,
        prefix: data.change,
      },
    }
  }))
  return results.filter(Boolean) as any
}

async function forex() {
  const symbols = [
    { id: "usdcny", sym: "USDCNY=X", name: "美元/人民币" },
    { id: "eurcny", sym: "EURCNY=X", name: "欧元/人民币" },
    { id: "gbpcny", sym: "GBPCNY=X", name: "英镑/人民币" },
  ]
  const results = await Promise.all(symbols.map(async (s) => {
    const data = await fetchYahoo(s.sym)
    if (!data) return null
    return {
      id: `finance-forex-${s.id}`,
      title: s.name,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(s.sym)}`,
      extra: {
        info: data.price,
        prefix: data.change,
      },
    }
  }))
  return results.filter(Boolean) as any
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
      id: `finance-commodities-${s.id}`,
      title: s.name,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(s.sym)}`,
      extra: {
        info: data.price,
        prefix: data.change,
      },
    }
  }))
  return (results.filter(Boolean) as any) || []
}

export default defineSource({
  "finance-indices": indices,
  "finance-forex": forex,
  "finance-commodities": commodities,
  "finance-news": defineRSSSource("https://news.google.com/rss/search?q=site:finance.yahoo.com+when:24h&hl=en-US&gl=US&ceid=US:en"),
})
