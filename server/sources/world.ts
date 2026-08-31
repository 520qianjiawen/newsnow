const reutersFeeds = [
  "https://news.google.com/rss/search?q=source:Reuters+when:24h&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
]

async function fetchReuters() {
  for (const url of reutersFeeds) {
    const data = await rss2json(url)
    if (data?.items.length) {
      return data.items.map(item => ({
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
