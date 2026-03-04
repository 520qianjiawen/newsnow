interface PolymarketEvent {
  id: string
  title: string
  slug: string
  markets: {
    outcomePrices: string // JSON string array
  }[]
}

export default defineSource({
  polymarket: async () => {
    const url = "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=20"
    const res: PolymarketEvent[] = await myFetch(url)

    return res.map((event) => {
      const mainMarket = event.markets?.[0]
      let priceText = ""

      if (mainMarket?.outcomePrices) {
        try {
          const prices = JSON.parse(mainMarket.outcomePrices)
          const yesPrice = Number(prices[0])
          if (!Number.isNaN(yesPrice)) {
            priceText = `${(yesPrice * 100).toFixed(0)}%`
          }
        } catch {
          // ignore parse error
        }
      }

      return {
        id: event.id,
        title: event.title,
        url: `https://polymarket.com/event/${event.slug}`,
        extra: {
          info: priceText,
        },
      }
    })
  },
})
