import { useQuery } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"

interface TickerProps {
  sourceId: SourceID
  itemIds?: string[]
  labels?: Record<string, string>
  label: string
  icon: string
  tone?: "market" | "forex"
}

const stockItemIds = [
  "finance-indices-sse",
  "finance-indices-nasdaq",
]

const stockLabels = {
  "finance-indices-sse": "A股 · 上证",
  "finance-indices-nasdaq": "美股 · 纳指",
}

const forexItemIds = [
  "finance-forex-usdcny",
  "finance-forex-eurcny",
]

const forexLabels = {
  "finance-forex-usdcny": "美元 / 人民币",
  "finance-forex-eurcny": "欧元 / 人民币",
}

function TickerItem({
  item,
  label,
}: {
  item: SourceResponse["items"][number]
  label?: string
}) {
  const isUp = item.extra?.prefix?.startsWith("+")
  return (
    <div className="market-ticker__item">
      <span className="market-ticker__name">{label || item.title}</span>
      <span className="market-ticker__price">{item.extra?.info}</span>
      <span className={$("market-ticker__change", isUp ? "text-green" : "text-red")}>
        {item.extra?.prefix}
      </span>
    </div>
  )
}

export function Ticker({
  sourceId,
  itemIds,
  labels,
  label,
  icon,
  tone = "market",
}: TickerProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      let url = `/s?id=${sourceId}`
      const headers: Record<string, string> = {}
      if (refetchSources.has(sourceId)) {
        url += "&latest"
        const jwt = safeParseString(localStorage.getItem("jwt"))
        if (jwt) headers.Authorization = `Bearer ${jwt}`
        refetchSources.delete(sourceId)
      }
      const response: SourceResponse = await myFetch(url, { headers })
      cacheSources.set(sourceId, response)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // auto refetch every 5 mins
  })

  const rowHeight = 20
  const visibleRows = 2
  const items = useMemo(() => {
    const sourceItems = data?.items || []
    if (!itemIds?.length) return sourceItems
    return itemIds
      .map(id => sourceItems.find(item => item.id === id))
      .filter((item): item is SourceResponse["items"][number] => Boolean(item))
  }, [data?.items, itemIds])
  const shouldRoll = items.length > visibleRows
  const rollingItems = useMemo(() => {
    if (!items.length) return []
    const originals = items.map(item => ({
      key: `item-${item.id}`,
      item,
    }))
    if (items.length <= visibleRows) return originals
    const clones = items.slice(0, visibleRows).map((item, i) => ({
      key: `clone-${item.id}-${i}`,
      item,
    }))
    return [...originals, ...clones]
  }, [items])
  const [idx, setIdx] = useState(0)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    if (!shouldRoll) return
    const timer = setInterval(() => {
      setIdx(prev => prev + 1)
    }, 3200)
    return () => clearInterval(timer)
  }, [shouldRoll])

  useEffect(() => {
    setIdx(0)
    setAnimate(true)
  }, [items.length, sourceId])

  useEffect(() => {
    if (!shouldRoll || idx < items.length) return
    const timer = setTimeout(() => {
      setAnimate(false)
      setIdx(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true)
        })
      })
    }, 520)
    return () => clearTimeout(timer)
  }, [idx, items.length, shouldRoll])

  return (
    <section
      className={$("market-ticker", `market-ticker--${tone}`)}
      aria-label={`${label}实时行情`}
    >
      <div className="market-ticker__heading">
        <i className={$(icon, "market-ticker__icon")} aria-hidden="true" />
        <span>{label}</span>
        <span className="market-ticker__live">实时</span>
      </div>
      <div className="market-ticker__viewport" aria-live="polite">
        {isPending
          ? (
              <div className="market-ticker__state">
                <span className="market-ticker__skeleton" />
                <span className="market-ticker__skeleton market-ticker__skeleton--short" />
              </div>
            )
          : isError || !rollingItems.length
            ? <div className="market-ticker__state">行情暂不可用</div>
            : (
                <div
                  className="market-ticker__track"
                  style={{
                    transform: `translateY(-${(shouldRoll ? idx : 0) * rowHeight}px)`,
                    transition: shouldRoll && animate ? "transform 500ms" : "none",
                  }}
                >
                  {rollingItems.map(({ key, item }) => (
                    <div key={key} className="market-ticker__row">
                      <TickerItem item={item} label={labels?.[item.id]} />
                    </div>
                  ))}
                </div>
              )}
      </div>
    </section>
  )
}

export function StockTicker() {
  return (
    <Ticker
      sourceId="finance-indices"
      itemIds={stockItemIds}
      labels={stockLabels}
      label="股市"
      icon="i-ph:chart-line-up-duotone"
    />
  )
}

export function ForexTicker() {
  return (
    <Ticker
      sourceId="finance-forex"
      itemIds={forexItemIds}
      labels={forexLabels}
      label="汇率"
      icon="i-ph:currency-circle-dollar-duotone"
      tone="forex"
    />
  )
}
