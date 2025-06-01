import { useBeforeUnload, useMount } from "react-use"

export function useOnReload(fn?: () => Promise<void> | void, fallback?: () => Promise<void> | void) {
  useBeforeUnload(() => {
    localStorage.setItem("quitTime", Date.now().toString())
    return false
  })

  useMount(() => {
    const _ = localStorage.getItem("quitTime")
    const quitTime = _ ? Number(_) : 0
    if (!Number.isNaN(quitTime) && Date.now() - quitTime < 1000) {
      fn?.()
    } else {
      fallback?.()
    }
  })
}
