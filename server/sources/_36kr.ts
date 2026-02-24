import type { NewsItem } from "@shared/types"
import { load } from "cheerio"
import dayjs from "dayjs/esm"
import crypto from "node:crypto"

const commonHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
}

const b64tou8a = (str: string) => Uint8Array.from(Buffer.from(str, 'base64'))
const b64tohex = (str: string) => Buffer.from(str, 'base64').toString('hex')
const s256 = (s1: Uint8Array, s2: string) => {
  const sha = crypto.createHash('sha256')
  sha.update(s1)
  sha.update(s2)
  return sha.digest('hex')
}

const solveWafChallenge = (cs: string) => {
  const c = JSON.parse(Buffer.from(cs, 'base64').toString())
  const prefix = b64tou8a(c.v.a)
  const expect = b64tohex(c.v.c)

  for (let i = 0; i < 10000000; i++) {
    const hash = s256(prefix, i.toString())
    if (hash === expect) {
      c.d = Buffer.from(i.toString()).toString('base64')
      break
    }
  }
  return Buffer.from(JSON.stringify(c)).toString('base64')
}

let wafTokenCache: { token: string; expires: number } | null = null

async function getWafToken() {
  if (wafTokenCache && wafTokenCache.expires > Date.now()) {
    return wafTokenCache.token
  }

  const rootUrl = 'https://www.36kr.com'
  const res1 = await fetch(rootUrl, { headers: commonHeaders })
  const html = await res1.text()

  const $ = load(html)
  const wafScript = $('script').text()
  let payload = wafScript.match(/atob\('(.*?)'\)\),/)?.[1]
  if (!payload && wafScript.includes('_wafchallengeid')) {
    payload = wafScript.match(/cs="(.*?)",c/)?.[1]
  }

  if (!payload) return null

  const response = solveWafChallenge(payload)

  const res2 = await fetch(rootUrl, {
    headers: { ...commonHeaders, Cookie: `_wafchallengeid=${response};` },
    redirect: 'manual',
  })

  let cookies = res2.headers.get('set-cookie') || ''
  if (Array.isArray(cookies)) cookies = cookies.join(';')
  const wafTokenId = cookies.split(';')
    .find(c => c.trim().startsWith('_waftokenid='))
    ?.split('=')[1]

  if (wafTokenId) {
    wafTokenCache = { token: wafTokenId, expires: Date.now() + 1000 * 60 * 5 }
  }

  return wafTokenId
}

const quick = defineSource(async () => {
  const token = await getWafToken()
  const headers: Record<string, string> = { ...commonHeaders }
  if (token) headers.Cookie = `_waftokenid=${token};`

  const baseURL = "https://www.36kr.com"
  const url = `${baseURL}/newsflashes`
  const res = await fetch(url, { headers })
  const response = await res.text()

  const $ = load(response)
  const news: NewsItem[] = []
  const $items = $(".newsflash-item")
  $items.each((_, el) => {
    const $el = $(el)
    const $a = $el.find("a.item-title")
    const url = $a.attr("href")
    const title = $a.text()
    const relativeDate = $el.find(".time").text()
    if (url && title && relativeDate) {
      news.push({
        url: `${baseURL}${url}`,
        title,
        id: url,
        extra: {
          date: parseRelativeDate(relativeDate, "Asia/Shanghai").valueOf(),
        },
      })
    }
  })

  return news
})

const renqi = defineSource(async () => {
  const token = await getWafToken()
  const headers: Record<string, string> = {
    ...commonHeaders,
    "Referer": "https://www.freebuf.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  }
  if (token) headers.Cookie = `_waftokenid=${token};`

  const baseURL = "https://36kr.com"
  const formatted = dayjs().format("YYYY-MM-DD")
  const url = `${baseURL}/hot-list/renqi/${formatted}/1`

  const res = await fetch(url, { headers })
  const response = await res.text()

  const $ = load(response)
  const articles: NewsItem[] = []

  // 单条新闻选择器
  const $items = $(".article-item-info")

  $items.each((_, el) => {
    const $el = $(el)

    // 标题和链接
    const $a = $el.find("a.article-item-title.weight-bold")
    const href = $a.attr("href") || ""
    const title = $a.text().trim()

    const description = $el.find("a.article-item-description.ellipsis-2").text().trim()

    // 作者
    const author = $el.find(".kr-flow-bar-author").text().trim()

    // 热度
    const hot = $el.find(".kr-flow-bar-hot span").text().trim()

    if (href && title) {
      articles.push({
        url: href.startsWith("http") ? href : `${baseURL}${href}`,
        title,
        id: href.slice(3), // 简化处理
        extra: {
          info: `${author}  |  ${hot}`,
          hover: description,
        },
      })
    }
  })
  return articles
})

export default defineSource({
  "36kr": quick,
  "36kr-quick": quick,
  "36kr-renqi": renqi,
})
