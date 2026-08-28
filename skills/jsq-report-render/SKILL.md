---
name: jsq-report-render
description: Render kept, branded Juniper Square (JSQ) report deliverables in the output window — tearsheets, fundraise action reports, entity org charts, portfolio/pipeline summaries, financial briefs. A thin brand layer driven by vetted reference renders. NOT for ephemeral in-chat answers or throwaway inline widgets. Consumer skills own report content; this skill owns the brand layer, the reference examples, and the render contract.
---

# JSQ report render

The brand layer for kept JSQ report deliverables. Consumer skills (investor-tearsheet, offering-action-report, entity-org-chart, …) own *what* the report says. This skill owns *how it looks* and *how it ships*.

Two principles:

1. **Examples drive layout; conventions drive the invariants.** Match the vetted reference render for the report type (Step 1) — it carries structure, spacing, and component composition. Then apply the conventions below for what an example can't teach by inspection (semantic colors, links, money formatting, flags). Don't re-derive the look from a generic design system.
2. **The body is authored once.** The same markup ships to either render target (file or artifact). The target adds an envelope, never a second renderer.

**The example governs layout, never data volume.** A reference shows one instance of a pattern (one prospect contact, one position row, one bio) only to demonstrate its *shape* — it is not a cap. Render every real record the data returns. Repeat the example's primitive as needed (comma-separated contacts, more rows, more cards); never drop, summarize, or pick one representative because the example showed one. The only sanctioned cap is the funnel top-10 + "+N more" tail. If an example field has no data for this subject, omit it — don't invent a placeholder — but never omit data that exists because the example didn't have room.

---

## Scope — when this skill fires (and when it doesn't)

This skill is for a **kept, branded report deliverable rendered in the output window** — a file the user opens/prints/sends, or a persistent artifact they re-open. The deciding test is **keepability, not visual type.**

- **Fires:** "tearsheet for [LP]", "action report for [offering]", "org chart for [fund]", "build me a portfolio summary I can send the IC" — anything the user will keep, print, or share.
- **Does NOT fire:** ephemeral in-chat answers, quick glanceable visuals, or throwaway inline widgets. "Show me my investors on a map" asked as a quick look is an inline chat answer — **not** this skill. (The *same* map as a kept, sendable report *would* route here — keepability decides, not format.)

A glance → answer in chat; a deliverable → this skill.

---

## Render contract (every JSQ report follows these 3 steps)

### Step 1 — Open the matching reference example (do this first)

Read the reference render for the report type and match its structure, columns, spacing, and component composition:

| Report type | Reference |
| --- | --- |
| Investor tearsheet | `references/example-tearsheet.html` |
| Offering / fundraise action report | `references/example-action-report.html` |
| Entity org chart | `references/example-org-chart.html` |

The example is the layout source of truth — it already encodes the brand. Adapt sections to the data; **do not treat it as a fill-in template** (don't copy its names/numbers; keep its structure and primitives). If no example covers the report type, fall back to **on-demand** loading of `mcp__visualize__read_me` for the needed module (`mockup`/`data_viz` for cards+tables, `chart`/`data_viz` for charts, `diagram` for Mermaid) — then build and propose the result as a new reference. `read_me` is only the no-example fallback, keeping common renders cheap.

**Sections are open-ended; the example is a floor, not a ceiling.** A consumer skill may add, drop, reorder, or invent sections the reference never shows — e.g. a market summary, a location map, a fee-schedule table. When that happens, **compose the new section from the existing primitives** (label + card, stat tiles, a table, left-ruled blocks, bars) so it inherits the brand automatically; no new example or `read_me` is needed for a new arrangement of primitives. Carry the invariants (1px rules, ≤500 weight, neutral-600 text floor, linked objects, `DD Mmm YYYY`, provenance). Only reach for `read_me` when the section needs a **visual primitive the conventions don't cover** — e.g. a map, a heatmap, a gauge. For a map specifically: the file envelope blocks CDN/JS, so a static target gets an **embedded image** (base64 raster or inline SVG); an interactive/tiled map is only viable in the **artifact** target (CDN allowlist) — pick the render target accordingly, and always label the section and cite the map's data source.

### Step 2 — Apply the brand patch + conventions

Build the body from the example, then enforce the brand overrides and conventions below. Self-contained: inline `<style>`, inline SVG icons, tokens inlined from `references/tokens.css` (the sandbox blocks external CSS).

### Step 3 — Pick the render target (file or artifact)

Both are output-window deliverables; pick by whether the data should refresh:

- **Static file** (`present_files`) — a fixed snapshot to print/send. Default for tearsheets, org charts, one-off briefs.
- **Persistent artifact** (`create_artifact`) — when the user will re-open it and the data changes (fundraise status, pipeline). Supports live re-pull via `window.cowork.callMcpTool` and the view's Reload.

Never the inline chat widget — the glance case (see Scope).

---

## JSQ brand patch (overrides on the example)

1. **Lines 1px**, `var(--color-neutral-300)` (`#E5E4E0`); step to `-400` (`#C6C5C0`) for heavier dividers. No hairlines.
2. **No text below `--color-neutral-600`** (`#72716E`). 500 and lighter are border/disabled tones only. Body `-800` (`#2C2C2A`); headings `-900` (`#201F1C`).
3. **Flat white page.** No outer card/shadow/tint around the whole report; tints and borders only on inner elements.
4. **Slim brand top bar** — JSQ logo (18–20px) + `Report type · DD Mmm YYYY` muted, above the title.
5. **Weight cap 500.** Two weights only, 400 / 500, in content. Never 600/700 — the sole exception is the top-bar **Beta** chrome pill at 600 (see #7).
6. **Dates `DD Mmm YYYY`**; spell out "Juniper Square" (never "JSQ") in rendered output.
7. **Beta tag.** Fixed chrome on every report during the beta — a **filled primary-700** pill (`background:#005868`, white text `#FFFFFF`, uppercase 10.5px, `font-weight:600`, `letter-spacing:0.06em`, `border-radius:999px`, `padding:3px 6px`, `vertical-align:middle`, label "Beta"), the **last item in the top-bar meta line — rightmost, after the date** — joined with the standard header dot (see Header & title). The 600 weight and primary-700 brand teal are allowed because this is **top-bar chrome, not content** — it never collides with an in-content data signal. Refine the pill here only; it propagates to every report.

Inline the full ramps from `references/tokens.css`; don't hand-shrink the palette.

---

## Style guide / conventions

The examples carry layout; this carries the component specs + invariants an example can't teach by inspection — a seed that extends as report types are added, **not** a finished style system. Hexes are the inlined values of `references/tokens.css`.

**Header & title.** Brand top bar: `display:flex; justify-content:space-between; align-items:center; padding:8px 0 16px; border-bottom:1px solid #E5E4E0; margin-bottom:20px` — JSQ logo 18px on the left; on the right, a muted meta line (12px/500/#72716E) reading `Report type · DD Mmm YYYY · ` then the fixed filled **Beta** pill as the last/rightmost element (see brand patch #7). **Every header separator uses one dot primitive** — `<span style="margin:0 7px;">·</span>` — top-bar meta, subhead, and workspace/assignee line alike (looser than the in-body `·`). Title block: `h1` 22px/500/#201F1C, line-height 1.2; subhead 13px/#72716E; workspace/assignee line 12px/500/#72716E. When a subject image resolves it sits 52px round to the left of the title block; when none resolves, omit it and the title block sits flush left (no initials, no placeholder circle — see Header image resolution).

**Page & containerization.** Flat white page; centered wrapper `max-width:880px; padding:28px 24px`. Card = `1px solid #E5E4E0; border-radius:8px`, white. Detail (k/v) card padding `4px 16px`; table card padding `2px 16px`. Inner rows separated by `1px #E5E4E0`; the **last row's inner border is removed**. No outer card/shadow/tint around the whole page.

**Stat strip.** 2–5 tiles, `gap:12px`; tile `background:#F7F6F5; border-radius:8px; padding:1rem`. Label 13px/#72716E, value 24px/500/#201F1C. **A 3rd line is allowed** — an 11.5px/#72716E muted sub for context (e.g. "across 3 funds", "9 stale > 1 yr"). Round every value.

**Section headings vs field labels.** A **section heading** ("Meeting details", "Executive summary") is at least body size — 14px/500/#201F1C, margin-bottom 8px — so it reads as a heading, not a caption. **Field / column / tile labels** are smaller: 11–11.5px/500/#72716E. Don't size section headings below body. Labels never below weight 500 / neutral-600; sentence case throughout; eyebrows muted neutral-600.

**Links.** `a, .lnk { color:#017989; font-weight:500; text-decoration:none; }`. **Link only when a URL is supplied** — by the consumer skill, or as an external address the data already carries (org website, email, LinkedIn). Do **not** auto-link JSQ objects (LP/account, contacts, entities/positions, offerings, prospects, related firms): with no URL they render as **plain text at weight 500** — identifying, not clickable. Never guess or construct a URL.

**Badges / pills / flags.** Light fill + dark text from one ramp, 11–11.5px/500, radius 8–999px. **Semantic colors are reserved:** hot = red `#FCE9E9`/`#B61C3A`; cold = blue/informative `#EEF5FC`/`#086290`; neutral/none = gray `#F2F1EF`/`#504F4C`; positive / closed / countersigned = teal `#D6EEF0`/`#015965`; warning / stuck / stale = amber `#FCECDC`/`#A0301E`. **Don't reuse a semantic color for a non-signal** — e.g. the current-step pill is teal, never blue, so it never reads as "cold." (Sole exception: the **Beta** chrome pill's brand teal, which lives only in the top-bar chrome, never in content.)

**Tables.** Containerized in a card; numeric columns right-aligned + `tabular-nums`; header row 11.5px/500/#72716E with a `#D6D4CE` bottom rule; row rules `#E5E4E0`, last row removed.

**Progress stepper.** Phase segments: done = teal `#017989`, current = light `#67CCCE`, not-started = `#F2F1EF`. Legend is **color swatches + phase order** (done / current / not-started), not a "filled = complete" text legend.

**Icons.** Inline SVG only, path data copied verbatim from an open line set (Lucide / Feather), ~15px, `stroke:#72716E`, `aria-hidden`. Never an icon font (CDN-blocked in the file envelope); never freehand-drawn.

**Emphasis.** Prose emphasis uses `<strong>` but is capped at weight 500 (`b, strong { font-weight:500 }`).

**History / timeline.** Entries are left-ruled blocks: `border-left:2px solid #E5E4E0; padding-left:14px`, most-recent first. Human-authored notes verbatim; auto-events as one-liners.

**People bios.** Render the bio in **body** style (14px/#201F1C/line-height 1.5) and the per-person **sources** line in the **caption** style (11.5px/#72716E). The bio *content* (role/authority, background, hot buttons, last touch) is owned by the consumer skill — this skill only fixes the two type styles.

**Provenance / sources (everywhere, not just bios).** **Ownership split:** this skill owns provenance *placement and caption styling*, plus one invariant — **Juniper Square is never shown as a source in the rendered deliverable** (below). *Which* non-JSQ sources a fact or bio names ("public LinkedIn", a news outlet, "illustrative") is **consumer-skill content**. Any fact that isn't plainly from the Juniper Square record — synthesized, externally researched, web-searched, estimated, or illustrative — carries its provenance via one of three placements, smallest sufficient one wins:

- **Inline caption** — a muted `#72716E` tail on the value, for a single fact: `$4.2B · public` or `Mar 2026 · public`. Use in snapshot/profile `kv` rows and stat-tile sub-lines.
- **Per-item sources line** — the 11.5px/#72716E caption under a block, when an item carries non–Juniper-Square sourcing: people bios, an exec-summary bullet that leans on web/external research, a map ("Mapbox").
- **Footer footnote** — the one closing 11px/#72716E line that names the **non–Juniper-Square** source set and explicitly flags anything **illustrative / fabricated** in a draft.

Rules:

- **Never cite Juniper Square — or "the connector" — as a source, anywhere.** Juniper Square record data is the report's baseline; it is left uncited (no "Sources: Juniper Square connector", no per-field "· CRM"). This includes connector-derived detail like CRM notes, positions, and activity log.
- **Cite only non–Juniper-Square facts** — external research, web search, public-source data, synthesized estimates, illustrative placeholders. If *every* fact came from Juniper Square, **omit the sources footnote entirely** rather than writing one that names Juniper Square.
- Exec-summary and other prose claims that lean on external/synthesized data get a citation — inline or via the bullet's caption.
- **Never invent a source to dress up fabricated data** — if a value is illustrative, say so rather than attributing it. Citations use the muted caption style; they never compete with body text.

**Money.** ≥$1B `$X.XB`, ≥$1M `$X.XM`, ≥$1k `$XXXk`, else `$X`; trim `.0`; omit entirely if none (never `$0`); group by currency, never sum across.

**Stale / age metrics.** Days-in-step with a leading `~` when estimated; when implausibly large or only a `modifiedAt` fallback exists, show the since-date instead of a raw count. Stuck (>7d in step) / stale (>14d no activity) → amber badges.

**Funnel.** Row layout is **name · bar · amount** (e.g. `grid-template-columns: 180px 1fr 150px`). The **stage count sits inside the bar** — a left-padded label on the fill (`min-width` ~40px for short bars; white text on the fill). The **right column carries only the dollar total + a muted committed/requested sublabel, right-aligned**, so every stage's total lines up down one right edge — never stack the count above the amount there. Rows are **click-to-expand**: clicking a stage toggles a subrow list of its investors (name · entity · amount; chevron rotates on open), collapsed by default. **Cap subrows at the top 10 by amount** (committed for Completed, requested for in-flight) with a "+N more" tail when a stage exceeds 10.

**Test-data banner.** Multiple placeholder signals (dummy emails, fictional names, extreme dates, placeholder tax IDs) → one warn-soft line at the top; never a multi-bullet detail block.

**Header image resolution.** Person → headshot (web chain LP site → public LinkedIn); **organization → favicon pulled from its website**. **If neither resolves, render no avatar at all** — omit the circle entirely and let the title block sit flush left. **Never an initials monogram or any placeholder.** Embed a found image as base64 for the file target (a remote `<img>` won't print). The favicon also renders inline (~14px) next to the Website field. **This no-avatar rule is header-only** — People-section avatars keep the 38px initials monogram (`#EAF4F4` / `#005868`) when no headshot resolves.

**Omit-empty, never placeholder.** Drop an empty row, tile, or column entirely — never render "None on file", "N/A", or a bare "—". (Money omit-`$0` is the special case.)

---

## Reference examples (registry)

Each is a vetted render. Keep them current; they ARE the layout spec.

- `references/example-tearsheet.html` — Ostmere Family Office (quarterly-review variant). Covers: brand bar + Beta tag, **flush-left title with no header avatar (the no-image header case)**, snap stats, meeting details (icon labels), org snapshot, investor-profile tiles, committed-by-fund bars, performance table, fundraising pipeline, people (**38px monogram in the row when no headshot — the row rule, distinct from the header rule**), relevant staff, profile data (plain JSQ objects + linked website/email/LinkedIn), left-ruled relationship-history blocks, source footnote (non-JSQ only).
- `references/example-action-report.html` — Tarnwick Ventures Fund II (persistent artifact w/ live refresh). Covers: KPI strip, concentration callout, click-to-expand funnel (committed/requested sublabels), action cards (hot=red), the in-flight subscription-steps table (Investor · Requested · Current step [pill + phase stepper + ministep] · Days-in-step ~ · Last update · Status flag), and the data-room table (Investor · Stage · Last access · Signal; hot=red / cold=blue / never=gray). Both tables containerized.
- `references/example-org-chart.html` — Mossvale Fund master-feeder (Mermaid). Covers: per-fund card + type badge, `flowchart TB` with ownership % on every edge, node classes (fund / feeder / SPV / operating-company dashed / investor / GP), footer roll-up tile, legend.

---

## Envelopes

### Static file
Wrap the body in a standalone doc (`@page` letter, print break rules, white page), write to outputs, `present_files`, one-line note. No external `<script src>`/fonts/fetches — inline or hand-roll (SVG/CSS) so it survives the sandbox and print. Mermaid/Chart.js from CDN render only in a browser/artifact, not the file preview.

### Persistent artifact
`create_artifact` with the body; list the connector tools the page calls via `window.cowork.callMcpTool`. Mermaid/Chart.js are allowed from the artifact CDN allowlist. Author a meaningful default (un-clicked) state; interactivity layers on top. Keep a snapshot fallback if a live call fails.

---

## Self-check

- [ ] Step 1 done — matched the report type's reference example (or loaded `read_me` only because none fit).
- [ ] Scope correct — this is a kept deliverable, not a glanceable in-chat answer.
- [ ] All rules ≥1px; no text below neutral-600; flat white page; weight ≤500; `DD Mmm YYYY`; "Juniper Square" spelled out.
- [ ] Semantic colors right: hot=red, cold=blue, neutral=gray, stuck/stale=amber.
- [ ] Beta pill last/rightmost in the top-bar meta line (filled primary-700 #005868 / white, 600 weight; chrome only); header separators use the shared 7px dot.
- [ ] Header avatar: shown only if a real image resolves, else omitted (flush-left title, no monogram). People rows keep the 38px monogram when no headshot.
- [ ] Links only where a URL is supplied; JSQ objects with no URL are plain 500 text, not links.
- [ ] Tables containerized; numeric columns tabular + right-aligned; stat cards may carry a 3rd context line.
- [ ] Funnel stages click-to-expand; subrows capped at top 10 by amount with a "+N more" tail.
- [ ] Money formatted per convention; no `$0`; currencies not summed.
- [ ] All real records rendered (no count capped to the example except the funnel top-10 tail).
- [ ] Juniper Square / "the connector" never cited as a source; only non–Juniper-Square facts carry provenance; footnote omitted if everything is from Juniper Square; illustrative data flagged, never falsely attributed.
- [ ] File target: no external `<script src>`/fonts; default state reads on paper. Artifact target: live calls degrade to snapshot.

---

## What this skill does not own

- Report content, sections, analysis — the consumer skill owns it.
- Generic design-system breadth beyond the examples + conventions — loaded on-demand from `visualize` only when no example fits.
- Whether a request is a deliverable vs a glance — see Scope; consumer skill / user intent decides.
