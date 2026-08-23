import { ADSENSE_CERTIFICATION, ADSENSE_PUBLISHER } from "@shared/seo"

export default defineEventHandler((event) => {
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8")
  setResponseHeader(event, "cache-control", "public, max-age=86400")
  return `google.com, ${ADSENSE_PUBLISHER}, DIRECT, ${ADSENSE_CERTIFICATION}\n`
})
