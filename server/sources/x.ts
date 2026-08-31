import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

const TRENDS_URL = "https://trends24.in/"
const X_SEARCH = "https://x.com/search"

function toXSearchUrl(href: string | undefined, title: string) {
  if (href) {
    try {
      const url = new URL(href, "https://x.com")
      url.protocol = "https:"
      url.hostname = "x.com"
      return url.toString()
    } catch {
      // fall through
    }
  }
  return `${X_SEARCH}?q=${encodeURIComponent(title)}`
}

function parseLatestSnapshot($: cheerio.CheerioAPI) {
  const cards = $(".list-container").not(".ad-container, .vertical-ad").toArray()

  for (const card of cards) {
    const news: NewsItem[] = []
    $(card).find("a.trend-link").each((_, el) => {
      const $el = $(el)
      const title = $el.text().replace(/\s+/g, " ").trim()
      if (!title) return
      const url = toXSearchUrl($el.attr("href"), title)
      news.push({
        id: title,
        title,
        url,
        mobileUrl: url,
      })
    })
    if (news.length) return news
  }

  return []
}

export default defineSource(async () => {
  const html = await myFetch(TRENDS_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      Referer: TRENDS_URL,
    },
  })
  const news = parseLatestSnapshot(cheerio.load(html))
  if (!news.length) throw new Error("Cannot fetch X trends")
  return news
})
