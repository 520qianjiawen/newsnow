import { isFixedColumnId, normalizeColumnParam } from "@shared/seo"
import { buildColumnHtml, buildNotFoundHtml } from "#/utils/seo-html"

const BOT_UA = /Googlebot|Google-InspectionTool|Bingbot|Baiduspider|Bytespider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Applebot|PetalBot|Sogou|360Spider|Yeti|ia_archiver/i

function isCrawler(userAgent: string | undefined) {
  return !!userAgent && BOT_UA.test(userAgent)
}

export default defineEventHandler(async (event) => {
  const method = event.method
  if (method !== "GET" && method !== "HEAD") return

  const url = getRequestURL(event)
  const pathname = url.pathname.replace(/\/+$/, "") || "/"

  if (pathname === "/c/hottest" || pathname === "/c/focus") {
    return sendRedirect(event, "/", 301)
  }
  if (pathname === "/c/china") {
    return sendRedirect(event, "/c/news", 301)
  }

  const columnMatch = pathname.match(/^\/c\/([^/]+)$/)
  const crawler = isCrawler(getHeader(event, "user-agent"))

  if (columnMatch) {
    const columnId = normalizeColumnParam(columnMatch[1])
    if (!isFixedColumnId(columnId)) {
      if (!crawler) return
      setResponseStatus(event, 404)
      setResponseHeader(event, "content-type", "text/html; charset=utf-8")
      setResponseHeader(event, "cache-control", "public, max-age=300")
      return buildNotFoundHtml()
    }

    if (!crawler) return
    setResponseHeader(event, "content-type", "text/html; charset=utf-8")
    setResponseHeader(event, "cache-control", "public, max-age=300")
    return await buildColumnHtml(columnId)
  }

  if (pathname === "/" && crawler) {
    setResponseHeader(event, "content-type", "text/html; charset=utf-8")
    setResponseHeader(event, "cache-control", "public, max-age=300")
    return await buildColumnHtml("hottest")
  }
})
