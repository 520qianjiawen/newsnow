import { fixedColumnIds, metadata } from "@shared/metadata"
import { Link } from "@tanstack/react-router"
import { currentColumnIDAtom } from "~/atoms"

export function NavBar() {
  const currentId = useAtomValue(currentColumnIDAtom)

  return (
    <nav className="main-navigation" aria-label="新闻分类">
      {fixedColumnIds.map(columnId => (
        <Link
          key={columnId}
          to="/c/$column"
          params={{ column: columnId }}
          className={$(
            "main-navigation__link",
            currentId === columnId && "main-navigation__link--active",
          )}
        >
          {metadata[columnId].name}
        </Link>
      ))}
    </nav>
  )
}
