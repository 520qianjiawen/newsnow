import { sources } from "./sources"
import { typeSafeObjectEntries, typeSafeObjectFromEntries } from "./type.util"
import type { ColumnID, HiddenColumnID, Metadata, SourceID } from "./types"

export const columns = {
  news: {
    zh: "新闻",
  },
  china: {
    zh: "国内",
  },
  world: {
    zh: "国际",
  },
  tech: {
    zh: "科技",
  },
  finance: {
    zh: "财经",
  },
  focus: {
    zh: "关注",
  },
  realtime: {
    zh: "实时",
  },
  hottest: {
    zh: "最热",
  },
} as const

export const fixedColumnIds = ["focus", "hottest", "realtime", "tech", "news", "world", "finance"] as const satisfies Partial<ColumnID>[]
export const hiddenColumns = Object.keys(columns).filter(id => !fixedColumnIds.includes(id as any)) as HiddenColumnID[]
const financePreferredIds: SourceID[] = ["xueqiu-hotstock", "jin10"]
const clsPrefix = "cls-"
const wallstreetcnPrefix = "wallstreetcn-"
const techFirstId: SourceID = "36kr-quick"
const techLastIds: SourceID[] = ["producthunt"]
const techAnchorId: SourceID = "ithome"
const techAfterAnchorIds: SourceID[] = ["sspai", "juejin"]
const techExcludedIds: SourceID[] = ["36kr-renqi"]
const hottestExcludedIds: SourceID[] = ["producthunt", "hackernews", "steam", "freebuf"]
const realtimeExcludedIds: SourceID[] = ["pcbeta-windows11"]

function withFinancePreferredFirst(items: SourceID[]) {
  const preferred = financePreferredIds.filter(id => items.includes(id))
  let rest = items.filter(id => !preferred.includes(id))

  const hasCls = rest.some(id => id.startsWith(clsPrefix))
  const hasWallstreetcn = rest.some(id => id.startsWith(wallstreetcnPrefix))
  if (hasCls && hasWallstreetcn) {
    const clsItems = rest.filter(id => id.startsWith(clsPrefix))
    const restWithoutCls = rest.filter(id => !id.startsWith(clsPrefix))
    const wallstreetcnIndex = restWithoutCls.findIndex(id => id.startsWith(wallstreetcnPrefix))
    if (wallstreetcnIndex >= 0) {
      rest = [
        ...restWithoutCls.slice(0, wallstreetcnIndex),
        ...clsItems,
        ...restWithoutCls.slice(wallstreetcnIndex),
      ]
    } else {
      rest = restWithoutCls
    }
  }

  return [...preferred, ...rest]
}

function withTechPreferredOrder(items: SourceID[]) {
  const first = items.includes(techFirstId) ? [techFirstId] : []
  const last = techLastIds.filter(id => items.includes(id))
  let middle = items.filter(id => id !== techFirstId && !last.includes(id))
  const moveAfterAnchor = techAfterAnchorIds.filter(id => middle.includes(id))
  middle = middle.filter(id => !moveAfterAnchor.includes(id))
  if (moveAfterAnchor.length) {
    const anchorIndex = middle.indexOf(techAnchorId)
    if (anchorIndex >= 0) {
      middle = [
        ...middle.slice(0, anchorIndex + 1),
        ...moveAfterAnchor,
        ...middle.slice(anchorIndex + 1),
      ]
    } else {
      middle = [...middle, ...moveAfterAnchor]
    }
  }
  return [...first, ...middle, ...last]
}

export const metadata: Metadata = typeSafeObjectFromEntries(typeSafeObjectEntries(columns).map(([k, v]) => {
  switch (k) {
    case "focus":
      return [k, {
        name: v.zh,
        sources: [] as SourceID[],
      }]
    case "hottest":
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources)
          .filter(([id, v]) => v.type === "hottest" && !v.redirect && !hottestExcludedIds.includes(id as SourceID))
          .map(([id]) => id as SourceID),
      }]
    case "realtime":
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources)
          .filter(([id, v]) => v.type === "realtime" && !v.redirect && !realtimeExcludedIds.includes(id as SourceID))
          .map(([id]) => id as SourceID),
      }]
    case "news":
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === "china" && !v.redirect).map(([k]) => k as SourceID),
      }]
    case "finance":
      return [k, {
        name: v.zh,
        sources: withFinancePreferredFirst(typeSafeObjectEntries(sources).filter(([, v]) => v.column === "finance" && !v.redirect).map(([k]) => k as SourceID)),
      }]
    case "tech":
      return [k, {
        name: v.zh,
        sources: withTechPreferredOrder(typeSafeObjectEntries(sources)
          .filter(([id, v]) => v.column === "tech" && !v.redirect && !techExcludedIds.includes(id as SourceID))
          .map(([id]) => id as SourceID)),
      }]
    default:
      return [k, {
        name: v.zh,
        sources: typeSafeObjectEntries(sources).filter(([, v]) => v.column === k && !v.redirect).map(([k]) => k as SourceID),
      }]
  }
}))
