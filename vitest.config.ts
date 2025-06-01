import { defineConfig } from "vitest/config"
import autoImport from "unplugin-auto-import/vite"
import tsconfigPath from "vite-tsconfig-paths"
import { resolveModuleExportNames } from "mlly"

const h3Exports = await resolveModuleExportNames("h3", {
  url: import.meta.url,
})

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts", "shared/**/*.test.ts", "test/**/*.test.ts"],
  },
  plugins: [
    tsconfigPath(),
    // https://github.com/unjs/nitro/blob/v2/src/core/config/resolvers/imports.ts
    autoImport({
      imports: ["vitest", {
        from: "h3",
        imports: h3Exports.filter(n => !/^[A-Z]/.test(n) && n !== "use"),
      }, {
        from: "ofetch",
        imports: ["$fetch", "ofetch"],
      }],
      dirs: ["server/utils"],
      dts: "dist/.nitro/types/nitro-imports.d.ts",
    }),
  ],
})
