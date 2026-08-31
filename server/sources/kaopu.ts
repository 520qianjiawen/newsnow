import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

const KAOPU_HOME = "https://kaopu.news/"
const KAOPU_STORIES = "https://kaopu.news/data/stories.json"
const blockedPublishers = new Set(["财新", "公视"])
const fallbackFeeds: { publisher: string, url: string }[] = [
  { publisher: "BBC中文", url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml" },
  { publisher: "法广", url: "https://www.rfi.fr/cn/rss" },
  { publisher: "德国之声", url: "https://rss.dw.com/xml/rss-chi-news" },
  { publisher: "纽约时报", url: "https://cn.nytimes.com/rss/" },
]

interface KaopuStory {
  id?: string
  headline?: string
  summary?: string
  createdAt?: string
  updatedAt?: string
  sources?: { publisher?: string, title?: string, url?: string, publishedAt?: string }[]
}

function isBlocked(publisher: string) {
  return blockedPublishers.has(publisher.trim())
}

function toKaopuUrl(href: string) {
  try {
    return new URL(href, KAOPU_HOME).toString()
  } catch {
    return href
  }
}

function publisherFromMeta(text: string) {
  const parts = text.split("·").map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean)
  return parts[parts.length - 1] || ""
}

async function fetchText(url: string) {
  try {
    const html = await myFetch(url, {
      responseType: "text",
      retry: 0,
      timeout: 8000,
    })
    return typeof html === "string" ? html : ""
  } catch {
    return ""
  }
}

function parseHomepage(html: string) {
  if (!html || /just a moment/i.test(html) || !html.includes("story-title")) return []
  const $ = cheerio.load(html)
  const news: NewsItem[] = []
  const seen = new Set<string>()

  $(".story-card a[href^='/story/']").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const title = $el.find(".story-title").text().replace(/\s+/g, " ").trim()
    const publisher = publisherFromMeta($el.find(".story-provenance").text())
    if (!href || !title || isBlocked(publisher) || seen.has(href)) return
    seen.add(href)
    news.push({
      id: href,
      title,
      url: toKaopuUrl(href),
      extra: {
        hover: $el.find(".story-summary").text().replace(/\s+/g, " ").trim(),
        info: publisher || undefined,
      },
    })
  })

  $("a.brief-row[href^='/story/']").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const title = $el.find(".brief-headline").text().replace(/\s+/g, " ").trim()
    const publisher = publisherFromMeta($el.find(".brief-meta").text())
    if (!href || !title || isBlocked(publisher) || seen.has(href)) return
    seen.add(href)
    news.push({
      id: href,
      title,
      url: toKaopuUrl(href),
      extra: {
        info: publisher || undefined,
      },
    })
  })

  return news
}

function parseStoriesJson(data: KaopuStory[]) {
  const news: NewsItem[] = []
  for (const story of data) {
    const title = story.headline?.trim()
    if (!title) continue
    const source = story.sources?.find(s => s.publisher && !isBlocked(s.publisher) && s.url) ?? story.sources?.[0]
    if (source?.publisher && isBlocked(source.publisher)) continue
    const date = (story.updatedAt || story.createdAt || "").slice(0, 10)
    const url = source?.url || (story.id && date ? toKaopuUrl(`/story/${date}/${encodeURIComponent(story.id)}`) : "")
    if (!url) continue
    news.push({
      id: story.id || url,
      title,
      url,
      pubDate: story.updatedAt || story.createdAt || source?.publishedAt,
      extra: {
        hover: story.summary,
        info: source?.publisher,
      },
    })
  }
  return news
}

async function fetchFallback() {
  const lists = await Promise.all(fallbackFeeds.map(async (feed) => {
    try {
      const data = await rss2json(feed.url)
      return (data?.items ?? []).map(item => ({
        id: item.link,
        title: item.title,
        url: item.link,
        pubDate: item.created,
        extra: {
          hover: item.description,
          info: feed.publisher,
        },
      } satisfies NewsItem))
    } catch {
      return [] as NewsItem[]
    }
  }))

  const seen = new Set<string>()
  return lists.flat()
    .filter((item) => {
      if (!item.title || !item.url || seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
    .sort((a, b) => Date.parse(String(b.pubDate || 0)) - Date.parse(String(a.pubDate || 0)))
}

export default defineSource(async () => {
  const html = await fetchText(KAOPU_HOME)
  const fromHtml = parseHomepage(html)
  if (fromHtml.length) return fromHtml

  try {
    const data = await myFetch<KaopuStory[]>(KAOPU_STORIES, { retry: 0, timeout: 8000 })
    const fromJson = Array.isArray(data) ? parseStoriesJson(data) : []
    const newest = fromJson
      .map(item => Date.parse(String(item.pubDate || 0)))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => b - a)[0] || 0
    if (fromJson.length && Date.now() - newest < 3 * 24 * 60 * 60 * 1000) return fromJson
  } catch {
    // Cloudflare or stale dump — fall through
  }

  const fallback = await fetchFallback()
  if (!fallback.length) throw new Error("Cannot fetch kaopu news")
  return fallback
})
