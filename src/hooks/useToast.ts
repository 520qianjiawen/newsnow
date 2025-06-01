import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { toastAtom } from "~/atoms"
import type { ToastItem } from "~/atoms/types"

export function useToast() {
  const setToastItems = useSetAtom(toastAtom)
  return useCallback((msg: string, props?: Omit<ToastItem, "id" | "msg">) => {
    setToastItems(prev => [
      {
        msg,
        id: Date.now(),
        ...props,
      },
      ...prev,
    ])
  }, [setToastItems])
}
