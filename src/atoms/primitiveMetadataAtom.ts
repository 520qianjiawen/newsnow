import type { PrimitiveAtom } from "jotai"
import type { FixedColumnID, PrimitiveMetadata, SourceID } from "@shared/types"
import type { Update } from "./types"

function createPrimitiveMetadataAtom(
  key: string,
  initialValue: PrimitiveMetadata,
  preprocess: ((stored: PrimitiveMetadata) => PrimitiveMetadata),
): PrimitiveAtom<PrimitiveMetadata> {
  const getInitialValue = (): PrimitiveMetadata => {
    const item = localStorage.getItem(key)
    try {
      if (item) {
        const stored = JSON.parse(item) as PrimitiveMetadata
        verifyPrimitiveMetadata(stored)
        return preprocess({
          ...stored,
          action: "init",
        })
      }
    } catch { }
    return initialValue
  }
  const baseAtom = atom(getInitialValue())
  const derivedAtom = atom(get => get(baseAtom), (get, set, update: Update<PrimitiveMetadata>) => {
    const nextValue = update instanceof Function ? update(get(baseAtom)) : update
    if (nextValue.updatedTime > get(baseAtom).updatedTime) {
      set(baseAtom, nextValue)
      localStorage.setItem(key, JSON.stringify(nextValue))
    }
  })
  return derivedAtom
}

const initialMetadata = typeSafeObjectFromEntries(typeSafeObjectEntries(metadata)
  .filter(([id]) => fixedColumnIds.includes(id as any))
  .map(([id, val]) => [id, val.sources] as [FixedColumnID, SourceID[]]))

const financePreferredIds: SourceID[] = ["xueqiu-hotstock", "jin10"]
const clsPrefix = "cls-"
const wallstreetcnPrefix = "wallstreetcn-"
const techFirstId: SourceID = "36kr-quick"
const techLastIds: SourceID[] = ["36kr-renqi", "producthunt"]
const techAnchorId: SourceID = "ithome"
const techAfterAnchorIds: SourceID[] = ["sspai", "juejin"]

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

export function preprocessMetadata(target: PrimitiveMetadata) {
  return {
    data: {
      ...initialMetadata,
      ...typeSafeObjectFromEntries(
        typeSafeObjectEntries(target.data)
          .filter(([id]) => initialMetadata[id])
          .map(([id, s]) => {
            if (id === "focus") return [id, s.filter(k => sources[k]).map(k => sources[k].redirect ?? k)]
            const oldS = s.filter(k => initialMetadata[id].includes(k)).map(k => sources[k].redirect ?? k)
            const newS = initialMetadata[id].filter(k => !oldS.includes(k))
            const merged = [...oldS, ...newS]
            if (id === "finance") return [id, withFinancePreferredFirst(merged)]
            if (id === "tech") return [id, withTechPreferredOrder(merged)]
            return [id, merged]
          }),
      ),
    },
    action: target.action,
    updatedTime: target.updatedTime,
  } as PrimitiveMetadata
}

export const primitiveMetadataAtom = createPrimitiveMetadataAtom("metadata", {
  updatedTime: 0,
  data: initialMetadata,
  action: "init",
}, preprocessMetadata)
