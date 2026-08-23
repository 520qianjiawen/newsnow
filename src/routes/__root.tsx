import React, { Suspense } from "react"
import "~/styles/globals.css"
import "virtual:uno.css"
import { Helmet } from "react-helmet-async"
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { isMobile } from "react-device-detect"
import { Header } from "~/components/header"

const Footer = React.lazy(() => import("~/components/footer").then(mod => ({ default: mod.Footer })))
const Toast = React.lazy(() => import("~/components/common/toast").then(mod => ({ default: mod.Toast })))
const SearchBar = React.lazy(() => import("~/components/common/search-bar").then(mod => ({ default: mod.SearchBar })))

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Helmet>
        <title>页面不存在 | NewsNow</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="text-2xl font-bold">页面不存在</h1>
      <p className="text-sm op-70">你访问的页面没有找到。</p>
      <Link to="/" className="color-primary-6 hover:underline">
        返回首页
      </Link>
    </div>
  )
}

function RootComponent() {
  useOnReload()
  useSync()
  usePWA()
  return (
    <>
      {/*
       * Wrap the entire scrollable layout in a flex container to allow
       * persistent sidebars on large screens. On screens narrower than
       * the xl breakpoint the sidebars are hidden. These sidebars are left empty so that
       * Google Auto Ads can insert advertisements automatically when enabled.
       */}
      <div
        className={$([
          !isMobile && "px-4",
          "h-full overflow-x-hidden overflow-y-auto",
          "md:(px-10)",
          "lg:(px-20)",
        ])}
      >
        <header
          className={$([
            "app-header",
            "sticky top-0 z-10",
            !isMobile && "backdrop-blur-md",
          ])}
        >
          <Header />
        </header>
        <main
          className={$([
            "mt-2",
            "min-h-[calc(100vh-180px)]",
            "md:(min-h-[calc(100vh-175px)])",
            "lg:(min-h-[calc(100vh-194px)])",
          ])}
        >
          <Outlet />
        </main>
        <footer className="py-6 flex flex-col items-center justify-center text-sm text-neutral-500 font-mono">
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </footer>
      </div>
      <Suspense fallback={null}>
        <Toast />
        <SearchBar />
      </Suspense>
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </>
  )
}
