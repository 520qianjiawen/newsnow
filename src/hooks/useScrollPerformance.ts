import { useEffect, useRef } from "react"

const SCROLL_STOP_DELAY = 150

/**
 * 检测页面滚动状态，用于动态调整视觉效果性能
 * 滚动时会添加 'scrolling' 类到 body，停止后会添加 'scrolling--stopped' 类
 * @param elementRef 可选的滚动元素引用，如果未提供则监听 window
 */
export function useScrollPerformance(elementRef?: React.RefObject<HTMLElement>) {
  const isScrollingRef = useRef(false)
  const scrollTimerRef = useRef<NodeJS.Timeout>(undefined)
  const rafRef = useRef<number>(undefined)
  const lastScrollTopRef = useRef(0)

  useEffect(() => {
    const targetElement = elementRef?.current || window
    const isWindow = targetElement === window

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = isWindow ? window.scrollY : (targetElement as HTMLElement).scrollTop
        const delta = Math.abs(scrollTop - lastScrollTopRef.current)
        lastScrollTopRef.current = scrollTop

        // 只有滚动量较大时才触发状态变化
        if (delta > 2 && !isScrollingRef.current) {
          isScrollingRef.current = true
          if (!document.body.classList.contains("scrolling")) {
            document.body.classList.add("scrolling")
          }
          document.body.classList.remove("scrolling--stopped")
        }

        // 清除之前的计时器
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current)
        }

        // 设置停止检测计时器
        scrollTimerRef.current = setTimeout(() => {
          if (isScrollingRef.current) {
            isScrollingRef.current = false
            document.body.classList.remove("scrolling")
            if (!document.body.classList.contains("scrolling--stopped")) {
              document.body.classList.add("scrolling--stopped")
            }

            // 短暂延迟后移除 stopping 状态
            setTimeout(() => {
              if (!isScrollingRef.current) {
                document.body.classList.remove("scrolling--stopped")
              }
            }, 300)
          }
        }, SCROLL_STOP_DELAY)
      })
    }

    // 使用 passive 事件监听器提升滚动性能
    if (isWindow) {
      window.addEventListener("scroll", handleScroll, { passive: true })
    } else {
      (targetElement as HTMLElement).addEventListener("scroll", handleScroll, { passive: true })
    }

    // 初始状态
    document.body.classList.add("scrolling--stopped")

    return () => {
      if (isWindow) {
        window.removeEventListener("scroll", handleScroll)
      } else {
        (targetElement as HTMLElement).removeEventListener("scroll", handleScroll)
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }

      // 清理添加的类
      document.body.classList.remove("scrolling", "scrolling--stopped")
    }
  }, [elementRef])
}
