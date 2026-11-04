// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Actions sets GITHUB_REPOSITORY ("owner/repo"); the repo name becomes
// the base path so the static build works at <user>.github.io/<repo>/.
// Locally and on Lovable hosting the base stays "/".
const pagesRepo = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  vite: {
    base: pagesRepo ? `/${pagesRepo}/` : "/",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Prerender the only route to static HTML so the app can be hosted on
    // GitHub Pages (static-only hosting). The page is identical for every
    // visitor, so a build-time render is safe.
    pages: [{ path: "/" }],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});
