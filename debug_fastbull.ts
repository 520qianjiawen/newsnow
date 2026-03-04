import * as cheerio from "cheerio"
import { myFetch } from "./server/utils/fetch"

globalThis.myFetch = myFetch

async function testFastbull() {
  const baseURL = "https://www.fastbull.com"
  const url = `${baseURL}/cn/express-news`
  try {
    const html: any = await myFetch(url, { responseType: "text" })
    console.log("Fetched HTML length:", html?.length)
    if (!html) return

    const $ = cheerio.load(html)
    const $main = $(".news-list")
    console.log("Found .news-list count:", $main.length)

    const news: any[] = []
    $main.each((_, el) => {
      const a = $(el).find(".title_name")
      const url = a.attr("href")
      const titleText = a.text()
      const title = titleText.match(/【(.+)】/)?.[1] ?? titleText
      const date = $(el).attr("data-date")

      console.log(`Found item: URL=${url}, Date=${date}`)
      console.log(`TitleText=${titleText}`)

      if (url && title && date) {
        news.push({
          url: baseURL + url,
          title: title.length < 4 ? titleText : title,
          id: url,
          pubDate: Number(date),
        })
      }
    })
    console.log("Parsed news items:", news.length)
  } catch (error) {
    console.error("Test failed:", error)
  }
}

testFastbull()
