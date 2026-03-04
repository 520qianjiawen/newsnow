export default defineSource({
  reuters: defineRSSSource("https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&hl=en-US&gl=US&ceid=US:en"),
  bbc: defineRSSSource("http://feeds.bbci.co.uk/news/world/rss.xml"),
  apnews: defineRSSHubSource("/apnews/topics/apf-topnews"),
  aljazeera: defineRSSSource("https://www.aljazeera.com/xml/rss/all.xml"),
  guardian: defineRSSSource("https://www.theguardian.com/world/rss"),
})
