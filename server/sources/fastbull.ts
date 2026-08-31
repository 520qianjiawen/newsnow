import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

const baseURL = "https://www.fastbull.com"

function toAbs(href: string) {
  try {
    return new URL(href, baseURL).toString()
  } catch {
    return href
  }
}

const express = defineSource(async () => {
  const html: any = await myFetch(`${baseURL}/cn/express-news`)
  const $ = cheerio.load(html)
  const news: NewsItem[] = []
  const seen = new Set<string>()

  $(".news-list[data-id], .news-list[data-date]").each((_, el) => {
    const $el = $(el)
    const id = $el.attr("data-id") || ""
    const titleEl = $el.find(".title_name").first()
    const titleText = titleEl.text().replace(/\s+/g, " ").trim()
    const title = titleText.match(/【(.+)】/)?.[1] ?? titleText
    const href = $el.find("[data-href]").attr("data-href")
      || titleEl.attr("href")
      || (id ? `/cn/fastshort/${id}` : "")
    const date = $el.attr("data-date")
      || $el.find("[data-date]").attr("data-date")
      || $el.find("[data-time]").attr("data-time")
    if (!href || !title || seen.has(href)) return
    seen.add(href)
    news.push({
      url: toAbs(href),
      title: title.length < 4 ? titleText : title,
      id: href,
      pubDate: date ? Number(date) : undefined,
    })
  })
  return news
})

const news = defineSource(async () => {
  const html: any = await myFetch(`${baseURL}/cn/news`)
  const $ = cheerio.load(html)
  const items: NewsItem[] = []
  const seen = new Set<string>()

  $("a.trending_type[href], .trending_type[href]").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const title = $el.find(".title").text().replace(/\s+/g, " ").trim() || $el.attr("title") || ""
    const date = $el.find("[data-date]").attr("data-date") || $el.attr("data-date")
    if (!href || !title || seen.has(href)) return
    seen.add(href)
    items.push({
      url: toAbs(href),
      title,
      id: href,
      pubDate: date ? Number(date) : undefined,
    })
  })
  return items
})

export default defineSource({
  "fastbull": express,
  "fastbull-express": express,
  "fastbull-news": news,
})
