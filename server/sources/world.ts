const reutersFeeds = [
  "https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=site:reuters.com+when:24h&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
]

function isReutersItem(item: { title?: string, source?: string }) {
  const source = typeof item.source === "string" ? item.source : ""
  const title = item.title ?? ""
  return /reuters/i.test(source) || /-\s*reuters$/i.test(title)
}

async function fetchReuters() {
  for (const url of reutersFeeds) {
    const data = await rss2json(url)
    const items = (data?.items ?? []).filter(isReutersItem)
    if (items.length) {
      return items.map(item => ({
        title: item.title.replace(/\s+-\s+Reuters$/i, "").trim() || item.title,
        url: item.link,
        id: item.link,
        pubDate: item.created,
      }))
    }
  }
  throw new Error("Cannot fetch rss data")
}

export default defineSource({
  reuters: fetchReuters,
  bbc: defineRSSSource("http://feeds.bbci.co.uk/news/world/rss.xml"),
  apnews: defineRSSHubSource("/apnews/topics/apf-topnews"),
  aljazeera: defineRSSSource("https://www.aljazeera.com/xml/rss/all.xml"),
  guardian: defineRSSSource("https://www.theguardian.com/world/rss"),
})
