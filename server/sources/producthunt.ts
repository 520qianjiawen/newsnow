import process from "node:process"
import type { NewsItem } from "@shared/types"

const FEED_URL = "https://www.producthunt.com/feed"

function stripHtml(html?: string) {
  if (!html) return ""
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function fetchFromApi(apiToken: string) {
  const query = `
    query {
      posts(first: 30, order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            votesCount
            url
            slug
          }
        }
      }
    }
  `

  const response: any = await myFetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  const news: NewsItem[] = []
  const posts = response?.data?.posts?.edges || []

  for (const edge of posts) {
    const post = edge.node
    if (post.id && post.name) {
      news.push({
        id: post.id,
        title: post.name,
        url: post.url || `https://www.producthunt.com/posts/${post.slug}`,
        extra: {
          info: ` △︎ ${post.votesCount || 0}`,
          hover: post.tagline,
        },
      })
    }
  }

  return news
}

async function fetchFromFeed() {
  const data = await rss2json(FEED_URL)
  if (!data?.items.length) throw new Error("Cannot fetch producthunt feed")
  return data.items.flatMap((item) => {
    const url = typeof item.link === "string" ? item.link : ""
    const title = item.title?.trim()
    if (!url || !title) return []
    const hover = stripHtml(item.description)
    return [{
      id: url,
      title,
      url,
      pubDate: item.created,
      extra: hover ? { hover } : undefined,
    } satisfies NewsItem]
  })
}

export default defineSource(async () => {
  const apiToken = process.env.PRODUCTHUNT_API_TOKEN
  if (apiToken) {
    try {
      const news = await fetchFromApi(apiToken)
      if (news.length) return news
    } catch {
      // token missing permissions or API error — use public feed
    }
  }
  return fetchFromFeed()
})
