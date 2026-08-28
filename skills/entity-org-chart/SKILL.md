---
name: entity-org-chart
description: Build an investment-entity org chart for a Juniper Square workspace — boxes and lines, with ownership percentages on every edge. Use when the user says "org chart", "organizational chart", "entity structure diagram", "ownership chart", "ownership graph", "nested entity structure", "boxes and lines", "draw my fund structure", "visualize my entities", "where is investor X invested", "show me Fund Y's structure", "what does Fund Y own", or asks for a roll-up of all positions owned by an investment entity. Use whenever the deliverable is an entity-to-entity (or investor-to-entity) ownership picture, rendered as a stacked-card report or as a roll-up table. Do NOT trigger for fundraise pipeline questions, performance / NAV roll-ups outside an entity tree, or documents / data-room questions.
---

# Juniper Square — entity org chart

Renders investment-entity ownership structures as a Juniper Square HTML report. Each fund in scope gets its own card with a Mermaid flowchart and a small metadata block. Three modes:

1. **Entity-structure diagram for a Fund** — Fund down through sub-entities and SPVs.
2. **Investor map** — start from a Contact, draw every fund the contact holds positions in.
3. **Position roll-up** — every position attributable to one fund, direct or indirect, as a sortable table.

Defer to:

* `juniper-square-data-model` for object definitions (Contact, Account, Offering, Position, Investment Entity, etc.).
* `jsq-report-render` for page chrome, brand identity, the template flow, and the pattern library (`.brand-row` + `.head`, `.badge`, `table.data`, `.footnote`, etc.).

This skill only owns what's specific to drawing entity org charts.

## Required MCP tools

* `get_entity` — enumerate / hydrate Investment Entities.
* `get_position` — walks ownership in both directions.
* `get_accounts` — classify a position's holder via `isInvestmentEntity`.
* `get_contacts` (mode 2 only) — expand a Contact to its linked Accounts.

Every call needs `telemetry.intent`. Be specific — GP staff audit these.

## The one fact that makes the walk possible

Investment Entities and their account-holder representations share the same ID. So if Fund 2 has entity ID `4813`:

* `get_position(entity_id="4813")` → positions _in_ Fund 2 (investors and sub-entity parents).
* `get_position(account_id="4813")` → positions _held by_ Fund 2.
* `get_accounts(ids=["4813"])` → returns the account row with `isInvestmentEntity: true`.

## Position record — the edge

Direction: `account` **→** `investmentEntity` at `percentOwnership %`. Filter to `status == "Active"` unless asked otherwise. `amountCommitted.monies[0].amount` is in major units (`12500000` = $12.5M); `precision` is display decimals, not a divisor; `monies` can be `[]`. `ownershipUnit.calculationMethod` ≠ `commitment` changes what `percentOwnership` means — footnote on the card.

## Workflow

**Reference the** `juniper-square-data-model` **skill before querying** to map terms to the right objects — in particular, disambiguate **Account** (investor-side legal vehicle) from **Investment Entity** (GP-side fund vehicle), treat **Positions** as executed economics versus **Prospects / Subscriptions** as commitment-stage pipeline, and decode structured money (`amount ÷ 10^precision`) before using it.

### Step 0 — Disambiguate

If the trigger phrase is ambiguous, ask once with `AskUserQuestion`: entity-structure diagram, investor map, all-entities sweep, or position roll-up table.

### Step 1 — Find the root(s)

```
get_entity(term="Fund III", status="Active", max_results=10,
           telemetry={"intent": "Find root entity for org chart"})
```

`status` filter is title-case (`Active` / `Completed`); the response returns it UPPERCASE. For a sweep, omit `term` and treat `type.name in {"Fund", "Joint venture", "Co-invest"}` as roots. Cap a default sweep at 25 roots; ask the user to scope by collection or tag before going wider.

### Step 2 — Walk downstream (parent → sub-entities)

BFS from each root, depth ≤ 6:

```
visited = set(); edges = []; queue = [root]
while queue:
    parent = queue.pop(0)
    if parent in visited: continue
    visited.add(parent)
    res = get_position(account_id=parent, max_results=50, telemetry={...})
    for p in res["items"] where p["status"] == "Active":
        child = p["investmentEntity"]["id"]
        edges.append({parent, child, pct: p["percentOwnership"],
                      commitment: p["amountCommitted"]["monies"]})
        queue.append(child)
    if res.get("truncated"): warn(parent)
```

`visited` is also the cycle guard.

### Step 3 — Walk upstream (entity → investors)

```
for ent in visited:
    res = get_position(entity_id=ent, max_results=50, telemetry={...})
    investors = [p for p in res["items"]
                 if p["status"]=="Active" and p["account"]["id"] not in visited]
```

Skip holders already in `visited` — those are sub-entity edges captured in step 2.

**LP collapse.** If a single entity has > 8 investor positions, render one summary node instead of one per LP: `N investors · $T committed` (grouped by currency). ≤ 8 LPs: draw each as `Investor name · $commitment · X%`.

### Step 4 — Classify ambiguous holders

If step 3 produced a holder not in `visited`, batch unknown IDs into one `get_accounts(ids=[…])`. `isInvestmentEntity: true` → fold into `visited` and re-run step 2; `false` → real investor account.

### Step 5 — Render

Render through the brand kit. Hard rule 5 supplies the brand row + `.head` automatically — what this skill decides is _what fills them_:

* Brand-row meta: `Confidential` + the data-refresh date in `DD Mmm YYYY`. The date is implicit: brand-row date = data refresh.
* Eyebrow: `Entity ownership`.
* H1: the fund's name when one fund is in scope, otherwise `Entity ownership structures`.
* `.subhead` / `.asn`: omit unless they add real information. No KPI strip, no provenance blurb.

**Per-fund card** (one per root, stacked):

* Container — 1px `--jsq-rule` border, 8px radius, white. Header band + chart body + footer band.
* Header — fund name + an entity-type `.badge` from the brand kit (`Fund` / `Joint venture` / `Co-invest` / `Asset SPV`). Sentence case.
* Diagram — Mermaid `flowchart TB`.
* Footer — one row of label / value pairs on a `--jsq-neutral-100` tile background: total commitment · investor count · holdings count · ownership metric.

If a fund tree has only one root and no sub-entities, fall back to a flat list of investors — the diagram adds nothing.

**Node labels (lean):**

* **Fund** — name only. Type lives on the badge in the card header.
* **Sub-entity / intermediate / SPV** — name only. Ownership lives on the edge.
* **Operating / portfolio company** — name on line 1, `Operating company` (or `Portfolio company` for VC) on line 2 in muted 10px. **Dashed border** distinguishes it from real legal vehicles in the fund's structure.
* **Investor (≤ 8 case)** — name + `$commitment · X%` on line 2 muted.
* **Investor (collapsed)** — `N investors` + `$T committed` muted.
* **General partner** — same neutral treatment as an LP, with `General partner` on line 2 muted. **No amber tint** — GP is a role, not a warning.

Multi-line node labels MUST use `<br/>` between lines, never a literal newline or `\n`. Mermaid's parser rejects raw newlines inside `[...]` and the diagram falls back to plain-text source. Correct: `LP1["Olivia Larkin<br/>$10B · 50%"]`. Wrong: `LP1["Olivia Larkin\n$10B · 50%"]`.

For muted-second-line text, wrap line 2 in an inline `<span>`: `OPCO["Company B<br/><span style='font-size:10px;color:#72716E'>Operating company</span>"]`. This requires `securityLevel: "loose"` in the Mermaid init.

**Edges:**

* Default label: `X%`.
* Sub-entity with dollar context: `$commitment · X%`.
* **Tranched investments** into one operating company (equity + debt): no wrapper nodes per tranche. Draw multiple parallel edges from the fund directly to the company with the instrument as the edge label (`$500M equity`, `$1B debt`). Wrappers get their own node only if they have further structure underneath.
* `percentOwnership` null AND `amountCommitted` empty: no edge label. The dashed border and `Operating company` subtitle do the communicating.
* `ownershipUnit.calculationMethod != "commitment"`: label with the unit (e.g. `30%·units`) and footnote the metric.

**Palette** (`classDef` lines mirror brand tokens — Mermaid can't read CSS vars):

```
classDef fund  fill:#C8E8EC,stroke:#017989,stroke-width:1.5px,color:#01545F   /* --jsq-primary-200 / --jsq-primary-700 */
classDef opco  fill:#FFFFFF,stroke:#72716E,stroke-width:1px,stroke-dasharray:4 3,color:#201F1C   /* --jsq-bg / --jsq-neutral-600 */
classDef inv   fill:#FFFFFF,stroke:#C9C5BC,stroke-width:1px,color:#201F1C   /* --jsq-bg / --jsq-rule-2 */
```

Add only when the structure contains them:

```
classDef inter fill:#E8F4F6,stroke:#4A8B95,stroke-width:1.5px,color:#01545F   /* intermediate sub-fund holding further entities */
classDef spv   fill:#F6F4F0,stroke:#72716E,stroke-width:1.5px,color:#201F1C   /* --jsq-neutral-100 / --jsq-neutral-600 — Asset SPV */
```

**Mermaid container:** `<pre class="mermaid">` per the brand kit's Mermaid convention. Don't use `<div class="mermaid">` — it's fragile across Mermaid versions and the brand kit standardized on `<pre>`.

**Mermaid init:** `theme: "base"`, `lineColor: "#72716E"`, `flowchart: { htmlLabels: true, curve: "basis", padding: 14 }`. Font and text colors inherit from the brand kit. Override the brand kit's default `securityLevel: "strict"` to `"loose"` — needed for the inline `<span>` muted subtitles on operating-company and GP nodes. If you don't need muted subtitles in a particular render, leave `securityLevel` at strict. Sanitize connector-derived label text — markup in names or notes injects into the render.

**Legend (always).** Footer-aligned strip below the last card, separated by a thin top rule. One swatch per node type actually used. Three is typical (Fund, Operating company, Investor).

### Step 6 — Hand back

Post the `computer://` link with one sentence: how many funds were charted, total entities walked, any truncation or cycle warning.

## Mode 2 — Investor map

1. `get_contacts(term="<name>", max_results=10, telemetry={...})`. Disambiguate.
2. From the contact's `accounts`, collect every linked `account_id`.
3. For each: `get_position(account_id=X)`.
4. For each `position.investmentEntity.id`, walk upward (inverted step 2: check `get_position(entity_id=…)` for any holder with `isInvestmentEntity: true`) to find the top-level Fund.
5. Render: investor as the root node, each fund and chain below as a subtree.

## Mode 3 — Position roll-up (table, no diagram)

1. Run steps 1–4 against the requested root.
2. Collect every Position record from the walk.
3. Render `table.data` from the brand kit. Columns: Investment Entity · Holder name · Holder type (Investor / Sub-entity) · Ownership % · Committed · Status · Direct or Indirect under root.
4. Header line: `Fund X · N positions · $T total committed · L unique investors`. Single line.

## Money formatting

* ≥ $1B → `$X.XB`, trim `.0` when round (`$10B`, `$12.5B`).
* ≥ $1M, < $1B → `$X.XM`, trim `.0` when round (`$5M`, `$12.5M`).
* ≥ $1k, < $1M → `$XXXk` (`$250k`).
* < $1k → `$X`.
* `monies == []` → omit the dollar entirely. Never render `$0`.
* Mixed currencies → group by currency. Never sum across.

## Gotchas

* **Telemetry intent is required** on every `get_*` call.
* `get_entity.term=""` fails — use a non-empty term, or omit `term`.
* `get_position` **payloads are heavy** (~30KB per position from extension fields). Don't sweep blindly.
* **Operating companies can't hold positions in other entities.** If one appears as a holder, surface as a data error — don't recurse.
* **Ownership not totaling 100%** within a single metric on a single entity is suspect. Sum at render; warn above the diagram if it doesn't reconcile.
* **Completed positions** are excluded by default. Ask before including for wind-down funds.
* **Truncation** on `get_position` / `get_entity` is real. Paginate or narrow — never silently drop.
* `arenaId` **/** `arenaName` identify the workspace in responses; render as "workspace," not by field name.
* `get_accounts` **term-search bleeds in entities.** For true investor accounts only, pass `object_filter="is_not_entity"`.
* **No data fabrication.** Walk returns nothing → render "No active positions in this fund." Don't synthesize placeholder LPs.
* `<br/>` **not** `\n` **in node labels.** Literal newlines inside `[...]` brackets break Mermaid's parser and the artifact falls back to showing the raw source. Always `<br/>`.

## Example

**Rendering handoff (examples-first update).** `jsq-report-render` is now examples-first: before rendering, open its `references/example-org-chart.html` (the Mossvale Fund master-feeder reference) and match its structure — per-fund card + type badge, Mermaid `flowchart TB` with ownership % on every edge, node classes (fund / feeder / SPV / operating-company dashed / investor / GP), footer roll-up tile, legend. Then hand the body to the render skill for the brand patch + envelope. Note Mermaid renders in the artifact/browser but is blank in the flat-file preview, so an org chart the user keeps is best shipped as a persistent artifact. `visualize read_me` is only the on-demand fallback. See Skill: report-render.
