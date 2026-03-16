import React, { Suspense } from "react"
import "~/styles/globals.css"
import "virtual:uno.css"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { isMobile } from "react-device-detect"
import { Header } from "~/components/header"
import { GlobalOverlayScrollbar } from "~/components/common/overlay-scrollbar"

const Footer = React.lazy(() => import("~/components/footer").then(mod => ({ default: mod.Footer })))
const Toast = React.lazy(() => import("~/components/common/toast").then(mod => ({ default: mod.Toast })))
const SearchBar = React.lazy(() => import("~/components/common/search-bar").then(mod => ({ default: mod.SearchBar })))
// Note: we previously imported AdSense to insert explicit ad slots. Since we now rely on Google Auto Ads to place ads automatically, the AdSense component is unused and thus removed.

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  const nav = Route.useNavigate()
  nav({
    to: "/",
  })
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
      <GlobalOverlayScrollbar
        className={$([
          !isMobile && "px-4",
          "h-full overflow-x-auto",
          "md:(px-10)",
          "lg:(px-20)",
        ])}
      >
        <header
          className={$([
            "grid items-center py-4 px-5",
            "lg:(py-6)",
            "sticky top-0 z-10",
            !isMobile && "backdrop-blur-md",
          ])}
          style={{
            gridTemplateColumns: "1fr auto 1fr",
          }}
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
      </GlobalOverlayScrollbar>
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
