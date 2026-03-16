import type { HTMLProps, PropsWithChildren } from "react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { defu } from "defu"
import { useMount } from "react-use"
import { useSetAtom } from "jotai"
import { useOverlayScrollbars } from "./useOverlayScrollbars"
import type { UseOverlayScrollbarsParams } from "./useOverlayScrollbars"
import { goToTopAtom } from "~/atoms"
import { $ } from "~/utils"
import "./style.css"

type Props = HTMLProps<HTMLDivElement> & UseOverlayScrollbarsParams
const defaultScrollbarParams: UseOverlayScrollbarsParams = {
  options: {
    scrollbars: {
      autoHide: "scroll",
    },
  },
  defer: true,
}

export function OverlayScrollbar({ disabled, children, options, events, defer, className, ...props }: PropsWithChildren<Props>) {
  const ref = useRef<HTMLDivElement>(null)
  const disableOverlayScrollbars = useMemo(() => {
    if (disabled || typeof window === "undefined") return !!disabled
    return window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches
  }, [disabled])
  const scrollbarParams = useMemo(() => defu<UseOverlayScrollbarsParams, Array<UseOverlayScrollbarsParams> >({
    options,
    events,
    defer,
  }, defaultScrollbarParams), [options, events, defer])

  const [initialize, instance] = useOverlayScrollbars(scrollbarParams)

  useMount(() => {
    if (!disableOverlayScrollbars) {
      initialize({
        target: ref.current!,
        cancel: {
          // 如果浏览器原生滚动条是覆盖在元素上的，则取消初始化
          nativeScrollbarsOverlaid: true,
        },
      })
    }
  })

  useEffect(() => {
    if (ref.current) {
      if (instance && !instance.state().destroyed) {
        ref.current.classList.add("scrollbar-hidden")
      } else {
        ref.current.classList.remove("scrollbar-hidden")
      }
    }
  }, [instance])

  return (
    <div ref={ref} {...props} className={$("overflow-auto scrollbar-hidden", className)}>
      {/* 只能有一个 element */}
      <div>{children}</div>
    </div>
  )
}

export function GlobalOverlayScrollbar({ children, className, ...props }: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  const ref = useRef<HTMLDivElement>(null)
  const isTicking = useRef(false)
  const scrollTopRef = useRef(0)
  const lastOkRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const disableOverlayScrollbars = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches
  }, [])
  const setGoToTop = useSetAtom(goToTopAtom)
  const scrollStateTimerRef = useRef<NodeJS.Timeout>(undefined)

  const isScrollingRef = useRef(false)
  const onScroll = useCallback((e: Event) => {
    const el = e.target as HTMLElement
    scrollTopRef.current = el.scrollTop

    // 滚动性能优化：滚动时降低视觉效果复杂度
    if (!isScrollingRef.current) {
      isScrollingRef.current = true
      if (!document.body.classList.contains("scrolling")) {
        document.body.classList.add("scrolling")
      }
      document.body.classList.remove("scrolling--stopped")
    }

    // 清除之前的滚动状态计时器
    if (scrollStateTimerRef.current) {
      clearTimeout(scrollStateTimerRef.current)
    }

    // 设置滚动停止检测计时器
    scrollStateTimerRef.current = setTimeout(() => {
      if (isScrollingRef.current) {
        isScrollingRef.current = false
        document.body.classList.remove("scrolling")
        if (!document.body.classList.contains("scrolling--stopped")) {
          document.body.classList.add("scrolling--stopped")
        }

        // 短待延迟后移除 stopping 状态
        setTimeout(() => {
          if (!isScrollingRef.current) {
            document.body.classList.remove("scrolling--stopped")
          }
        }, 300)
      }
    }, 150)

    if (isTicking.current) return
    isTicking.current = true
    frameRef.current = window.requestAnimationFrame(() => {
      isTicking.current = false
      const ok = scrollTopRef.current > 100
      if (ok !== lastOkRef.current) {
        lastOkRef.current = ok
        setGoToTop({
          ok,
          el,
          fn: () => el.scrollTo({ top: 0, behavior: "smooth" }),
        })
      }
    })
  }, [setGoToTop])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (scrollStateTimerRef.current) {
        clearTimeout(scrollStateTimerRef.current)
        scrollStateTimerRef.current = undefined
      }
      // 清理滚动状态类
      document.body.classList.remove("scrolling", "scrolling--stopped")
    }
  }, [])

  const [initialize, instance] = useOverlayScrollbars({
    options: {
      scrollbars: {
        autoHide: "scroll",
      },
    },
    defer: true,
  })

  useMount(() => {
    const el = ref.current
    if (el) {
      const ok = el.scrollTop > 100
      lastOkRef.current = ok
      setGoToTop({
        ok,
        el,
        fn: () => el.scrollTo({ top: 0, behavior: "smooth" }),
      })
    }
    if (el && !disableOverlayScrollbars) {
      initialize({
        target: el,
        cancel: {
          nativeScrollbarsOverlaid: true,
        },
      })
    }
    if (el) {
      ref.current?.addEventListener("scroll", onScroll, { passive: true })
      return () => {
        el?.removeEventListener("scroll", onScroll)
      }
    }
  })

  useEffect(() => {
    if (ref.current) {
      if (instance && !instance.state().destroyed) {
        ref.current?.classList.add("scrollbar-hidden")
      } else {
        ref.current.classList.remove("scrollbar-hidden")
      }
    }
  }, [instance])

  return (
    <div ref={ref} {...props} className={$("overflow-auto scrollbar-hidden", className)}>
      <div>{children}</div>
    </div>
  )
}
