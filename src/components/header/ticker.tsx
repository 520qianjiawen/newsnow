import { useQuery } from "@tanstack/react-query"
import type { SourceID, SourceResponse } from "@shared/types"

interface TickerProps {
  sourceId: SourceID
}

function TickerItem({ item }: { item: SourceResponse["items"][number] }) {
  const isUp = item.extra?.prefix?.startsWith("+")
  return (
    <div className="flex gap-2 items-center min-w-0">
      <span className="font-bold truncate">{item.title}</span>
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

  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!data?.items?.length || data.items.length <= 1) return
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % data.items.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [data?.items])

  useEffect(() => {
    setIdx(0)
  }, [data?.items?.length, sourceId])

  if (!data?.items?.length) return null

  return (
    <div className="flex items-center overflow-hidden flex-1 select-none pointer-events-none text-sm op-80 min-w-0">
      <div className="lg:hidden overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {data.items.map(item => (
            <div key={item.id} className="w-full shrink-0 flex justify-center">
              <TickerItem item={item} />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:(flex gap-6 animate-marquee whitespace-nowrap)">
        {data.items.map(item => (
          <TickerItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
