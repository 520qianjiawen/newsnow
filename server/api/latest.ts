export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "s-maxage=60, stale-while-revalidate")
  return {
    v: Version,
  }
})
