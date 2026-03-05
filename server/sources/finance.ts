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
    { id: "szse", sym: "399001.SZ", name: "深证成指" },
    { id: "hsi", sym: "^HSI", name: "恒生指数" },
    { id: "nikkei", sym: "^N225", name: "日经225" },
    { id: "nasdaq", sym: "^IXIC", name: "纳斯达克指数" },
    { id: "sp500", sym: "^GSPC", name: "标普500指数" },
    { id: "dow", sym: "^DJI", name: "道琼斯指数" },
    { id: "ftse", sym: "^FTSE", name: "英国富时100" },
    { id: "stoxx", sym: "^STOXX50E", name: "欧洲斯托克50" },
    { id: "india", sym: "^BSESN", name: "印度SENSEX" },
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
    { id: "hkdcny", sym: "HKDCNY=X", name: "港币/人民币" },
    { id: "jpycny", sym: "JPYCNY=X", name: "日元/人民币" },
    { id: "audcny", sym: "AUDCNY=X", name: "澳元/人民币" },
    { id: "eurusd", sym: "EURUSD=X", name: "欧元/美元" },
    { id: "gbpusd", sym: "GBPUSD=X", name: "英镑/美元" },
    { id: "usdjpy", sym: "USDJPY=X", name: "美元/日元" },
    { id: "usdcad", sym: "USDCAD=X", name: "美元/加元" },
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
    { id: "silver", sym: "SI=F", name: "白银 (Silver)" },
    { id: "copper", sym: "HG=F", name: "铜 (Copper)" },
    { id: "palladium", sym: "PA=F", name: "钯金 (Palladium)" },
    { id: "platinum", sym: "PL=F", name: "铂金 (Platinum)" },
    { id: "oil", sym: "CL=F", name: "原油 (WTI)" },
    { id: "brent", sym: "BZ=F", name: "布伦特原油" },
    { id: "ngas", sym: "NG=F", name: "天然气 (Nat Gas)" },
    { id: "corn", sym: "ZC=F", name: "玉米 (Corn)" },
    { id: "wheat", sym: "ZW=F", name: "小麦 (Wheat)" },
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
