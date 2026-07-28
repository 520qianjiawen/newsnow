import { Link } from "@tanstack/react-router"
import { useIsFetching } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { NavBar } from "../navbar"
import { ForexTicker, StockTicker } from "./ticker"
import { currentSourcesAtom, goToTopAtom } from "~/atoms"

const marketSources = ["finance-indices", "finance-forex"] as const satisfies readonly SourceID[]

function GoTop() {
  const { ok, fn: goToTop } = useAtomValue(goToTopAtom)
  return (
    <button
      type="button"
      title="Go To Top"
      className={$("i-ph:arrow-fat-up-duotone", ok ? "op-50 btn" : "op-0")}
      onClick={goToTop}
    />
  )
}

function Refresh() {
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const sourcesToRefresh = useMemo(
    () => [...new Set<SourceID>([...currentSources, ...marketSources])],
    [currentSources],
  )
  const refreshAll = useCallback(() => refresh(...sourcesToRefresh), [refresh, sourcesToRefresh])

  const isFetching = useIsFetching({
    predicate: (query) => {
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && sourcesToRefresh.includes(id)) || type === "entire"
    },
  })

  return (
    <button
      type="button"
      title="刷新当前栏目及顶部行情"
      aria-label="刷新当前栏目及顶部行情"
      disabled={isFetching > 0}
      className={$("i-ph:arrow-counter-clockwise-duotone btn", isFetching && "animate-spin i-ph:circle-dashed-duotone")}
      onClick={refreshAll}
    />
  )
}

export function Header() {
  return (
    <>
      <span className="app-brand">
        <Link to="/" className="app-brand__link">
          <div className="app-brand__logo" title="NewsNow" style={{ backgroundImage: "url(/icon.svg)" }} />
          <span className="app-brand__wordmark">
            <p>News</p>
            <p className="mt--1">
              <span className="color-primary-6">N</span>
              <span>ow</span>
            </p>
          </span>
        </Link>
      </span>
      <span className="header-center">
        <span className="header-market-layout">
          <div className="header-market-layout__ticker">
            <StockTicker />
          </div>
          <NavBar />
          <div className="header-market-layout__ticker">
            <ForexTicker />
          </div>
        </span>
      </span>
      <span className="header-actions">
        <GoTop />
        <Refresh />
      </span>
    </>
  )
}
