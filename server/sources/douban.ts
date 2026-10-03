import { myFetch } from "#/utils/fetch"
import { defineSource } from "#/utils/source"

interface HotSubjectRes {
  category: string
  tags: []
  items: SubjectItem[]
  recommend_tags: []
  total: number
  type: string
}

interface SubjectItem {
  rating: {
    count: number
    max: number
    star_count: number
    value: number
  }
  title: string
  pic: {
    large: string
    normal: string
  }
  is_new: boolean
  uri: string
  episodes_info?: string
  card_subtitle: string
  type: string
  id: string
}

async function fetchDoubanHot(kind: "movie" | "tv") {
  const baseURL = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/${kind}`
  const res: HotSubjectRes = await myFetch(baseURL, {
    headers: {
      Referer: "https://movie.douban.com/",
      Accept: "application/json, text/plain, */*",
    },
  })

  return res.items.map((item) => {
    let info = ""
    if (kind === "tv") {
      const ratingText = item.rating?.value ? `★${item.rating.value}` : ""
      const statusText = item.episodes_info || ""
      const tags = item.card_subtitle?.split(" / ")?.slice(2, 3)?.join(" ") || ""
      info = [ratingText, statusText, tags].filter(Boolean).join(" · ") || item.card_subtitle
    } else {
      const ratingText = item.rating?.value ? `★${item.rating.value} ` : ""
      info = ratingText + item.card_subtitle.split(" / ").slice(0, 3).join(" / ")
    }

    return {
      id: item.id,
      title: item.title,
      url: `https://movie.douban.com/subject/${item.id}`,
      extra: {
        info,
        hover: item.card_subtitle,
      },
    }
  })
}

export default defineSource({
  "douban-movie": async () => fetchDoubanHot("movie"),
  "douban-tv": async () => fetchDoubanHot("tv"),
  "douban": async () => fetchDoubanHot("movie"),
})
