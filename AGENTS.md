<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- The app deploys to GitHub Pages (static-only hosting) via `.github/workflows/deploy.yml`: `vite.config.ts` prerenders `/` to static HTML and sets the Vite `base` from `GITHUB_REPOSITORY`; CI output is `.output/public` (Lovable sandbox builds use `dist/client` instead). Keep the app fully client-side — no server functions or SSR-dependent data may be added without changing this deploy strategy.
- Backend is the user's own external Supabase project (not Lovable Cloud): all data access goes through `supabase-js` with per-user RLS; AI calls run in Supabase Edge Functions with a user-provided Gemini key.
