# Task 6,7,8,9 — Public pages (tools list/detail, categories/category/top-tools, blog list/post, submit/contact/privacy/terms/404)

## Agent
full-stack-developer (public pages)

## Scope
Build the remaining public-facing pages on top of the already-built schema, shared components, and API routes. Did NOT modify the home page, layout, shared components, or API routes. Did NOT touch the admin panel.

## Files created
- `src/components/visit-button.tsx` — client component; anchor that opens the tool website in a new tab and fire-and-forgets a POST to `/api/tools/[slug]/click` (keepalive: true) for click tracking.
- `src/components/tools-list-view.tsx` — client component; reusable filter bar (search + category/pricing/sort Selects) + grid of `<ToolCard>` + shadcn `<Pagination>` + Skeletons + empty state. Reads/writes URL search params via `useSearchParams`/`router.push` so filters are shareable. Accepts `fixedCategorySlug` (for /category/[slug]) and SSR-provided `initialData` so the first render is SEO-friendly; only refetches when filter state actually changes.
- `src/app/(site)/tools/page.tsx` — server shell with `buildMetadata`. SSR-fetches the first page of approved tools + categories, wraps `<ToolsListView>` in `<Suspense>`, includes `<AdSlot position="tools_list_top">` and `tools_list_bottom`.
- `src/app/(site)/tools/[slug]/page.tsx` — server component, `revalidate = 60`. `generateMetadata` with SoftwareApplication JSON-LD; calls `notFound()` if missing/not approved. Breadcrumb, header Card with VisitButton, tags, related tools (up to 4 same-category, excluding current), `<AdSlot>` at top/middle/bottom, `<JsonLd>`.
- `src/app/(site)/categories/page.tsx` — server, `getCategoriesWithCounts()` grid.
- `src/app/(site)/category/[slug]/page.tsx` — server shell with `generateMetadata`, `notFound()` if category missing, SSR-fetches first page scoped to category, renders the same `<ToolsListView>` with `fixedCategorySlug`. `<AdSlot position="category_top">`.
- `src/app/(site)/top-tools/page.tsx` — server, top 50 approved tools by clicksCount desc, ranked `<ol>` with medal styling for the top 3.
- `src/app/(site)/blog/page.tsx` — server, published articles grid; empty state. `<AdSlot position="blog_list_top">`.
- `src/app/(site)/blog/[slug]/page.tsx` — server, `generateMetadata` with BlogPosting JSON-LD. Breadcrumb, header, optional cover, content via `<div className="article-content" dangerouslySetInnerHTML>`, back-to-blog button, `<AdSlot position="blog_post_bottom">`, `<JsonLd>`.
- `src/app/(site)/submit/page.tsx` + `src/app/(site)/submit/submit-form.tsx` — server shell with `buildMetadata` + aside ("how it works" / tips / privacy). Client form with react-hook-form + zod, character counter, sonner toasts, success Card.
- `src/app/(site)/contact/page.tsx` + `src/app/(site)/contact/contact-form.tsx` — server shell + client form (name/email/message) with sidebar (email, submissions-routing note, response time).
- `src/app/(site)/privacy/page.tsx` — server static prose via `article-content`. Covers no analytics on visitors, admin-placed ad units (AdSense), no selling data, contact/submission storage.
- `src/app/(site)/terms/page.tsx` — server static prose via `article-content`. "as is", third-party content not our responsibility, acceptable use, submissions subject to review.
- `src/app/not-found.tsx` — 404 page wrapping SiteHeader + SiteFooter for consistency; centered Card with "404" + "Back to home".

## Key decisions
- Built one reusable client component (`ToolsListView`) shared by `/tools` and `/category/[slug]` to stay DRY.
- Filter state in URL search params so results are shareable/refreshable.
- Used `useWatch` from react-hook-form (instead of `watch`) to keep the React Compiler happy.
- Used plain `<img>` for admin-provided blog cover URLs to avoid next/image remote-domain config.
- Verified every route via curl + exercised the click/contacts/submissions endpoints end-to-end.

## Verification (curl)
| Route | Status |
| --- | --- |
| `/` | 200 |
| `/tools` | 200 |
| `/tools/nova-chat` | 200 |
| `/tools?q=writer` | 200 |
| `/tools?category=chat&pricing=Free` | 200 |
| `/categories` | 200 |
| `/category/writing` | 200 |
| `/category/writing?pricing=Free` | 200 |
| `/category/audio` | 200 |
| `/top-tools` | 200 |
| `/blog` | 200 |
| `/blog/the-10-best-ai-writing-tools-in-2025` | 200 |
| `/submit` | 200 |
| `/contact` | 200 |
| `/privacy` | 200 |
| `/terms` | 200 |
| `/some-missing-page` | 404 (renders not-found.tsx) |
| `POST /api/tools/nova-chat/click` | 200 |
| `POST /api/contacts` | 200 |
| `POST /api/submissions` | 200 |

## Lint
0 errors, 2 warnings — both in pre-existing files (`prisma/seed.ts`, `src/lib/slug.ts`) that this agent should not touch.

## Known issues / non-blocking
- Site-wide pre-existing quirk: titles render as `"Foo | Aivora | Aivora"` because the root layout applies a `%s | Aivora` template AND `buildMetadata()` already appends ` | Aivora`. The home page has the same quirk, so for consistency I left it. Out of scope per the "do not modify shared components / layout" rule.
- Dev log contains older "different slug names ('id' !== 'slug')" errors from before this task; after the latest `✓ Compiled`, all my routes return 200 and the log shows no new errors.
