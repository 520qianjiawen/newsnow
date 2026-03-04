interface TrendingCoin {
  item: {
    id: string
    coin_id: number
    name: string
    symbol: string
    market_cap_rank: number
    thumb: string
    small: string
    large: string
    slug: string
    price_btc: number
    score: number
    data: {
      price: string
      price_btc: string
      price_change_percentage_24h: Record<string, number>
      market_cap: string
      market_cap_btc: string
      total_volume: string
      total_volume_btc: string
      sparkline: string
      content: {
        title: string
        description: string
      } | null
    }
  }
}

interface TrendingRes {
  coins: TrendingCoin[]
}

export default defineSource({
  coingecko: async () => {
    const url = "https://api.coingecko.com/api/v3/search/trending"
    const res: TrendingRes = await myFetch(url)
    return res.coins.map(({ item }) => {
      const priceChange = item.data.price_change_percentage_24h.usd?.toFixed(2)
      const changeText = priceChange ? `${priceChange}%` : ""

      return {
        id: item.id,
        title: `${item.name} (${item.symbol})`,
        url: `https://www.coingecko.com/en/coins/${item.slug}`,
        extra: {
          info: `$${item.data.price} ${changeText}`,
          icon: {
            url: item.small,
            scale: 1,
          },
        },
      }
    })
  },
})
