---
name: juniper-square-report-design
description: The Juniper Square report design system (stylesheet, helpers, components and rules) for HTML reports built from Juniper Square data. Load it whenever Juniper Square Studio, a Studio saved build or another Juniper Square report skill renders a report, or when asked to build a branded Juniper Square report or dashboard.
---

# Juniper Square report design

Every Juniper Square report, whether from Studio, a saved build or another Juniper Square report skill, uses this design. It is the only look these reports use.

**Three non-negotiables**
1. **Never retype or edit the stylesheet or helpers.** `assets/report.css` and `assets/report.js` are inserted by `scripts/assemble.py`. No second stylesheet, no per-report CSS. The only inline styles allowed are the custom properties the snippets use (`--w`, `--v`, `--sw`, `--n`) and the donut's `conic-gradient`.
2. Build every section from the §5 snippets. If something isn't covered, combine existing classes; don't invent new ones.
3. Data always comes from Juniper Square. Never sample, placeholder or estimated data. Missing stays missing, stated quietly and once (§6.3).

### 1. Build a report (always these steps)

1. **Find this skill's folder in the shell.** The path can differ from the one the Skill tool shows:
   `find / -path '*juniper-square-report-design/scripts/assemble.py' -not -path '/proc/*' 2>/dev/null | head -1`
2. **Write two files** in the working folder (the outputs folder, which both the shell and the file tools can see):
   - `body.html`: only the page markup, `<main class="report"> … </main>`, following §4 and §5. No `<style>`, no `<script>`.
   - `data.js`: plain JavaScript: `const DATA = {…}` (pre-aggregated JSON, §8), then the render calls.
3. **Assemble:**
   `python3 <skill>/scripts/assemble.py --title "<Report> · <scope>" --body body.html --data data.js --out <name>.html [--fragment]`
   - Use `--fragment` when publishing as an Artifact page (the Artifact tool adds the page skeleton). Without it you get a standalone `.html` file.
   - The script checks for per-report CSS, scripts in the body, hex colours, banned "Not on file" wording and a missing footer. If it prints `CHECKS FAILED`, fix the parts and run it again.
4. **Deliver:** publish `<name>.html` with the Artifact tool if it exists; otherwise share the file. Exports are a spreadsheet file, not a page.

**No shell available** (some chat clients): read `assets/report.css` and `assets/report.js` and paste them **verbatim** into `<style>` and `<script>` around your markup and data.

### 2. Tokens, fonts and theme

**Tokens and fonts:** `assets/report.css` opens with the Juniper Square report tokens (color, type and surface as custom properties, light and dark themes, print overrides), followed by the components. Moderat (400/500) and Charter BT Pro Roman (400) are licensed and aren't shipped with this skill. If font files are available, put base64 `@font-face` rules in a file and pass `--fonts fonts.css`; otherwise the fallback stacks apply. Don't ask for font files.

**Theme:** the page follows the system theme; `data-theme="light"` or `"dark"` on `<html>` forces one (full-file mode only).

### 3. Helpers reference (all in `assets/report.js`)

| Helper | Use |
|---|---|
| `fmt.money(v, {full})` | `$2.65M` / `$150k`; `{full:true}` gives `$500,000`. `—` when empty. |
| `fmt.int(v)` · `fmt.pct(v)` | `1,157` · `41.2%` (input is already a percentage) |
| `fmt.date(iso)` · `fmt.month(iso)` · `fmt.days(from, to)` | `17 Oct 2026` · `Oct 2026` · whole days between |
| `esc(s)` | HTML-escape any text you put in markup strings |
| `watch(el, draw)` | Redraw on resize (wrap `renderTrend`) |
| `renderTrend(el, {points:[{label,value}], format, label, height})` | 2px line over a flat area; points with `modeled:true` are dashed on a shaded span after a "Today" rule; the latest actual point carries the one highlight |
| `renderSpark(el, values, label)` | Sparkline in a KPI card or cell |
| `renderOrg(el, {nodes, edges, label})` | Org chart. `nodes:[{id,name,type:'fund'\|'hold'\|'prop'\|'inv',typeLabel,row,col}]`, `edges:[{from,to,pct}]` (`pct:null` = not recorded) |
| `renderTable(el, {caption, rows, sort:{key,dir}, columns, notes, pageSize})` | Sortable, paged at 50, hides all-empty columns and footnotes them. `columns:[{key,label,align:'r'\|'c',sortable,text,sortValue(r),render(r),keep}]` |
| `openLink(url, label)` | A quiet trailing "Open ↗" for a row or action, only when the connector returned a URL that opens the record (today a document's `staffViewUrl`); empty otherwise (§6.7). Names are always plain text. |
| `stageCell(stage, stages)` | Compact phase pills and stage name for a table cell (`stage` is 1-based) |

The stylesheet's classes are the ones used in the §5 snippets. Don't add others.

### 4. Page skeleton
This is `body.html`. The order is fixed. Leave out a block that has nothing to say; never reorder. Data and render calls go in `data.js`, not here.

```html
<main class="report">
  <header class="rh">…</header>                       <!-- 5.1 header + 5.2 scope -->
  <section class="kpis">…</section>                   <!-- 5.3 -->
  <section class="grid">                              <!-- primary card left (wide), secondary right -->
    <div class="card">…Do this next…</div>            <!-- 5.5 -->
    <div class="card">…donut / breakdown…</div>       <!-- 5.6 -->
  </section>
  <section class="card">…funnel or trend…</section>   <!-- 5.7 / 5.10 -->
  <section class="card card--flush">…table…</section> <!-- 5.8 -->
  <section class="card about">…</section>             <!-- 5.12 -->
  <footer class="foot">…</footer>                     <!-- 5.13 -->
</main>
```
Layout: `.grid` is 1.65 : 1 (wide card left). `.grid--even` is 1 : 1. Both collapse to one column under 900px.

### 5. Components

Where a snippet shows a `<script>` block, its contents go in `data.js` without the tags; everything else goes in `body.html`.

**5.1 Page header.** A slim brand bar first: the Juniper Square mark (`report.js` fills any `data-jsq-mark` element), the report type and the date, in caption type over a 1px rule. Then the title: the entity, raise or investor, in `.title`, always plain `--text`, never a link. Then the lede: one or two plain sentences with the single most useful fact (no bold lead-in). The right column holds what the page covers as plain text, and "Confidential". No pills or dots in the header.
```html
<div class="rh-brand"><span class="mark" data-jsq-mark></span><span>Fundraise update</span><span class="sep">·</span><span>17 Oct 2026</span></div>
<header class="rh">
  <div class="rh-main">
    <h1 class="title">Harbor Point Industrial SPV</h1>
    <p class="lede">Nothing has closed yet. $2.65M is requested across six subscriptions, and the closest to closing has waited 372 days on staff review.</p>
  </div>
  <div class="rh-meta">
    <span class="scope">Prospects tagged Family office</span>
    <span>Confidential</span>
  </div>
</header>
```

**5.2 Scope and caveats.** The `.scope` line (plain text) states what the page covers in five words or fewer. When a limit changes how to read the figures and needs a sentence, add one `.caveat` line as the last child of `.rh-main`. Put the full explanation in About → Data limits. Never a banner, never coloured boxes.
```html
<p class="caveat">Two subscriptions are in EUR and are shown separately; all other amounts are in USD.</p>
```

**5.3 KPI row.** Two to four `.kpi` cards. The lead KPI (`kpi--lead`, first, wider, larger) is the number the reader acts on. Zeros and lagging figures go last with `kpi--quiet`. A KPI with no data is omitted. Each card may end with one `.kpi-viz`: a `.split` composition bar + legend, `.dots` (one per item, under 20), a `.meter` (share of a target), a sparkline, or a chip.
```html
<section class="kpis" aria-label="Key figures">
  <div class="card kpi kpi--lead">
    <p class="kpi-label">Requested, in flight</p>
    <p class="kpi-value">$2.65M</p>
    <div class="kpi-viz">
      <div class="split" aria-hidden="true"><span style="--v:75.5;--sw:var(--series-1)"></span><span style="--v:18.9;--sw:var(--series-2)"></span><span style="--v:5.7;--sw:var(--series-3)"></span></div>
      <ul class="legend"><li><i class="sw" style="--sw:var(--series-1)"></i>Account $2M</li><li><i class="sw" style="--sw:var(--series-2)"></i>Staff review $500k</li><li><i class="sw" style="--sw:var(--series-3)"></i>Signature $150k</li></ul>
    </div>
  </div>
  <div class="card kpi">
    <p class="kpi-label">New commitments</p>
    <p class="kpi-value">$4.1M</p>
    <p class="kpi-delta up">▲ 12.4% vs prior quarter</p>
    <div class="kpi-viz" id="spark-new"></div>   <!-- renderSpark(el, values, label) -->
  </div>
  <div class="card kpi">
    <p class="kpi-label">Waiting on your team</p>
    <p class="kpi-value">1</p>
    <p class="kpi-note">Dana Whitfield · $500,000</p>
    <div class="kpi-viz"><span class="chip chip--watch">372 days in review</span></div>
  </div>
  <div class="card kpi kpi--quiet">
    <p class="kpi-label">Committed</p>
    <p class="kpi-value">$0</p>
    <p class="kpi-note">No executed positions yet</p>
    <div class="kpi-viz"><div class="meter" aria-hidden="true"><i style="--w:0%"></i></div></div>
  </div>
</section>
```
`.dots`: `<div class="dots" aria-hidden="true"><i style="--sw:var(--accent-strong)"></i><i></i>…</div>` (unset dots are `--seq-2`).

**5.4 Section card.** Title in sentence case; subtitle says what's counted and how it's ordered. Optional right-aligned aside in `.card-head` (a `.legend` or one chip). No export, print or download buttons: the artifact viewer blocks them. Optional `.card-foot` for one footnote. Tables use `card card--flush`.
```html
<section class="card">
  <header class="card-head">
    <div><h2 class="card-title">Capital calls</h2><p class="card-sub">Calls issued this quarter, newest first.</p></div>
    <span class="chip">Q3 2026</span>
  </header>
  …
  <p class="card-foot">Amounts are in USD.</p>
</section>
```

**5.5 Do this next.** Two to five items. Title starts with a verb and names who. Detail is one or two sentences of evidence (steps, dates, days). Key figure on the right with a short qualifier. Numbers come from CSS.
```html
<div class="card">
  <header class="card-head"><div><h2 class="card-title">Do this next</h2><p class="card-sub">Ordered by how close each is to closing, then by amount.</p></div></header>
  <ol class="actions">
    <li class="action">
      <div><p class="action-title">Finish staff review for Dana Whitfield</p><p class="action-detail">All eight investor steps are done and the DocuSign envelope was sent.</p></div>
      <p class="action-fig">$500,000<small>372 days in review</small></p>
    </li>
  </ol>
</div>
```

**5.6 Donut and breakdown.** Fewer than six slices. Segments use `--series-1` → `--series-5` in order; `--series-6` only for "Other". Never `--highlight` in a donut. Stops in the `conic-gradient` are cumulative percentages.
```html
<div class="donut-wrap">
  <div class="donut" role="img" aria-label="Subscriber account $2.0M, 75%; staff review $500,000, 19%; signature $150,000, 6%"
       style="background:conic-gradient(var(--series-1) 0 75.5%,var(--series-2) 0 94.3%,var(--series-3) 0 100%)"><span><b>$2.65M</b>requested</span></div>
  <ul class="breakdown">
    <li><i class="sw" style="--sw:var(--series-1)"></i>Subscriber account<span>$2,000,000</span><span class="pct">75%</span></li>
    <li><i class="sw" style="--sw:var(--series-2)"></i>Staff review<span>$500,000</span><span class="pct">19%</span></li>
  </ul>
</div>
```

**5.7 Horizontal bars (funnel or ranking).** `--w` = value ÷ largest bar shown × 100%. Solid fills (`--accent`, or a series via `style="--sw:var(--series-n)"`). `bar--modeled` gives the outline + 45° hatch for modeled values. At most one `bar--accent` (the view's one `--highlight` mark, with its 1px edge), always labelled in `card-sub`. Zero rows get `bar--zero`. Dominant category (more than 3× the next): move it into `.stats` (preferred), or keep it in order with `bar--break` and write "not to scale" in its value.
```html
<div class="funnel">
  <ul class="bars" aria-label="Open subscriptions by stage">
    <li class="bar"><span>Subscriber account</span><span class="bar-track"><span class="bar-fill" style="--w:100%"></span></span><span class="bar-val">4 <small>· $2M</small></span></li>
    <li class="bar bar--accent"><span>Staff review</span><span class="bar-track"><span class="bar-fill" style="--w:25%"></span></span><span class="bar-val">1 <small>· $500k</small></span></li>
    <li class="bar bar--zero"><span>Completed</span><span class="bar-track"><span class="bar-fill" style="--w:0%"></span></span><span class="bar-val">0</span></li>
  </ul>
  <div class="stats">
    <div class="stat"><p class="stat-value">86</p><p class="stat-label">Not invited yet</p></div>
  </div>
</div>
```
A ranking without side stats: use `.bars` alone.

**5.8 Data table.** Always `renderTable()` into an empty `<div>` placed directly in a `card card--flush`, after the `.card-head`. Numbers sort descending first; text columns (`text:true`) ascending first. Pages at 50. Columns empty in every row are hidden and footnoted automatically. Money right-aligned (`align:'r'`), full dollars.
```html
<section class="card card--flush">
  <header class="card-head"><div><h2 class="card-title">Subscriptions in flight</h2><p class="card-sub">All nine open subscriptions, closest to closing first.</p></div></header>
  <div id="inflight"></div>
</section>
<script>
renderTable(document.getElementById('inflight'), {
  caption: 'Open subscriptions', rows: DATA.open, sort: {key: 'stage', dir: 'desc'},
  columns: [
    {key: 'investor', label: 'Investor', sortable: true, text: true, render: r => esc(r.investor)},
    {key: 'requested', label: 'Requested', align: 'r', sortable: true,
     render: r => r.requested == null ? '<span class="muted">—</span>' : fmt.money(r.requested, {full: true})},
    {key: 'stage', label: 'Stage', sortable: true, render: r => stageCell(r.stage, DATA.stages)},
    {key: 'last', label: 'Last activity', sortable: true, render: r => fmt.date(r.last)},
    {key: 'flag', label: 'Flag', render: r => r.flag ? `<span class="chip chip--${r.flag.kind}">${r.flag.text}</span>` : ''}],
  notes: ['Requested shows — where no amount has been entered.']
});
</script>
```

**5.9 Phase stepper.** In tables use `stageCell(stage, stages)` (compact pills + stage name) and put the key in the card head. Standalone, use the labeled `.stepper`; set `style="--n:4"` for other phase counts.
```html
<ul class="legend"><li><span class="steps" aria-hidden="true"><i class="done"></i><i class="now"></i><i></i></span>Done · current · to go</li></ul>

<ol class="stepper" aria-label="Subscription stages">
  <li class="done">Invited</li><li class="done">Account</li><li class="done">Investor steps</li><li aria-current="step">Signature</li><li>Staff review</li>
</ol>
```

**5.10 Trend (signature chart) and sparkline.** 2px `--series-1` line over a flat `--accent-subtle` area, small ringed points, the latest actual point as the view's one `--highlight` mark (pass `highlight:false` if the page already uses it), solid guide and tooltip on hover/focus. Points with `modeled:true` continue as a 2px dashed line on a `--surface-subtle` span that starts at a 1px "Today" rule. Include zero periods. Every trend gets a "Show the numbers" fold-out.
```html
<section class="card">
  <header class="card-head"><div><h2 class="card-title">Cumulative commitments</h2><p class="card-sub">By quarter, in USD.</p></div></header>
  <div class="chart" id="trend"></div>
  <details class="numbers"><summary>Show the numbers</summary><div id="trend-n"></div></details>
</section>
<script>
const el = document.getElementById('trend');
const series = {points: DATA.quarters.map(q => ({label: q.label, value: q.committed})), format: 'money',
  label: 'Cumulative commitments by quarter, rising from $4.2M to $18.1M'};
watch(el, () => renderTrend(el, series));
document.getElementById('trend-n').innerHTML = `<table class="tbl"><thead><tr><th>Quarter</th><th class="r">Committed</th></tr></thead><tbody>${
  series.points.map(p => `<tr><td>${p.label}</td><td class="r">${fmt.money(p.value)}</td></tr>`).join('')}</tbody></table>`;
renderSpark(document.getElementById('spark-new'), DATA.quarters.map(q => q.newCommitments), 'New commitments, last 8 quarters');
</script>
```

**5.11 Entity org chart.** Always `renderOrg()` into `.org-scroll` inside a card, with the type legend in the card head, a `.card-foot` saying how many links have a percentage, and a holdings table below.
```html
<section class="card">
  <header class="card-head">
    <div><h2 class="card-title">Ownership structure</h2><p class="card-sub">Ownership flows down. Each link shows the holder’s ownership.</p></div>
    <ul class="legend" aria-label="Entity types"><li><span class="key key--fund"></span>Fund</li><li><span class="key key--hold"></span>Holding company</li><li><span class="key key--prop"></span>Property company</li><li><span class="key key--inv"></span>Investor group</li></ul>
  </header>
  <div class="org-scroll" id="org"></div>
  <p class="card-foot">Ownership is recorded for two of seven links; the rest show —.</p>
</section>
<script>
renderOrg(document.getElementById('org'), {label: 'Ownership chart: one sentence per link…',
  nodes: [{id: 'lps', name: '19 LP investors', type: 'inv', typeLabel: 'Investor group · 19 accounts', row: 0, col: 0},
          {id: 'fund', name: 'Northgate Real Estate Fund II, LP', type: 'fund', row: 1, col: 0}],
  edges: [{from: 'lps', to: 'fund', pct: null}]});
</script>
```
Node types: `fund` solid moss (`--accent-strong`) · `hold` teal outline · `prop` mist fill · `inv` subtle-grey pill. `typeLabel` overrides the default type line (for example "REIT · holding company").

Layout rules (3–15 nodes):
- Rows top to bottom: investor groups → fund(s) → holding companies (one row per level) → property companies.
- `col` is a number; halves are allowed. Put a child at the average `col` of its parents. Siblings sit one column apart.
- Max four nodes per row. More than four property companies: split them across two rows under the same parent.
- Roll LP accounts into one `inv` node ("19 LP investors"). Never one node per investor.
- `pct: null` when ownership isn't recorded; the label shows a muted "—".

**5.12 About this report.** Always the last card. Definitions, Data limits, Sources, in that order; drop a block only if empty.
```html
<section class="card about" aria-label="About this report">
  <div><h4>Definitions</h4><ul><li><b>Requested</b> is the amount an investor entered, not a commitment.</li></ul></div>
  <div><h4>Data limits</h4><ul><li>Covers the 84 prospects tagged Family office, of 1,157 on this raise.</li></ul></div>
  <div><h4>Sources</h4><p>Juniper Square fundraising, retrieved 17 Oct 2026.</p></div>
</section>
```
For term lists use `<dl><dt>Position</dt><dd>One holder’s stake in one entity.</dd></dl>`.

**5.13 Footer.** Fixed text. Keep "Confidential" whenever the page shows investor names or amounts. Never a "Sample data" badge.
```html
<footer class="foot"><span>Data as of 17 Oct 2026</span><span>Data from Juniper Square</span><span>Confidential</span></footer>
```

### 6. Rules

**6.1 Hierarchy**
- The page answers one question. The answer goes in `.lede`, the evidence in KPIs, the to-dos in "Do this next", the detail in tables.
- The lead KPI is the number the reader acts on (money in flight, items waiting on the team), not the first field in the data. Zeros never lead.
- Caveats never come first or look like warnings: `.scope` line, optional `.caveat` line, full text in About.
- Sort lists and tables by closeness to done, then by amount, unless the report says otherwise.

**6.2 Colour**
- All colour comes from the tokens at the top of `report.css`. Teal leads: `--accent` (teal-300) for marks and fills, never body text; `--accent-strong` (moss) for accent text, the lead figure, bands and selection; `--accent-subtle` (mist) for washes.
- Charts use `--series-1` … `--series-5` in order, `--series-6` only for "Other"; `--seq-1` … `--seq-5` for low → high; money in vs. out uses `--flow-called` (sky, plotted below zero) and `--flow-distributed` (green, above zero). Neither is red.
- `--highlight` (butter) is one mark per **view**, always with a 1px `--text` edge and a label; never text, never a series.
- Status chips use only the status pairs, never the accent, so a chip can't read as brand or selection. `--positive`/`--negative` always travel with ▲/+ or ▼/−. Early-fund net outflows stay in `--text` with a minus sign.
- Links are quiet (§6.7): names never coloured or underlined; the one "Open ↗" affordance turns `--link` and underlines on hover.
- No eyebrow above the title; the brand bar carries the report type. Card, KPI and table labels use label type in `--text-muted`, except the lead KPI label.
- Surfaces: a surface on the page gets a 1px `--line` border; a region inside it gets a `--surface-subtle` fill. Never both, never neither. No shadows. Soft corners: 12px on surfaces, 8px on regions inside them and on controls, 4px on bars, pill only for chips and the Modeled tag.
- Type: Moderat carries everything you read (400 and 500 only). Charter only for `.title` and display figures (`.kpi-value`, `.stat-value`). Every figure uses tabular lining numerals (the stylesheet sets them).
- `--negative` only for real losses and misses, always with a word or ▼.
- Never a hex value outside the stylesheet. Reference colours as tokens (`var(--series-1)`, `var(--accent-strong)` …). The old names (`--brand-*`, `--gold`, `--ink*`, `--paper`, `--hairline`) are retired; the assembler rejects them.

**6.2a Actual vs. modeled**
- Only modeled figures are tagged: `<span class="tag-modeled">Modeled</span>` in the KPI label or cell. Actuals stay untagged. Modeled values stay in `--text`, never muted.
- Fills: actual solid; modeled `bar--modeled` / `sw sw--modeled` (outline + hatch). Lines: actual solid; modeled dashed (renderTrend does this). The modeled span sits on `--surface-subtle` after a labelled "Today" rule. Table rows for modeled periods get `class="is-modeled"`. Never a lighter tint alone.

**6.3 Missing data**
- A KPI with no data is omitted.
- A column empty in every row is hidden; `renderTable` writes the footnote.
- A gap in a column that has data elsewhere is a muted "—", explained once in `notes` or `.card-foot`.
- Never write "Not on file", "Not recorded", "N/A", or "Unknown" in a cell or tile.

**6.4 Numbers and copy**
- Money: `fmt.money(v)` in KPIs, bars, legends, and charts ($2.65M, $150k); `{full:true}` in tables and actions ($500,000). Dates via `fmt.date` (17 Oct 2026). Percentages to one decimal at most.
- Spell out one to nine in sentences; numerals in tiles, cells, and figures.
- Sentence case everywhere except KPI labels and table headers (the stylesheet uppercases those). No exclamation marks, no emoji.

**6.5 Status chips**
- Exceptions only. If more than about a third of rows would get the same chip, it isn't an exception: drop it and use a column or sort instead. One flag column at most.
- `chip--ok` done, healthy, cleared · `chip--watch` waiting, due soon, needs a look · `chip--risk` blocked, overdue, failed a check · plain `chip` not started, not applicable.
- The word carries the meaning ("Waiting on staff", not "Stuck"). Add `title` when the word is terse. One size everywhere.

**6.6 Charts**
- Every chart title names the metric; `card-sub` says what's counted and the unit.
- Every chart has `role="img"` and an `aria-label` that summarises it. Trends also get "Show the numbers". Bars that print their values are exempt.
- Funnel or ranking: horizontal bars (5.7). Change over time: `renderTrend` (5.10). Share of a total: donut (5.6), fewer than six slices.
- Bars ≤ 50 categories; trend ≤ 500 points per series (downsample).

**6.7 Links**
- Link only when we can actually open the record in Juniper Square: a URL the connector returned for it. Today that's a document's `staffViewUrl`. Never build a link from a workspace address and an id, never guess one, and don't link external URLs.
- Names are always plain text, never coloured or underlined. The link is a separate, quiet affordance: `openLink(url)` gives a muted "Open ↗" at the end of a table row (its own last column, no header) or after an action's detail.
- In `body.html`, write it as `<a class="open-link" href="<returned url>" target="_blank" rel="noopener noreferrer">Open</a>`. The assembler rejects any other link.

### 7. Which components each report uses

| Report | Components, in page order |
|---|---|
| Fundraise update | Header + scope · KPIs · grid(Do this next, Donut by stage) · Funnel bars + stats · In-flight table with stepper and chips · About |
| Prospect pipeline | Header · KPIs with sparkline · Trend (new prospects) · Funnel bars · Table · About |
| Investor brief | Header · KPIs · grid(Do this next, Donut by fund) · Trend (contributions) · Positions table · About |
| New commitments | Header · KPIs with deltas · Trend · Table · About |
| Data-room engagement | Header · KPIs · Ranking bars (by investor or document) · Table · About |
| Entity org chart | Header + scope · KPIs · Org chart + legend · Holdings table · About |
| Tax-document check | Header + scope + caveat if partial · KPIs · Do this next · Table with chips · About |
| List check | Header · KPIs · Do this next · Table with chips · About |
| Follow-up list | Header · Do this next · Table · About |
| Spreadsheet option | A spreadsheet file, not a page |

### 8. Performance

| Rows | Approach |
|---|---|
| <1,000 | Embed directly; full interactivity |
| 1,000–10,000 | Embed; pre-aggregate for charts |
| 10,000–100,000 | Pre-aggregate before embedding; embed only aggregates |
| >100,000 | Not suited to a client-side page; suggest a BI tool |

### 9. Verify before delivering
- Built with `assemble.py`, and it printed "checks passed".
- KPI totals match the table and source data (spot-check two or three numbers).
- No "Not on file" or "Not recorded" text anywhere; hidden columns are footnoted once.
- Chips appear on a minority of rows; `--highlight` appears at most once on the page.
- Works at 375px with no page-level horizontal scroll, and in both themes (`data-theme="dark"`).
- Footer reads "Data as of … · Data from Juniper Square · Confidential".
- Optional: one screenshot if a preview tool is available. Don't retry it; publish.
