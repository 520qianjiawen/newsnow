import type { FixedColumnID } from "@shared/types"
import { Helmet } from "react-helmet-async"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { currentColumnIDAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  useEffect(() => {
    setCurrentColumnID(id)
  }, [id, setCurrentColumnID])

  const isHottest = id === "hottest"
  const pageTitle = isHottest
    ? "今日国内外热门新闻与实时热搜 | NewsNow"
    : `${metadata[id].name}实时热搜排行 | NewsNow`

  const pageDescription = isHottest
    ? "NewsNow 全球实时热搜新闻排行，汇聚各大平台实时热点，提供快速高效的阅读体验。"
    : `为您精选最新的${metadata[id].name}热点新闻、实时热搜与行业动态，快速掌握${metadata[id].name}资讯。`

  const canonicalUrl = (id === "hottest" || id === "focus")
    ? "https://news.asg.li/"
    : `https://news.asg.li/c/${id}`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      <div className="flex justify-center md:hidden mb-6">
        <NavBar />
      </div>
      {id === currentColumnID && <Dnd />}
    </>
  )
}
