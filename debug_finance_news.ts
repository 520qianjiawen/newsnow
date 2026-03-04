import { myFetch } from "./server/utils/fetch"
import { rss2json } from "./server/utils/rss2json"

globalThis.myFetch = myFetch
globalThis.defineRSSSource = (url: string) => {
  return async () => {
    const data = await rss2json(url)
    return data?.items?.map(i => ({
      id: i.id || i.link,
      title: i.title,
      url: i.link,
      extra: {
        date: i.created,
        info: i.author || i.category?.[0],
      },
    })) || []
  }
}
globalThis.defineSource = (o: any) => o

async function testFinanceNews() {
  const { default: financeSource } = await import("./server/sources/finance")
  const newsGetter = (financeSource as any)["finance-news"]
  if (typeof newsGetter === "function") {
    const data = await newsGetter()
    console.log("News data:", JSON.stringify(data.slice(0, 3), null, 2))
  }
}

testFinanceNews()
