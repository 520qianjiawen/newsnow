interface WapRes {
  code: number
  exp_str: string
  list: {
    hot_id: number
    keyword: string
    show_name: string
    score: number
    word_type: number
    goto_type: number
    goto_value: string
    icon: string
    live_id: any[]
    call_reason: number
    heat_layer: string
    pos: number
    id: number
    status: string
    name_type: string
    resource_id: number
    set_gray: number
    card_values: any[]
    heat_score: number
    stat_datas: {
      etime: string
      stime: string
      is_commercial: string
    }
  }[]
  top_list: any[]
  hotword_egg_info: string
  seid: string
  timestamp: number
  total_count: number
}

interface BilibiliVideo {
  bvid: string
  title: string
  pic?: string
  desc?: string
  pubdate?: number
  owner?: {
    name?: string
  }
  stat?: {
    view?: number
    like?: number
  }
}

interface BilibiliResponse<T = any> {
  code: number
  message?: string
  data?: T
}

const bilibiliHeaders = {
  Referer: "https://www.bilibili.com/",
  Origin: "https://www.bilibili.com",
  Accept: "application/json, text/plain, */*",
}

async function fetchBilibiliResponse<T = any>(urls: string[]) {
  let error: Error | null = null

  for (const url of urls) {
    try {
      const res = await myFetch<BilibiliResponse<T> | string>(url, { headers: bilibiliHeaders })
      const data = typeof res === "string" ? JSON.parse(res) : res
      if (data?.code === 0) return data
      error = new Error(`Bilibili API error: ${data?.message || data?.code || "unknown"}`)
    } catch (e) {
      error = e as Error
    }
  }

  throw error || new Error("Bilibili API request failed")
}

function getVideoList(data: any): BilibiliVideo[] {
  if (Array.isArray(data?.data?.list)) return data.data.list
  if (Array.isArray(data?.list)) return data.list
  return []
}

function toVideoNews(videos: BilibiliVideo[]) {
  return videos
    .filter(video => video?.bvid && video?.title)
    .map(video => ({
      id: video.bvid,
      title: video.title,
      url: `https://www.bilibili.com/video/${video.bvid}`,
      pubDate: video.pubdate ? video.pubdate * 1000 : undefined,
      extra: {
        info: `${video.owner?.name || "B站"} · ${formatNumber(video.stat?.view || 0)}观看 · ${formatNumber(video.stat?.like || 0)}点赞`,
        hover: video.desc,
        icon: video.pic,
      },
    }))
}

const hotSearch = defineSource(async () => {
  const urls = [
    "https://s.search.bilibili.com/main/hotword?limit=30",
    "https://s.search.bilibili.com/main/hotword?limit=50",
  ]
  let error: Error | null = null

  for (const url of urls) {
    try {
      const res = await myFetch<WapRes | string>(url, { headers: bilibiliHeaders })
      const data = typeof res === "string" ? JSON.parse(res) as WapRes : res
      if (!Array.isArray(data?.list) || !data.list.length) continue
      return data.list.map(k => ({
        id: k.keyword,
        title: k.show_name || k.keyword,
        url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(k.keyword)}`,
        extra: {
          icon: k.icon,
        },
      }))
    } catch (e) {
      error = e as Error
    }
  }

  throw error || new Error("Bilibili hot search request failed")
})

const hotVideo = defineSource(async () => {
  const res = await fetchBilibiliResponse([
    "https://api.bilibili.com/x/web-interface/popular?pn=1&ps=30",
    "https://api.bilibili.com/x/web-interface/popular",
  ])
  const list = getVideoList(res)
  if (!list.length) throw new Error("Bilibili hot video list is empty")
  return toVideoNews(list)
})

const ranking = defineSource(async () => {
  const res = await fetchBilibiliResponse([
    "https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all",
    "https://api.bilibili.com/x/web-interface/ranking/v2",
    "https://api.bilibili.com/x/web-interface/ranking?rid=0&day=3&type=1",
    "https://api.bilibili.com/x/web-interface/ranking?rid=0&type=all",
  ])
  const list = getVideoList(res)
  if (!list.length) throw new Error("Bilibili ranking list is empty")
  return toVideoNews(list)
})

function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${Math.floor(num / 10000)}w+`
  }
  return num.toString()
}

export default defineSource({
  "bilibili": hotSearch,
  "bilibili-hot-search": hotSearch,
  "bilibili-hot-video": hotVideo,
  "bilibili-ranking": ranking,
})
