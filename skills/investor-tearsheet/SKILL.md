---
name: investor-tearsheet
description: Prep a GP for an LP or prospect interaction with a source-attributed tearsheet. Pulls Juniper Square connector data, scans the contact's public footprint, surfaces fundraising and investment facts, and produces a scannable briefing. Triggers; "tearsheet for [contact]", "LP tearsheet", "pull a tearsheet on [contact]", "prep me for my meeting with [LP]", "GP meeting prep for [contact]", "brief me on [LP]". Standalone-capable; supercharged by the Juniper Square connector and workplace tools.
---

# Investor Tearsheet

Acts as an IR associate prepping the managing partner for an LP or prospect meeting. Pulls relevant context from the Juniper Square connector (CRM/IMS), scans the contact's public footprint and other GP relationships, surfaces key fundraising and investment facts, attributes every data point to its source, and synthesizes a scannable briefing. Standalone-first: runs on web search + user context alone; connectors supercharge, they don't gate.

## Rendering

All visual identity comes from `jsq-report-render` — brand colors, typography, the standard brand-row header (Hard rule 5), and every generic primitive this skill leans on (`.snap-stats`, `ul.bullets`, `.details`, `.tiles`, `.badge`, `table.data`, `.people`, `.hist`, `.footnote`). This skill owns **content only**: which sections exist, what goes in them, analytical framing, and the one domain composite the render kit deliberately does not ship — the **fundraising-pipeline block**, built from `.details` + `.badge`. Do not restate brand tokens or other visual hard rules here; map each section below to a primitive and write the content. PDF export is print-from-artifact, per the render kit.

**Examples-first handoff.** Before rendering, open the kit's `references/example-tearsheet.html` (the Ostmere reference) and match its structure, then hand the body to the render skill for the brand patch + envelope (semantic colors, table containerization, body-vs-caption type styles, header-image resolution). `visualize read_me` is only the on-demand fallback when no example fits.

**No links — override.** This tearsheet deliberately overrides the render-kit "every JSQ object renders as a link" convention. Render every object reference (LP/account, contacts, entities/positions, offerings, prospects, related firms) and every external reference (email, website, LinkedIn) as **plain body text — no href, no link/teal** `.lnk` **styling**.

## Connector coverage caveats

What the Juniper Square connector does **not** expose — never promise these, and omit the section/column rather than guess:

* **Position economics:** positions carry commitment, ownership %, and performance (IRR, TVPI, DPI, RVPI). The connector does **not** return contributions, distributions, unfunded, capital-account/NAV, or MOIC — omit those columns and any cashflow timeline. **Money decode:** `amountCommitted` and other structured money arrive as `{amount, currency, precision}` in **minor units** — divide `amount` by `10^precision` before formatting or aggregating (precision 2 = cents; skipping it overstates every figure by 100×, e.g. a $150M commitment reads as $15B). `amountExpected` on prospects is a separate, pre-formatted string and needs no decode. See `juniper-square-data-model` → "Convert money amounts before showing them."
* **Contact photos:** none. The header image is web-only and person-only (see Header).
* **AUM:** not a connector field, and this skill does **not** source it from paid enrichment (no Preqin). Surface AUM only when it appears in general public/web sources, label it `· public`, and omit the row when unsourced.
* **Contact timestamps:** no contact-record "created / member since," "last activity," or "last modified" — don't show relationship-age or last-touch lines.
* **Extension-field values:** text, integer, float, date, and enum (label) values come through; datetime- and range-typed extension values do not.
* **Misc:** email type (work vs personal), linked employer/referrer entities, and per-currency transaction totals are not exposed — free-text company/referrer name and the aggregate committed amount are.

## Getting Started

When you run this skill, I will:

1. Identify the contact or LP (required).
2. Infer a variant from data shape (see Variants).
3. Pull meeting context — automatically from a matching calendar event when a calendar connector is active — and render Meeting Details when it exists (probe for Goals if empty).
4. Probe for missing context rather than render an empty section.

With nothing connected, the minimum I need is the contact name. I will then ask: "Is this an existing investor or a prospect? Anything specific you want me to know going in?"

## Connectors

| Tier | What's added |
| --- | --- |
| Standalone | Web research only. Probes the user for context. Best for cold prospect lookups. |
| + Juniper Square connector | Positions, prospects, contact roster, internal notes, activity log, profile and extension fields, relationships, referrers, contact URLs. |
| + workplace tools (Gmail / Outlook, Google / Microsoft Calendar, Slack / Teams, Fireflies / Otter, Notion / Confluence) | Recent emails, calendar event with attendees and agenda, internal team chatter, transcript excerpts. Fully autonomous. |

## Variants

The skill picks a variant from data shape. The choice is internal and shapes which sections render and what gets emphasized; it is not printed in the brief. To override per call, the GP says "use \[variant\] template."

| Variant | Inference rule | What's distinct |
| --- | --- | --- |
| First meeting / new prospect | Zero positions and no investment history. | Org-context heavy. Discovery-weighted agenda. No performance tables. |
| LP check-in | At least one active position. Default for any LP with history. | Performance table, recent activity, open items. Prospect block if any in flight. |
| Quarterly / annual review | 2+ positions AND within 30 days of quarter-end. Also fires on explicit "QBR"/"annual review." | Comprehensive performance walk. Benchmarking heavy. |
| Inferred default | Has history but doesn't cleanly fit. | Uses LP check-in template. |
| Other / GP-defined | User invokes "use other template" or supplies a custom agenda framing. | LP check-in scaffolding with a GP-provided agenda framing. Re-ups, secondaries, capital-call disputes, FoF underwriting, etc. |

**Ambiguity handling (default):** If the Juniper Square connector isn't connected, or the record is too thin to pick cleanly, probe the user rather than silently default: "I don't have positions data for this contact. Is this a new prospect, an existing LP I just don't have data on, or something else?"

**Strict-mode opt-in (per call):** "use strict variant inference" suppresses the probe and picks the closest variant by data shape.

## Output Sections

Each section maps to a `jsq-report-render` primitive; this skill specifies the content, not the styling. Source attribution is selective (see below).

* **Header** — render's brand row + title block (Hard rule 5). Contact/LP name in `h1`; type/locale in the subhead; assignee, workspace, or deal context in `.asn`. Two domain additions sit just under the title block: (a) **Test-data banner** — when multiple test-data signals are detected (placeholder emails, dummy phones, fictional names, extreme dates), one warn-soft line: "Multiple test-data signals detected. Verify before relying on numbers." Do not render a multi-bullet detail section. (b) **Header image — person subjects only.** Person subject → headshot via the web chain (LP company site → public LinkedIn), first hit wins; render on a hit, omit silently on a miss. Organization subjects, and any miss → no avatar; the title block sits flush left — no favicon (dropped because it can't be reliably fetched/embedded in the render environment), no initials monogram, no placeholder. A resolved headshot must be **fetched and embedded as base64 at render time** — a live remote `<img>` won't survive print and is blocked in the preview.
* **Snap stats** — `.snap-stats`. Top KPIs (committed, positions, pipeline, top commitment, or similar).
* **Meeting Details** — `.details`. Renders only when meeting context exists. Date/time, location or format, attendees (mark primary LP contact with \*), Goals. When context exists but Goals is empty, probe rather than infer. **Attendees here drive the People filter** (see People).
* **Executive summary** — `ul.bullets`, 3–6 single-fact bullets, most material first (largest position, newest open item, upcoming commitment, named close risks, meaningful absences). Primary input is the contact's notes field when populated; synthesize from it and do not also render the raw notes elsewhere. With no notes, draw from structured data.
* **Organization snapshot** (orgs) — `.details` with selective key-cell icons. Type, AUM (per caveats: public/web only, `· public` label, omit if unsourced), allocation profile, asset-class/regional focus, public commitments to other GPs, website, recent news. Public allocation posture renders as a fact only — no tailwind/headwind inference in v1.
* **Investor profile** (individuals) — `.tiles` for the short attribute strip (type, strategy, regional preference, etc.) when keys are short and numerous; `.details` when values are sentences.
* **People** — `.people`. The **Staff of the organization** — the person-contacts attached to the organization record as its Staff (the connector returns this relationship; source People from it directly). Include **only** the org's Staff — never the org contact itself, prospect co-contacts, account co-investors, name-only matches, or GP-staff note-authors (a note's `createdBy` is a staff user, not org Staff). Render each as name + role with a 1–2 line professional context (one material prior firm/role, relevant credentials). **Meeting mode:** when the tearsheet is generated for a meeting, restrict People to the attendees who are Staff; otherwise list all of the org's Staff. Per-person source citation. Headshot per the Header chain. No personal information ever. Just list the people; no sourcing caveats in the brief.
* **Juniper Square data** (when the connector is connected):

    * _Investment information_ — `table.data`, one row per holding: entity, commitment (money-decoded per caveats), ownership, IRR, TVPI, DPI, RVPI. Performance columns render only when at least one position has a populated value; omit null cells rather than printing "not calculated." No contributions, distributions, unfunded, NAV, or MOIC columns (not exposed).
    * _Fundraising pipeline_ — **the domain block this skill owns**, built from `.details` + `.badge` (or `table.data` for many prospects). Per active prospect: offering name, LP-side prospect contacts (no record IDs), status badge, expected/ticket size (inline source label, attributed to IR assessment), data-room provisioned/last-accessed date. Omit the block entirely when no active prospects exist.
    * _Additional details_ — `.tiles`. Populated contact-level extension fields (Strategy, Product type, Geography, Client Type, Investor type, or whatever the workspace configures). Omit empty fields.
    * _Profile data_ — `.details` with selective icons. Current role & company, location (city/state/country), email, phone, website, and LinkedIn (plain text, not a link); tags (`.badge`); relationships (accountants/lawyers/advisors) and referrer name only if present. Omit any empty field — never a "None on file" row.
    * _Relevant staff_ — `.people` or a `.details` row. GP-side names, roles, light bio.

* **Relationship history** — `.hist`, most recent first. Human-authored notes/meetings render **verbatim** (including sentiment and forward-looking commentary the analyst wrote); auto-events (capital-call/distribution notices, subscription invitations, data-room launches, K-1 deliveries, status changes) render as one-line summaries. Entry header: date, type, analyst initials/author, and any external parties detected in the note title.
* **Source attribution** — inline `.cite` labels on quantitative facts the GP will repeat (AUM, allocation, ticket size, peer-GP commitments) and on disputable assessments; header-level attribution on history entries; per-person citation in People. Public facts are labelled `· public` (this skill uses no paid-enrichment sources). The `.footnote` is a terse sources line that names only the sources actually used — the Juniper Square connector (and the specific objects pulled), plus public web only if web research informed the brief; if it didn't, don't mention web at all. No variant, dry-run, or boilerplate disclaimers. Everything else implicit by section. Never render an unsourced claim — omit instead.
* **Thinking-partner appendix** — off by default. Turn on with "include thinking partner notes": hypotheses about LP motivations/constraints/likely questions, every line tagged inferred and non-authoritative, no source attributions, placed last so it can be cut for external sharing.

## Execution Flow

### Step 1: Gather first-party context

**Reference the** `juniper-square-data-model` **skill before querying** to map terms to the right objects — disambiguate **Account** (investor-side legal vehicle) from **Investment Entity** (GP-side fund vehicle), treat **Positions** as executed economics versus **Prospects / Subscriptions** as commitment-stage pipeline, and apply the money decode (see caveats). **If the Juniper Square connector is connected:** resolve the contact (ask if ambiguous); pull positions, prospects, activity log, profile, relationships, referrers, internal notes, GP-side relevant staff, the org's Staff roster (for People), and any contact-saved URLs for web research. **External-party detection:** surface intermediaries, placement agents, co-investor LPs, or advisors named in note titles — title-only detection, render only when found. **If workplace tools are connected:** calendar (matching events → title, time, attendees, description, attachments — the attendee list filters People in meeting mode); email (threads with contact domain, last 30 days → topics, open questions, commitments); chat (Slack/Teams mentions, last 30 days); transcripts (prior calls → key moments, objections). **If nothing is connected:** ask the standalone probe; if meeting prep is implied, ask date, attendees, format, and Goals.

### Step 2: Infer variant

Apply the Variants table. If data shape doesn't cleanly fit, probe per Ambiguity handling unless the user asked for strict mode. Tracked internally; not rendered.

### Step 3: Web research supplement

Always run, subject to the Web Search Policy: org news (last 90 days), public commitments to other GPs, leadership/team changes, board minutes for public pensions, industry context, public allocation posture (facts only), and public LinkedIn headshots for named attendees.

### Step 4: Synthesize and render

Combine first-party + public sources into the section list above; track source for every data point internally; render attribution selectively. For a person subject, resolve the header headshot and embed it as base64 (see Header). Render through `jsq-report-render`: copy its template, fill the markers, paste only the patterns you use, and build the fundraising-pipeline block from `.details` + `.badge`. Post a `computer://` link naming the file. Append the thinking-partner appendix last if opted in.

### Step 5: Probe before rendering empty

If a section has no data, don't render it empty — ask the user, or omit with a one-line note rather than fabricate. Exception: the header image omits silently.

## Web Search Policy

| Subject | Allowed | Examples |
| --- | --- | --- |
| Organizations | Yes, broad | News, leadership, public commitments to other GPs, board minutes (public pensions), org sites/team info, allocation posture. |
| People, professional | Yes, bounded | Role, public quotes, conference appearances, board service, prior employers, public LinkedIn photo. |
| People, personal | No, never | n/a |
| Paid enrichment (Preqin, etc.) | No | Do not source AUM, allocation, or peer-GP commitments from paid enrichment providers. General public/web only. |
| Internal CRM data | Yes, first-party | Anything in the Juniper Square connector; the GP already owns this context. |

## Design Rules (content behavior)

Visual rules live in `jsq-report-render`; sourcing, People, links, header-image, and variant rules live in their sections above.

* **Probe, don't fabricate.** Missing data → ask or omit with a note. Never render empty sections silently or hallucinate values.
* **Fact-grounded v1.** Surface facts and structure. Inference layers (tailwind/headwind cross-reference, anticipated questions, talking-point hooks, past-due detection, performance-context inference, data-anomaly flagging) are deferred to avoid surfacing incorrect information. Render dates/values as they appear; if two values look inconsistent, do not flag an anomaly or speculate. IR notes render verbatim, including analyst interpretation; the skill generates no new interpretation outside the optional appendix.
* **Deterministic.** Same input → same section structure and summary-line phrasing. Relationship-history content varies because notes vary; structure does not.
* **Conditional rendering — omit nulls.** Sections, sub-blocks, rows, tiles, and columns render only when data exists. Meeting Details only with meeting context; People restricted to attendees in meeting mode; Fundraising pipeline only with active prospects; performance columns only when at least one position has a value; header-image only on a person-headshot resolve; external-party lines only when detected; relationship rows only when relationships exist. Never print "None on file," "N/A," or a bare "—" for a missing field — drop the row, tile, or column entirely.
* **Rendering hygiene.** Drop minute-level timestamps (date only). Drop internal record IDs from rendered output; use source-class names. Calendar/business dates (capital call, distribution, provisioning, meeting time) stay as-is. Remove parentheticals that restate a label.
* **No internal plumbing in the brief.** Selected variant and other internal state are tracked internally, not rendered.
* **Spell out Juniper Square** in rendered output (not "JSQ"). Refer to the data source as the Juniper Square connector.

## Probing Examples

* No CRM: "Tell me about this LP. Existing investor or prospect? Deal stage? Anything specific you want me to know?"
* No calendar event: "I don't see a calendar event. When is the meeting, who's attending, and what's the format?"
* Meeting exists, Goals empty: "What's the goal of this meeting? E.g., relationship-building dinner, closing open items, fundraising push, QBR walkthrough."
* Ambiguous contact: "I see two contacts named \[Name\] — one at \[Org A\], one at \[Org B\]. Which one?"

## Tips for Better Output

1. **Connect the Juniper Square connector** — positions, ownership, performance, and the activity log are the spine of the tearsheet.
2. **Connect your calendar** — auto-pulls attendees and format, removes a probe, and drives the meeting-mode People filter.
3. **State the meeting type** to override the inferred variant ("treat this as a QBR even though I only have one position").
4. **Paste anything I won't find** — recent IC memo, side-letter context, anything sensitive not in the connector.
5. **Supply Goals when you know them** — a clear purpose shapes the brief and skips the probe.

## Related Skills

* `jsq-report-render` — required dependency; owns the entire visual layer.
* `juniper-square-data-model` — object disambiguation and the money-decode rule.
