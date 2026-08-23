import { useEffect, useRef } from "react"
import { getCardTheme } from "../column/card-theme"

const ADSENSE_CLIENT = "ca-pub-2719674832476577"
/** Display ad unit "News" from the AdSense dashboard. */
const ADSENSE_NEWS_SLOT = "5248639970"

type AdStatus = "unfilled" | "filled" | string

/**
 * Responsive AdSense unit. `slot` should be a numeric ad unit ID from the
 * AdSense dashboard; without it Google may still fill via Auto Ads.
 */
export function AdSense({
  slot,
  onStatus,
}: {
  slot?: string
  onStatus?: (status: AdStatus) => void
}) {
  const insRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    const el = insRef.current
    if (!el) return
    if (el.getAttribute("data-adsbygoogle-status") || el.getAttribute("data-ad-status")) return

    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Script may not have loaded yet.
    }
  }, [])

  useEffect(() => {
    const el = insRef.current
    if (!el || !onStatus) return

    const emit = () => {
      const status = el.getAttribute("data-ad-status")
      if (status) onStatus(status)
    }

    emit()
    const observer = new MutationObserver(emit)
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] })
    return () => observer.disconnect()
  }, [onStatus])

  return (
    <ins
      ref={insRef}
      className="adsbygoogle block w-full h-full"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot || ADSENSE_NEWS_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

/**
 * Card-sized in-feed slot that sits in the news grid like a source card,
 * so ads don't interrupt titles inside a source.
 */
export function AdCard({
  slot,
  onUnfilled,
}: {
  slot?: string
  onUnfilled?: () => void
}) {
  const filledRef = useRef(false)

  const handleStatus = useCallback((status: AdStatus) => {
    if (status === "filled") filledRef.current = true
    if (status === "unfilled") onUnfilled?.()
  }, [onUnfilled])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!filledRef.current) onUnfilled?.()
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [onUnfilled])

  return (
    <div
      className="news-card news-card--ad flex flex-col h-500px max-md:h-280px rounded-2xl p-4 cursor-default"
      style={getCardTheme("gray", 0)}
      data-nosnippet
    >
      <div className="news-card__header mx-2 mt-0 mb-3">
        <div className="news-card__meta">
          <span className="news-card__source text-sm font-medium op-55">广告</span>
          <div className="news-card__subline">
            <span className="news-card__updated text-xs op-50">赞助内容</span>
          </div>
        </div>
      </div>
      <div className="news-card__panel flex-1 min-h-0 overflow-hidden rounded-[14px] p-2 flex items-center justify-center">
        <AdSense slot={slot ?? ADSENSE_NEWS_SLOT} onStatus={handleStatus} />
      </div>
    </div>
  )
}

export default AdSense
