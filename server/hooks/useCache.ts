import process from "node:process"
import { Cache } from "#/database/cache"

export function useCache() {
  try {
    const db = useDatabase()
    if (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== "main") return
    if (process.env.NODE_ENV && process.env.NODE_ENV !== "production") return
    if (db) return new Cache(db)
  } catch (e) {
    logger.error("failed to init database ", e)
  }
}
