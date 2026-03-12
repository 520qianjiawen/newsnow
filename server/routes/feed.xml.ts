import type { NewsItem, SourceID } from "@shared/types"
import { defineEventHandler, getQuery, getRequestURL, setResponseHeader } from "h3"
import { metadata } from "@shared/metadata"
import { sources } from "@shared/sources"
import type { CacheInfo } from "#/types"
import { getCacheTable } from "#/database/cache"
import { getters } from "#/getters"
import type { FeedEntry } from "#/utils/feed"
import { buildFeedXml, getNewsItemTimestamp, toAbsoluteUrl } from "#/utils/feed"

const feedColumns = ["hottest", "news", "world", "tech", "finance", "coingecko", "realtime"] as const
type FeedColumnID = (typeof feedColumns)[number]

const defaultColumn: FeedColumnID = "hottest"
const maxFeedSources = 8
const maxItemsPerSource = 4
const maxFeedItems = 40

function getFeedColumn(value: unknown): FeedColumnID {
  if (typeof value === "string" && feedColumns.includes(value as FeedColumnID)) {
    return value as FeedColumnID
  }
  return defaultColumn
}

function getColumnUrl(origin: string, column: FeedColumnID) {
  return column === defaultColumn ? origin : `${origin}/c/${column}`
}

function getSourceLabel(id: SourceID) {
  const source = sources[id]
  return source.title ? `${source.name} ${source.title}` : source.name
}

function toFeedEntry(origin: string, sourceId: SourceID, item: NewsItem, fallbackTime: number): FeedEntry {
  const link = toAbsoluteUrl(item.mobileUrl || item.url, origin)
  const pubDate = getNewsItemTimestamp(item, fallbackTime)
  const info = item.extra?.info ? ` · ${item.extra.info}` : ""
  const sourceName = getSourceLabel(sourceId)
  return {
    title: item.title.trim() || sourceName,
    link,
    guid: `${sourceId}:${item.id}:${link}`,
    description: `来源：${sourceName}${info}`,
    pubDate,
  }
}

async function loadSourceRows(ids: SourceID[]) {
  const cacheTable = await getCacheTable()
  const cachedRows = cacheTable ? await cacheTable.getEntire(ids) : []
  const cacheMap = new Map(cachedRows.map(row => [row.id, row]))

  const rows = await Promise.allSettled(ids.map(async (id) => {
    const cache = cacheMap.get(id)
    if (cache?.items.length) return cache

    try {
      const items = (await getters[id]()).slice(0, maxItemsPerSource)
      const row = {
        id,
        items,
        updated: Date.now(),
      } satisfies CacheInfo
      if (cacheTable && items.length) await cacheTable.set(id, items)
      return row
    } catch {
      if (cache) return cache
      return undefined
    }
  }))

  return rows
    .flatMap((result) => {
      if (result.status === "fulfilled" && result.value) return [result.value]
      return []
    })
}

function buildFallbackEntry(origin: string, column: FeedColumnID): FeedEntry {
  const now = Date.now()
  return {
    title: "NewsNow RSS Feed 已启用",
    link: getColumnUrl(origin, column),
    guid: `newsnow-feed-${column}-${now}`,
    description: "站点 RSS 已生成成功，当前暂无可用的聚合条目。",
    pubDate: now,
  }
}

export default defineEventHandler(async (event) => {
  const column = getFeedColumn(getQuery(event).column)
  const requestUrl = getRequestURL(event)
  const origin = requestUrl.origin
  const siteUrl = getColumnUrl(origin, column)
  const sourceIds = metadata[column].sources.slice(0, maxFeedSources)
  const rows = await loadSourceRows(sourceIds)
  const items = rows
    .flatMap(row => row.items
      .slice(0, maxItemsPerSource)
      .map(item => toFeedEntry(origin, row.id, item, row.updated)))
    .sort((a, b) => b.pubDate - a.pubDate)
    .filter((item, index, list) => list.findIndex(other => other.link === item.link) === index)
    .slice(0, maxFeedItems)

  const xml = buildFeedXml({
    title: `NewsNow ${metadata[column].name}聚合 RSS`,
    description: `NewsNow ${metadata[column].name}聚合更新 Feed`,
    siteUrl,
    feedUrl: requestUrl.toString(),
    items: items.length ? items : [buildFallbackEntry(origin, column)],
  })

  setResponseHeader(event, "content-type", "application/rss+xml; charset=UTF-8")
  setResponseHeader(event, "cache-control", "public, max-age=300, s-maxage=300, stale-while-revalidate=300")

  return xml
})
