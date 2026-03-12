import type { NewsItem } from "@shared/types"
import { describe, expect, it } from "vitest"
import { buildFeedXml, getNewsItemTimestamp, toAbsoluteUrl } from "./feed"

describe("getNewsItemTimestamp", () => {
  it("prefers pubDate when it can be parsed", () => {
    const item = {
      id: "1",
      title: "Hello",
      url: "https://example.com/hello",
      pubDate: "2026-03-12T08:00:00Z",
      extra: {
        date: 0,
      },
    } satisfies NewsItem

    expect(getNewsItemTimestamp(item, 123)).toBe(Date.parse("2026-03-12T08:00:00Z"))
  })

  it("falls back to extra.date and then fallback timestamp", () => {
    const item = {
      id: "1",
      title: "Hello",
      url: "https://example.com/hello",
      pubDate: "not-a-date",
      extra: {
        date: "2026-03-12T09:00:00Z",
      },
    } satisfies NewsItem

    expect(getNewsItemTimestamp(item, 123)).toBe(Date.parse("2026-03-12T09:00:00Z"))
    expect(getNewsItemTimestamp({ ...item, extra: undefined }, 123)).toBe(123)
  })
})

describe("feed xml helpers", () => {
  it("resolves relative links against the current origin", () => {
    expect(toAbsoluteUrl("/feed.xml", "https://news.asg.li")).toBe("https://news.asg.li/feed.xml")
  })

  it("escapes xml-sensitive fields in the generated feed", () => {
    const xml = buildFeedXml({
      title: "News & Now",
      description: "Latest <stories>",
      siteUrl: "https://news.asg.li",
      feedUrl: "https://news.asg.li/feed.xml",
      items: [{
        title: "Item <1>",
        link: "https://news.asg.li/story?a=1&b=2",
        guid: "guid&1",
        description: "Source \"Alpha\"",
        pubDate: Date.parse("2026-03-12T10:00:00Z"),
      }],
    })

    expect(xml).toContain("News &amp; Now")
    expect(xml).toContain("Latest &lt;stories&gt;")
    expect(xml).toContain("Item &lt;1&gt;")
    expect(xml).toContain("guid&amp;1")
    expect(xml).toContain("story?a=1&amp;b=2")
  })
})
