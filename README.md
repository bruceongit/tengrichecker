# TengriChecker

Static claim catalogue (Astro), published by the SCHIFFY team. `npm install`, then `npm run dev` or `npm run build`. Use `npm run preview` to inspect the built site.

## Site structure
- `/`: searchable catalogue, case cards and individual claims, with case/finding filters.
- `/case/schiffy-fleet`: one SCHIFFY response with the strongest evidence up front and all 11 claims in expandable sections.
- `/check/<slug>`: legacy redirect to the matching expanded claim on its case page.
- `/evidence/launches`: interactive public dataset of 1,400 other launches.
- `/about`: authorship, methods and corrections contact.

Private `evidence/EVIDENCE.md` and the pre-redesign backup are outside `public/` and are not part of the static build. Deploy only `dist/`, never the workspace or private evidence folder. The existing raw public launch downloads are unchanged; one known offensive symbol is masked in the rendered table.

## Deployment
Production is the `tengrichecker` project in Vercel's `grand-arena` team, at `https://tengrichecker.com`.
Run `powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1` from this workspace. It builds Astro, copies only `dist/` into a fresh `.deploy/` staging directory, links that directory to the project, and deploys to production. Never run a Vercel source deployment from the workspace root. The staging directories stay local for inspection and are excluded from version control.

## Add a ruling
Add one Markdown file to `src/content/checks/`. Its filename becomes the claim anchor on the case page. Frontmatter:
`title`, `claim`, `quote` (his exact words), `rating`, `order`, `summary`, `sources`.
Optional: `case` (defaults to `schiffy-fleet`), `reviewed`, `featured`, `followUp`.
Use `followUp: true` when the quote was supplied separately and does not appear in the main post; the page will explicitly mark its source link as pending.

Ratings: `"true"`, `mostly-true`, `mixture`, `misleading`, `unproven`, `no-evidence` (displayed as No proof shown), `"false"`, `opinion`.

## Add a case
Add an entry to `cases` in `src/lib/site.ts`, then set `case:` on its rulings.
Cases with claims automatically appear on the homepage and in the case filter. Each gets a case page; the SCHIFFY case uses `src/components/SchiffyResponse.astro` for its longer narrative. Add only sourced cases, not placeholder accusations.

## Before launch
The main post and corrections contact (`bruce@Moku.gg`) are configured in `src/lib/site.ts`. Original links for the supplied follow-up quotes remain pending. Personal wallet lists, ledger disclosures and team-side address links are excluded from the public case. Private link-test scope and reproducibility limits remain explicit. Findings are dated to the November 2, 2026 evidence snapshot.

## Corrections
Change the ruling, then add a dated line to the corrections log in `src/pages/about.astro`.

## Presentation
The interface uses a black background and white text (dark mode), with square edges, heavy headings and plain-language verdicts. Color is used for explicit error/unsupported labels, the evidence graphs, and the original tweet embed (shown without a grayscale filter). `src/components/LaunchTimeline.astro` derives the 431 pre-SCHIFFY points directly from the public launch data; its 350 full-pattern flags reflect the review snapshot, not necessarily exits before SCHIFFY. The holdings comparison is in `src/components/HoldingsChart.astro`. Both periods use a 0–100M scale. The publisher bar is removed; authorship remains in the footer, About page.

Display labels: Right, Mostly right, Partly wrong, Misleading, Not verified, No proof shown, Wrong, Opinion. The content keys and underlying evidence ratings are unchanged.

The `team-denial` rating displays “False — team response” for the ownership and extraction accusations. It carries no numeric evidence rating: the denial remains separate from the blockchain findings and their stated limits.
