import type { PropsWithChildren } from "react"
import type { SourceID } from "@shared/types"
import type { BaseEventPayload, ElementDragType } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge"
import { createPortal } from "react-dom"
import { useThrottleFn } from "ahooks"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { motion } from "framer-motion"
import { isMobile } from "react-device-detect"
import { DndContext } from "../common/dnd"
import { useSortable } from "../common/dnd/useSortable"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import type { ItemsProps } from "./card"
import { CardWrapper } from "./card"
import { getCardTheme } from "./card-theme"
import { AdCard } from "~/components/common/adsense"
import { currentSourcesAtom } from "~/atoms"

/** Insert one in-feed ad after every N source cards. Sparse enough not to crowd the feed. */
const AD_INTERVAL = 4
const AnimationDuration = 200

const itemVariants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
  },
}

const itemTransition = {
  type: "tween" as const,
  duration: AnimationDuration / 1000,
}

export function Dnd() {
  const [items, setItems] = useAtom(currentSourcesAtom)
  const [parent] = useAutoAnimate({ duration: AnimationDuration })
  useEntireQuery(items)

  if (!items.length) return null

  return (
    <DndWrapper items={items} setItems={setItems}>
      {/* Use vertical scrolling instead of horizontal on mobile. */}
      <OverlayScrollbar defer className="overflow-y-auto">
        <motion.ol
          className="grid w-full gap-6"
          ref={parent}
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: 0.1,
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {items.flatMap((id, index) => {
            const nodes = [
              <motion.li
                key={id}
                className={sources[id].cardSpan === 2 ? "md:col-span-2" : undefined}
                transition={itemTransition}
                variants={itemVariants}
              >
                <SortableCardWrapper id={id} index={index} />
              </motion.li>,
            ]
            if ((index + 1) % AD_INTERVAL === 0) {
              nodes.push(
                <InFeedAd key={`ad-${Math.floor(index / AD_INTERVAL)}`} />,
              )
            }
            return nodes
          })}
        </motion.ol>
      </OverlayScrollbar>
      {isMobile && (
        <div className="flex justify-center">
          {/* Update hint message to reflect vertical scrolling on mobile */}
          <span className="text-sm text-gray-500 text-center">上下滑动查看更多</span>
        </div>
      )}
    </DndWrapper>
  )
}

function DndWrapper({ items, setItems, children }: PropsWithChildren<{
  items: SourceID[]
  setItems: (items: SourceID[]) => void
}>) {
  const onDropTargetChange = useCallback(({ location, source }: BaseEventPayload<ElementDragType>) => {
    const traget = location.current.dropTargets[0]
    if (!traget?.data || !source?.data) return
    const closestEdgeOfTarget = extractClosestEdge(traget.data)
    const fromIndex = items.indexOf(source.data.id as SourceID)
    const toIndex = items.indexOf(traget.data.id as SourceID)
    if (fromIndex === toIndex || fromIndex === -1 || toIndex === -1) return
    const update = reorderWithEdge({
      list: items,
      startIndex: fromIndex,
      indexOfTarget: toIndex,
      closestEdgeOfTarget,
      // Use vertical axis for both single and multi column layouts. Cards are stacked vertically on mobile.
      axis: "vertical",
    })
    setItems(update)
  }, [items, setItems])
  // 避免动画干扰
  const { run } = useThrottleFn(onDropTargetChange, {
    leading: true,
    trailing: true,
    wait: AnimationDuration,
  })
  const { el } = useAtomValue(goToTopAtom)
  return (
    <DndContext onDropTargetChange={run} autoscroll={el ? { element: el } : undefined}>
      {children}
    </DndContext>
  )
}

function InFeedAd() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <motion.li
      transition={itemTransition}
      variants={itemVariants}
    >
      <AdCard onUnfilled={() => setVisible(false)} />
    </motion.li>
  )
}

function CardOverlay({ id, index }: { id: SourceID, index: number }) {
  return (
    <div
      className={$(
        "news-card flex flex-col p-4 backdrop-blur-5",
        !isiOS() && "rounded-2xl",
      )}
      style={getCardTheme(sources[id].color, index)}
    >
      <div className="news-card__header mx-2">
        <div
          className="news-card__brand rounded-full bg-cover"
          style={{
            backgroundImage: `url(/icons/${id.split("-")[0]}.png)`,
          }}
        />
        <div className="news-card__meta">
          <span className="news-card__source text-xl font-bold">
            {sources[id].name}
          </span>
          <div className="news-card__subline">
            <span className="news-card__updated text-xs op-70">拖拽中</span>
          </div>
        </div>
        <div className="news-card__actions">
          {sources[id]?.title && (
            <span className="news-card__badge">
              {sources[id].title}
            </span>
          )}
          <div className="news-card__toolbar flex text-lg">
            <button
              type="button"
              className={$("news-card__tool i-ph:dots-six-vertical-duotone", "cursor-grabbing")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableCardWrapper({ id, index }: ItemsProps) {
  const {
    isDragging,
    setNodeRef,
    setHandleRef,
    OverlayContainer,
  } = useSortable({ id })

  useEffect(() => {
    if (OverlayContainer) {
      OverlayContainer!.className += $(`bg-base`, !isiOS() && "rounded-2xl")
    }
  }, [OverlayContainer])

  return (
    <>
      <CardWrapper
        ref={setNodeRef}
        id={id}
        index={index}
        isDragging={isDragging}
        setHandleRef={setHandleRef}
      />
      {OverlayContainer && createPortal(<CardOverlay id={id} index={index} />, OverlayContainer)}
    </>
  )
}
