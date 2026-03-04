import { useQuery } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"

interface TickerProps {
  sourceId: SourceID
}

function TickerItem({ item }: { item: SourceResponse["items"][number] }) {
  const isUp = item.extra?.prefix?.startsWith("+")
  return (
    <div className="flex gap-2 items-center min-w-0 leading-tight">
      <span className="font-bold truncate text-xs">{item.title}</span>
      <span>{item.extra?.info}</span>
      <span className={isUp ? "text-green" : "text-red"}>
        {item.extra?.prefix}
      </span>
    </div>
  )
}

export function Ticker({ sourceId }: TickerProps) {
  const { data } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const url = `/s?id=${sourceId}`
      // For ticker we just fetch directly, caching is handled by react-query & backend mostly
      const response: SourceResponse = await myFetch(url)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // auto refetch every 5 mins
  })

  const rowHeight = 20
  const visibleRows = 2
  const items = useMemo(() => data?.items || [], [data?.items])
  const rollingItems = useMemo(() => {
    if (!items.length) return []
    const originals = items.map(item => ({
      key: `item-${item.id}`,
      item,
    }))
    if (items.length <= 1) return originals
    const clones = items.slice(0, visibleRows).map((item, i) => ({
      key: `clone-${item.id}-${i}`,
      item,
    }))
    return [...originals, ...clones]
  }, [items])
  const [idx, setIdx] = useState(0)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setIdx(prev => prev + 1)
    }, 3200)
    return () => clearInterval(timer)
  }, [items.length])

  useEffect(() => {
    setIdx(0)
    setAnimate(true)
  }, [items.length, sourceId])

  useEffect(() => {
    if (items.length <= 1 || idx < items.length) return
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
  }, [idx, items.length])

  if (!data?.items?.length) return null

  return (
    <div className="flex items-center overflow-hidden flex-1 select-none pointer-events-none text-sm op-80 min-w-0">
      <div className="overflow-hidden w-full h-[40px]">
        <div
          className="flex flex-col ease-out"
          style={{
            transform: `translateY(-${idx * rowHeight}px)`,
            transition: animate ? "transform 500ms" : "none",
          }}
        >
          {rollingItems.map(({ key, item }) => (
            <div key={key} className="h-[20px] flex items-center">
              <TickerItem item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
