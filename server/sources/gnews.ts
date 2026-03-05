import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const apikey = "892840a7863fcdca5a18e8793bfef951"
  const url = `https://gnews.io/api/v4/top-headlines?category=world&apikey=${apikey}&lang=zh`

  const response: any = await myFetch(url)
  const articles = response?.articles || []

  const news: NewsItem[] = articles.map((item: any) => ({
    id: item.url,
    title: item.title,
    url: item.url,
    pubDate: item.publishedAt ? new Date(item.publishedAt).valueOf() : Date.now(),
    extra: {
      hover: item.description || item.content,
      info: item.source?.name,
    },
  }))

  return news
})
