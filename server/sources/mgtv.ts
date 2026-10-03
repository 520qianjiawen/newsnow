import { myFetch } from "#/utils/fetch"
import { defineSource } from "#/utils/source"

interface MgtvChannelResp {
  code: number
  msg: string
  data: Record<string, {
    moduleTitle?: string
    DSLList?: {
      data?: {
        items?: {
          name?: string
          title?: string
          subName?: string
          thumbTitle?: string
          updateInfo?: string
          rightCorner?: string
          videoUrl?: string
          jumpId?: string | number
          childId?: string | number
        }[]
      }
    }[]
  }>
}

async function fetchMgtvModule(vclassId: string, moduleTitle: string) {
  const url = `https://dc.bz.mgtv.com/dynamic/v1/channel/index/empty_cna/pcweb-9.0.8/10/1000000/empty_ticket/0/1/${vclassId}`
  const raw = await myFetch<any>(url, {
    responseType: "json",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.mgtv.com/",
    },
  })

  const resp: MgtvChannelResp = typeof raw === "string" ? JSON.parse(raw) : raw
  const mods = Object.values(resp?.data || {})
  const targetMod = mods.find(m => m.moduleTitle === moduleTitle) || mods[2]
  const items = targetMod?.DSLList?.[1]?.data?.items || []

  return items.map((item, index) => {
    const title = item.name || item.title || ""
    const jumpId = item.jumpId || item.childId || index
    const url = item.videoUrl || `https://www.mgtv.com/b/${jumpId}.html`
    const info = item.updateInfo || item.rightCorner
    const hover = item.subName || item.thumbTitle

    return {
      id: jumpId,
      title,
      url,
      extra: {
        info,
        hover,
        tag: item.rightCorner,
      },
    }
  })
}

export default defineSource({
  "mgtv-tv": async () => fetchMgtvModule("187", "热播剧集"),
  "mgtv-variety": async () => fetchMgtvModule("186", "王牌节目"),
})
