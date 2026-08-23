import type { FixedColumnID } from "@shared/types"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { isFixedColumnId, normalizeColumnParam } from "@shared/seo"
import { Column } from "~/components/column"

export const Route = createFileRoute("/c/$column")({
  component: SectionComponent,
  params: {
    parse: params => ({
      column: normalizeColumnParam(params.column),
    }),
    stringify: params => params,
  },
  beforeLoad: ({ params }) => {
    if (params.column === "hottest" || params.column === "focus") {
      throw redirect({ to: "/", replace: true })
    }
    if (!isFixedColumnId(params.column)) {
      throw notFound()
    }
  },
})

function SectionComponent() {
  const { column } = Route.useParams()
  return <Column id={column as FixedColumnID} />
}
