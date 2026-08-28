import type { FixedColumnID } from "./types"
import { fixedColumnIds, metadata } from "./metadata"

export const SITE_ORIGIN = "https://news.neutemu.com"
export const SITE_NAME = "NewsNow"
export const DEFAULT_TITLE = "今日国内外热门新闻与实时热搜 | NewsNow"
export const DEFAULT_DESCRIPTION = "NewsNow 全球实时热搜新闻排行，汇聚各大平台实时热点，提供快速高效的阅读体验。"
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`

/** Column pages that should appear in the sitemap. Home covers hottest/focus. */
export const sitemapColumnIds = ["realtime", "tech", "news", "world", "finance", "coingecko"] as const satisfies readonly FixedColumnID[]

export function isFixedColumnId(value: string): value is FixedColumnID {
  return (fixedColumnIds as readonly string[]).includes(value)
}

export function normalizeColumnParam(raw: string) {
  return raw.toLowerCase() === "china" ? "news" : raw.toLowerCase()
}

export function getColumnSeo(id: FixedColumnID) {
  const isHome = id === "hottest" || id === "focus"
  return {
    title: isHome ? DEFAULT_TITLE : `${metadata[id].name}实时热搜排行 | NewsNow`,
    description: isHome
      ? DEFAULT_DESCRIPTION
      : `为您精选最新的${metadata[id].name}热点新闻、实时热搜与行业动态，快速掌握${metadata[id].name}资讯。`,
    canonical: isHome ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/c/${id}`,
  }
}
