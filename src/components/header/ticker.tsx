import { useQuery } from "@tanstack/react-query"
import type { SourceResponse } from "@shared/types"

export function Ticker() {
  const { data } = useQuery({
    queryKey: ["source", "finance-indices"],
    queryFn: async () => {
      const url = `/s?id=finance-indices`
      // For ticker we just fetch directly, caching is handled by react-query & backend mostly
      const response: SourceResponse = await myFetch(url)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // auto refetch every 5 mins
  })

  if (!data?.items?.length) return null

  return (
    <div className="flex items-center mx-4 gap-6 overflow-hidden flex-1 select-none pointer-events-none text-sm op-80">
      <div className="flex gap-6 animate-marquee whitespace-nowrap">
        {data.items.map((item) => {
          const isUp = item.extra?.prefix?.startsWith("+")
          return (
            <div key={item.id} className="flex gap-2 items-center">
              <span className="font-bold">{item.title}</span>
              <span>{item.extra?.info}</span>
              <span className={isUp ? "text-green" : "text-red"}>
                {item.extra?.prefix}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
