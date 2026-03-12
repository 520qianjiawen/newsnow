import type { NewsItem } from "@shared/types"

export interface FeedEntry {
  title: string
  link: string
  guid: string
  description: string
  pubDate: number
}

interface BuildFeedXmlOptions {
  title: string
  description: string
  siteUrl: string
  feedUrl: string
  items: FeedEntry[]
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

export function toAbsoluteUrl(url: string, origin: string) {
  try {
    return new URL(url, origin).toString()
  } catch {
    return origin
  }
}

export function getNewsItemTimestamp(item: NewsItem, fallback: number) {
  const candidates = [item.pubDate, item.extra?.date]
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Date.parse(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

export function buildFeedXml({ title, description, siteUrl, feedUrl, items }: BuildFeedXmlOptions) {
  const lastBuildDate = new Date(items[0]?.pubDate ?? Date.now()).toUTCString()
  const xmlItems = items.map(item => [
    "<item>",
    `<title>${escapeXml(item.title)}</title>`,
    `<link>${escapeXml(item.link)}</link>`,
    `<guid isPermaLink="false">${escapeXml(item.guid)}</guid>`,
    `<description>${escapeXml(item.description)}</description>`,
    `<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>`,
    "</item>",
  ].join("")).join("")

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">",
    "<channel>",
    `<title>${escapeXml(title)}</title>`,
    `<description>${escapeXml(description)}</description>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<language>zh-CN</language>`,
    `<ttl>5</ttl>`,
    `<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    xmlItems,
    "</channel>",
    "</rss>",
  ].join("")
}
