import * as cheerio from "cheerio"

interface PolymarketEvent {
  id: string
  title: string
  slug: string
  volume24hr?: string | number
}

const polymarketBaseUrl = "https://polymarket.com"

function formatVolume(value?: string | number) {
  const volume = Number(value || 0)
  if (!Number.isFinite(volume)) return ""
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(volume)
}

async function getChineseTitle(event: PolymarketEvent) {
  try {
    const html = await myFetch<string>(`${polymarketBaseUrl}/zh/event/${event.slug}`, {
      retry: 1,
      timeout: 5000,
    })
    const $ = cheerio.load(html)
    const title = $("meta[property=\"og:title\"]").attr("content")?.trim()
    return title?.replace(/\s+(?:交易)?赔率与预测.*?\|\s*Polymarket$/u, "").trim() || event.title
  } catch {
    return event.title
  }
}

export default defineSource({
  polymarket: async () => {
    const url = "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=20&order=volume24hr&ascending=false"
    const res: PolymarketEvent[] = await myFetch(url)

    return await Promise.all(res.map(async (event) => {
      const title = await getChineseTitle(event)
      return {
        id: event.id,
        title,
        url: `${polymarketBaseUrl}/zh/event/${event.slug}`,
        extra: {
          info: `24h 交易 $${formatVolume(event.volume24hr)}`,
          hover: title === event.title ? undefined : `原文：${event.title}`,
        },
      }
    }))
  },
})
