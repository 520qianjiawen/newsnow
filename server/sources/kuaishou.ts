import type { NewsItem } from "@shared/types"

interface KuaishouRes {
  defaultClient: {
    ROOT_QUERY: {
      [key: string]: any
    }
    [key: string]: any
  }
}

interface HotRankData {
  result: number
  pcursor: string
  webPageArea: string
  items: {
    type: string
    generated: boolean
    id: string
    typename: string
  }[]
}

function extractApolloStateJSON(html: string) {
  const patterns = [
    /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/,
    /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\})\s*;/,
    /self\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\})\s*;/,
  ]
  for (const pattern of patterns) {
    const matches = html.match(pattern)
    if (matches?.[1]) return matches[1]
  }
  return null
}

function pickRefId(value: any): string | null {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object") {
    if (typeof value.id === "string") return value.id
    if (typeof value.__ref === "string") return value.__ref
  }
  return null
}

function getHotRankId(rootQuery: Record<string, any>) {
  const directKeys = [
    "visionHotRank({\"page\":\"home\"})",
    "visionHotRank({\"page\":\"hot\"})",
    "visionHotRank({\"page\":\"index\"})",
  ]
  for (const key of directKeys) {
    const id = pickRefId(rootQuery[key])
    if (id) return id
  }
  for (const [key, value] of Object.entries(rootQuery)) {
    if (!key.startsWith("visionHotRank(")) continue
    const id = pickRefId(value)
    if (id) return id
  }
  return null
}

export default defineSource(async () => {
  // 获取快手首页HTML
  const html = await myFetch("https://www.kuaishou.com/?isHome=1")
  if (typeof html !== "string") throw new Error("快手首页返回格式异常")

  // 提取 window.__APOLLO_STATE__ 中的数据
  const stateJSON = extractApolloStateJSON(html)
  if (!stateJSON) {
    throw new Error("无法获取快手热榜数据")
  }

  // 解析JSON数据
  const data: KuaishouRes = JSON.parse(stateJSON)
  const rootQuery = data.defaultClient?.ROOT_QUERY || {}

  // 获取热榜数据 ID
  const hotRankId = getHotRankId(rootQuery)
  if (!hotRankId) throw new Error("快手热榜数据结构发生变化")

  // 获取热榜列表数据
  const hotRankData = data.defaultClient[hotRankId] as HotRankData | undefined
  const rawItems = Array.isArray(hotRankData?.items) ? hotRankData.items : []
  if (!rawItems.length) throw new Error("快手热榜列表为空")

  // 转换数据格式
  const news: NewsItem[] = []
  rawItems.forEach((item) => {
    const itemRef = pickRefId(item)
    const hotItem = itemRef ? data.defaultClient[itemRef] : null
    const title = hotItem?.name || hotItem?.title || hotItem?.hotWord || hotItem?.word
    if (!title) return

    if (hotItem?.tagType === "置顶") return

    news.push({
      id: hotItem?.id || itemRef || title,
      title,
      url: `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(title)}`,
      extra: {
        icon: hotItem?.iconUrl || hotItem?.icon,
      },
    })
  })
  return news
})
