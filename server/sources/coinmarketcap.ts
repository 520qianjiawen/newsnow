export default defineSource({
  coinmarketcap: async () => {
    const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=20"
    try {
      const res: any = await myFetch(url, {
        headers: {
          "X-CMC_PRO_API_KEY": "415481b0a9e24fa49f09c301bc09617c",
          "Accept": "application/json",
        },
      })

      if (!res?.data?.length) return []

      return res.data.map((item: any) => {
        const quote = item.quote?.USD || {}
        const price = quote.price || 0
        const change = quote.percent_change_24h || 0

        let formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        if (price < 0.01) {
          formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })
        }

        return {
          id: String(item.id),
          title: `${item.name} (${item.symbol})`,
          url: `https://coinmarketcap.com/currencies/${item.slug}/`,
          extra: {
            info: `$${formattedPrice}`,
            prefix: `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
          },
        }
      })
    } catch {
      // silent fail
      return []
    }
  },
})
