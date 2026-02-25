import { Buffer } from "node:buffer"
import crypto from "node:crypto"
import { load } from "cheerio"
import dayjs from "dayjs/esm/index.js" // try matching how it might resolve

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
  } catch (e) {
    console.error("waf error:", e)
    return null
  }
}

async function renqi() {
  const token = await getWafToken()
  const headers: Record<string, string> = {
    ...commonHeaders,
    Referer: "https://www.freebuf.com/",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  }
  if (token) headers.Cookie = `_waftokenid=${token};`

  const baseURL = rootUrl
  const formatted = dayjs().format("YYYY-MM-DD")
  const url = `${baseURL}/hot-list/renqi/${formatted}/1`
  console.log("fetching:", url)
  const res = await fetch(url, { headers })
  const response = await res.text()

  const $ = load(response)
  const articles: any[] = []

  const $items = $(".article-item-info")
  console.log("Found items:", $items.length)
  if ($items.length === 0) {
    console.log("HTML Start:", response.slice(0, 500))
  }

  $items.each((_, el) => {
    const $el = $(el)

    const $a = $el.find("a.article-item-title.weight-bold")
    const href = $a.attr("href") || ""
    const title = $a.text().trim()

    const description = $el.find("a.article-item-description.ellipsis-2").text().trim()

    const author = $el.find(".kr-flow-bar-author").text().trim()
    const hot = $el.find(".kr-flow-bar-hot span").text().trim()

    if (href && title) {
      articles.push({
        url: href.startsWith("http") ? href : `${baseURL}${href}`,
        title,
        id: href.slice(3),
        extra: {
          info: `${author}  |  ${hot}`,
          hover: description,
        },
      })
    }
  })
  return articles
}

renqi().then(() => console.log("done")).catch(console.error)
