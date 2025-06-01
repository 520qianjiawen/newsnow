import { columnIds, metadata } from "@shared/metadata"
import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import { currentColumnIDAtom } from "~/atoms"

export function NavBar() {
  const currentId = useAtomValue(currentColumnIDAtom)
  return (
    <span className={clsx([
      "flex p-3 rounded-2xl bg-primary/1",
      "shadow shadow-primary/20 hover:shadow-primary/50 transition-shadow-500",
    ])}
    >
      {columnIds.map(columnId => (
        <Link
          key={columnId}
          to="/c/$column"
          params={{ column: columnId }}
          className={clsx(
            "text-sm px-2 hover:(bg-primary/10 rounded-md)",
            currentId === columnId ? "color-primary font-bold" : "op-70 dark:op-90",
          )}
        >
          {metadata[columnId].name}
        </Link>
      ))}
    </span>
  )
}
