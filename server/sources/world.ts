export default defineSource({
  reuters: defineRSSSource("https://feeds.reuters.com/reuters/topNews"),
  bbc: defineRSSSource("http://feeds.bbci.co.uk/news/world/rss.xml"),
  apnews: defineRSSHubSource("/apnews/topics/apf-topnews"),
  aljazeera: defineRSSSource("https://www.aljazeera.com/xml/rss/all.xml"),
  guardian: defineRSSSource("https://www.theguardian.com/world/rss"),
})
