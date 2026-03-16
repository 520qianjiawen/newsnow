import type { MaybePromise } from "@shared/type.util"
import { $fetch } from "ofetch"
import { clsx } from "clsx"
import { isMobile } from "react-device-detect"
import type { SourceID } from "@shared/types"

export { clsx as $ }

export function safeParseString(str: any) {
  try {
    return JSON.parse(str)
  } catch {
    return ""
  }
}

export class Timer {
  private timerId?: any
  private start!: number
  private remaining: number
  private callback: () => MaybePromise<void>

  constructor(callback: () => MaybePromise<void>, delay: number) {
    this.callback = callback
    this.remaining = delay
    this.resume()
  }

  pause() {
    clearTimeout(this.timerId)
    this.remaining -= Date.now() - this.start
  }

  resume() {
    this.start = Date.now()
    clearTimeout(this.timerId)
    this.timerId = setTimeout(this.callback, this.remaining)
  }

  clear() {
    clearTimeout(this.timerId)
  }
}

export const myFetch = $fetch.create({
  timeout: 15000,
  retry: 0,
  baseURL: "/api",
})

export function isiOS() {
  return [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod",
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export function toAppUrl(url: string, id: SourceID) {
  if (!isMobile) return url
  if (id === "douyin") {
    const wordId = url.split("/").pop()
    if (wordId) {
      return `snssdk1128://search/detail?id=${wordId}`
    }
  }
  if (id === "weibo") {
    return url.replace("https://weibo.com", "sinaweibo://browser")
  }
  if (id.startsWith("bilibili")) {
    return url.replace("https://www.bilibili.com", "bilibili://")
  }
  if (id === "zhihu") {
    return url.replace("https://www.zhihu.com", "zhihu://")
  }
  return url
}
