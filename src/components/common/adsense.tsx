import { useEffect } from "react"

/**
 * A simple Google AdSense component. When rendered, it pushes a new ad slot
 * to the global `adsbygoogle` queue. The optional `slot` prop can be used
 * to specify a `data-ad-slot` attribute. If not provided, the slot attribute
 * is omitted and Google will serve a default ad unit. Note that the
 * ad client ID is hard‑coded to the one provided in `index.html`.
 */
export function AdSense({ slot }: { slot?: string }) {
  useEffect(() => {
    try {
      // @ts-ignore  Google adsbygoogle script injects a global
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      // Suppress errors if the ad library has not loaded yet
      console.error(e)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle block w-full"
      style={{ display: "block" }}
      data-ad-client="ca-pub-2719674832476577"
      data-ad-slot={slot || undefined}
      data-ad-format="auto"
    />
  )
}

export default AdSense