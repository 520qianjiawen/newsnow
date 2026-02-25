import { Buffer } from "node:buffer"
import crypto from "node:crypto"
import type { NewsItem } from "@shared/types"
import { load } from "cheerio"

const commonHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
}
const rootUrl = "https://36kr.com"

const b64tou8a = (str: string) => Uint8Array.from(Buffer.from(str, "base64"))
const b64tohex = (str: string) => Buffer.from(str, "base64").toString("hex")
function s256(s1: Uint8Array, s2: string) {
  const sha = crypto.createHash("sha256")
  sha.update(s1)
  sha.update(s2)
  return sha.digest("hex")
}

function solveWafChallenge(cs: string) {
  const c = JSON.parse(Buffer.from(cs, "base64").toString())
  const prefix = b64tou8a(c.v.a)
  const expect = b64tohex(c.v.c)

  for (let i = 0; i < 10000000; i++) {
    const hash = s256(prefix, i.toString())
    if (hash === expect) {
      c.d = Buffer.from(i.toString()).toString("base64")
      break
    }
  }
  return Buffer.from(JSON.stringify(c)).toString("base64")
}

let wafTokenCache: { token: string, expires: number } | null = null

async function getWafToken() {
  if (wafTokenCache && wafTokenCache.expires > Date.now()) {
    return wafTokenCache.token
  }

  try {
    const res1 = await fetch(rootUrl, { headers: commonHeaders })
    if (!res1.ok) return null

    const html = await res1.text()
    const $ = load(html)
    const wafScript = $("script").toArray().map(el => $(el).text()).join("\n")

    let payload = wafScript.match(/atob\('(.*?)'\)\),/)?.[1]
    if (!payload && wafScript.includes("_wafchallengeid")) {
      payload = wafScript.match(/cs="(.*?)",c/)?.[1]
    }
    if (!payload) return null

    const response = solveWafChallenge(payload)
    const res2 = await fetch(rootUrl, {
      headers: { ...commonHeaders, Cookie: `_wafchallengeid=${response};` },
      redirect: "manual",
    })

    const cookies = res2.headers.get("set-cookie") || ""
    const wafTokenId = cookies.split(";")
      .find(c => c.trim().startsWith("_waftokenid="))
      ?.split("=")[1]

    if (wafTokenId) {
      wafTokenCache = { token: wafTokenId, expires: Date.now() + 1000 * 60 * 5 }
    }
    return wafTokenId || null
  } catch {
    return null
  }
}

const quick = defineSource(async () => {
  const token = await getWafToken()
  const headers: Record<string, string> = { ...commonHeaders }
  if (token) headers.Cookie = `_waftokenid=${token};`

  const baseURL = rootUrl
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

export default defineSource({
  "36kr": quick,
  "36kr-quick": quick,
  "36kr-renqi": quick,
})
