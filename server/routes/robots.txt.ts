import { SITE_ORIGIN } from "@shared/seo"

export default defineEventHandler((event) => {
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8")
  setResponseHeader(event, "cache-control", "public, max-age=86400")
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /s",
    "Disallow: /api",
    "Disallow: /oauth",
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n")
})
