import type { FixedColumnID, NewsItem, SourceID } from "@shared/types"
import { metadata } from "@shared/metadata"
import { sources } from "@shared/sources"
import {
  DEFAULT_DESCRIPTION,
  OG_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  getColumnSeo,
  sitemapColumnIds,
} from "@shared/seo"
import { getCacheTable } from "#/database/cache"
import { toAbsoluteUrl } from "#/utils/feed"

const MAX_SOURCES = 12
const MAX_ITEMS = 8

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
}

function sourceLabel(id: SourceID) {
  const source = sources[id]
  return source.title ? `${source.name} ${source.title}` : source.name
}

export function buildNotFoundHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>页面不存在 | ${escapeHtml(SITE_NAME)}</title>
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href="${escapeHtml(SITE_ORIGIN)}/" />
</head>
<body>
  <h1>页面不存在</h1>
  <p>你访问的页面没有找到。</p>
  <p><a href="/">返回首页</a></p>
</body>
</html>`
}

function navHtml() {
  const links = [
    ["/", "最热"],
    ...sitemapColumnIds.map(id => [`/c/${id}`, metadata[id].name] as const),
  ]
  return `<nav>${links.map(([href, name]) => `<a href="${href}">${escapeHtml(name)}</a>`).join(" ")}</nav>`
}

export async function buildColumnHtml(id: FixedColumnID) {
  const seo = getColumnSeo(id)
  const sourceIds = metadata[id].sources.slice(0, MAX_SOURCES)
  const cacheTable = await getCacheTable()
  const rows = cacheTable && sourceIds.length ? await cacheTable.getEntire(sourceIds) : []
  const rowMap = new Map(rows.map(row => [row.id, row]))

  const sections = sourceIds.flatMap((sourceId) => {
    const items = (rowMap.get(sourceId)?.items ?? []).slice(0, MAX_ITEMS)
    if (!items.length) return []
    const list = items.map((item: NewsItem, index) => {
      const href = escapeHtml(toAbsoluteUrl(item.mobileUrl || item.url, SITE_ORIGIN))
      const title = escapeHtml(item.title.trim() || sourceLabel(sourceId))
      return `<li>${index + 1}. <a href="${href}">${title}</a></li>`
    }).join("")
    return [`<section><h2>${escapeHtml(sourceLabel(sourceId))}</h2><ol>${list}</ol></section>`]
  })

  const listItems = sourceIds.flatMap((sourceId) => {
    return (rowMap.get(sourceId)?.items ?? []).slice(0, 3).map(item => ({
      name: item.title.trim(),
      url: toAbsoluteUrl(item.mobileUrl || item.url, SITE_ORIGIN),
    }))
  }).filter(item => item.name).slice(0, 20)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": SITE_NAME,
        "inLanguage": "zh-CN",
        "url": SITE_ORIGIN,
        "description": DEFAULT_DESCRIPTION,
      },
      {
        "@type": "CollectionPage",
        "name": seo.title,
        "url": seo.canonical,
        "description": seo.description,
        "isPartOf": { "@type": "WebSite", "url": SITE_ORIGIN },
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": listItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "url": item.url,
          })),
        },
      },
    ],
  }

  const bodyContent = sections.length
    ? sections.join("\n")
    : "<p>正在汇总各大平台实时热搜，请稍后再看。</p>"

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${escapeHtml(seo.canonical)}" />
  <link rel="alternate" type="application/rss+xml" title="NewsNow RSS Feed" href="/feed.xml" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(seo.canonical)}" />
  <meta property="og:title" content="${escapeHtml(seo.title)}" />
  <meta property="og:description" content="${escapeHtml(seo.description)}" />
  <meta property="og:image" content="${escapeHtml(OG_IMAGE)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
  <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
  <meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>
</head>
<body>
  <header>
    <p><a href="/">${escapeHtml(SITE_NAME)}</a></p>
    ${navHtml()}
  </header>
  <main>
    <h1>${escapeHtml(seo.title)}</h1>
    <p>${escapeHtml(seo.description)}</p>
    ${bodyContent}
  </main>
</body>
</html>`
}
