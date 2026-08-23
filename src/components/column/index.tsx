import type { FixedColumnID } from "@shared/types"
import { Helmet } from "react-helmet-async"
import { OG_IMAGE, SITE_NAME, getColumnSeo } from "@shared/seo"
import { ForexTicker, StockTicker } from "../header/ticker"
import { NavBar } from "../navbar"
import { Dnd } from "./dnd"
import { currentColumnIDAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  useEffect(() => {
    setCurrentColumnID(id)
  }, [id, setCurrentColumnID])

  const { title: pageTitle, description: pageDescription, canonical: canonicalUrl } = getColumnSeo(id)

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      {/* 这是一个为 SEO 准备的视觉隐藏的 H1 标签 */}
      <h1 className="sr-only">{pageTitle}</h1>

      <div className="mobile-market-strip">
        <div className="mobile-market-strip__grid">
          <StockTicker />
          <ForexTicker />
        </div>
      </div>
      <div className="mobile-navigation">
        <NavBar />
      </div>
      {id === currentColumnID && <Dnd />}
    </>
  )
}
