import { SITE_ORIGIN, sitemapColumnIds } from "@shared/seo"
import { escapeXml } from "#/utils/feed"

export default defineEventHandler((event) => {
  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0" },
    ...sitemapColumnIds.map(id => ({
      loc: `${SITE_ORIGIN}/c/${id}`,
      priority: "0.8",
    })),
  ]

  const body = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    ...urls.flatMap(url => [
      "<url>",
      `<loc>${escapeXml(url.loc)}</loc>`,
      `<lastmod>${lastmod}</lastmod>`,
      "<changefreq>hourly</changefreq>",
      `<priority>${url.priority}</priority>`,
      "</url>",
    ]),
    "</urlset>",
    "",
  ].join("\n")

  setResponseHeader(event, "content-type", "application/xml; charset=UTF-8")
  setResponseHeader(event, "cache-control", "public, max-age=3600")
  return body
})
