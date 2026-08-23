import { expect, it } from "vitest"
import { SITE_ORIGIN, getColumnSeo, isFixedColumnId, normalizeColumnParam } from "@shared/seo"

it("normalizes china to news and keeps other columns", () => {
  expect(normalizeColumnParam("China")).toBe("news")
  expect(normalizeColumnParam("tech")).toBe("tech")
  expect(isFixedColumnId("tech")).toBe(true)
  expect(isFixedColumnId("not-a-column")).toBe(false)
})

it("uses a single homepage title and canonical", () => {
  const home = getColumnSeo("hottest")
  const focus = getColumnSeo("focus")
  expect(home.canonical).toBe(`${SITE_ORIGIN}/`)
  expect(focus.canonical).toBe(`${SITE_ORIGIN}/`)
  expect(home.title).toBe(focus.title)
  expect(home.title).toContain("NewsNow")
})

it("gives column pages unique titles", () => {
  const tech = getColumnSeo("tech")
  expect(tech.canonical).toBe(`${SITE_ORIGIN}/c/tech`)
  expect(tech.title).toContain("科技")
  expect(tech.title).not.toBe(getColumnSeo("hottest").title)
})
