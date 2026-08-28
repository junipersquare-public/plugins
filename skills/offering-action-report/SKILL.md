---
name: offering-action-report
description: Build a single-offering fundraise ACTION report for a Juniper Square GP — a static HTML page that leads with what to do today, then backs it with the subscription funnel, the exact subscription step each in-flight investor is on (from mainStates.stages), and data-room engagement. Use whenever a GP asks for a fundraise status, "what needs my attention on [offering]", where investors are stuck, a subscription / closing status check, a daily raise update, or "action report for [offering]". Trigger even when the user doesn't say "action report" — a request to see the state of one fundraise and what to act on is enough. Built entirely on SUBSCRIPTION STATUS; it does not use prospect status.
---

# Offering Action Report

Answer one question for a GP about one fundraise: **what should I do today?** Lead with the actions, then the evidence — the subscription funnel, the per-investor subscription step, and data-room engagement. The differentiated value is surfacing the exact `mainStates.stages` step each in-flight investor sits on (including the system's own blocker reason).

## Output: one static HTML file

The deliverable is a plain, self-contained **static HTML** file. **No JavaScript, no live data fetching, no artifact.** You gather the data with the connector tools in your turn, compute the values (rules below), fill the markup, and save it.

Build it from `jsq-report-render`'s `references/example-action-report.html` — the brand-styled, self-contained reference render (Juniper Square colors/typography/header already inlined; it _is_ the `jsq-report-render` brand kit applied). Match its structure, fill in the computed values, repeat the marked row blocks once per row, delete any section/row with no data, and save as `outputs/<offering>-action-report.html`. Then share the file. That's it — what you write is what the GP opens.

## Be reactive to the data, not to a fixed list

Offerings vary enormously — compliance review on or off, KYC, identity verification, staff review, multiple fund entities, dynamic subscriptions, and an open-ended set of `status` strings. **Build from whatever the payload contains; never hardcode the universe of statuses or stages.** The reliable, config-driven backbone is `mainStates.stages` (each stage marked COMPLETED / UNSTARTED / BLOCKED / DISABLED) — derive the funnel bucket, current step, LP progress, and the phase stepper from it, and render only the buckets/phases/sections actually present. Optional signals (compliance/diligence, doc engagement, comments) appear only when the data carries them. This is what lets one skill serve every offering shape without edits.

## Scope: subscription status only

Model the subscription (execution) funnel exclusively. Buckets are derived from the stages (see Funnel). **Do not model, infer, or display prospect status** (New / Contacted / Soft-circled / Closed) — that relationship funnel is a separate lens, out of scope. "Not invited" means a prospect with no subscription yet — the top of the subscription funnel, not a prospect-status value.

## Defaults

* **Lead with actions** ("Do this next" is the top working section), ordered by proximity to close then dollars.
* **Recommendations only.** Never draft or send messages.
* **Stuck** = >7 days in the same step. **Stale** = >14 days since last activity.
* **Concentration** callout only when one investor exceeds ~40% of committed.
* **Committed** = Completed subscriptions / executed positions; in-flight dollars are subscription requested amounts. Never sum requested and committed.
* All dates `DD Mmm YYYY` (e.g. `31 May 2026`). Day counts run to today.

## Workflow

**Reference the** `juniper-square-data-model` **skill before querying** to map terms to the right objects — in particular, disambiguate **Account** (investor-side legal vehicle) from **Investment Entity** (GP-side fund vehicle), treat **Positions** as executed economics versus **Prospects / Subscriptions** as commitment-stage pipeline, and decode structured money (`amount ÷ 10^precision`) before using it.

1. **Resolve the offering** — `get_offering(term="<name>")` for the id (use a non-empty term; `term=" "`, a single space, lists all). Disambiguate if several match. The only input you truly need is the offering id; fund entity ids are derived from the data (below), not looked up.
2. **Gather + compute** — pull the data (Data pipeline), then compute each value.
3. **Fill the example** — match the structure of `jsq-report-render`'s `references/example-action-report.html`, save the static HTML, and share it.

**Section order (top to bottom):** brand-row header → KPI strip → concentration callout (only if >40%) → Funnel (only the present buckets) → Do this next (actions) → In-flight subscription steps (a flagged subset — label it) → Data room engagement (only if there's a signal) → footnote ("Snapshot, <date>. Data from Juniper Square.").

**Clickable prospects (optional).** If you know the workspace subdomain, link each investor name to `https://<subdomain>.junipersquare.com/prospect/<prospect.id>`. The connector does **not** expose the subdomain (payloads carry the workspace name but no hostname), so only link when the GP has supplied it — never slugify the workspace name (a wrong slug = dead links). Otherwise render names as plain text.

## Data pipeline

Every call needs `telemetry: { intent: "..." }`. Tool names may be `get_*` or carry a server prefix. Keys off the subscription throughout — never read prospect status.

**Call sequence.**

1. `get_offering(ids=[offeringId])` → best-effort only; the ids-hydrate is unreliable ("not found" for some offerings). Derive the **title** from `prospect.offeringName`, the **workspace** from the subscription's workspace-name field, and the **currency** from a position's `monies[].currency` — all in hand below.
2. `get_prospect(offering_id, term=" ")` → roster. `subscription` is null until invited (⇒ Not invited); `prospectContactMaps` carries `dataRoomLastAccessDate` and the main contact id + name; `offeringName` is the report title.
3. `get_subscription(ids=[...], summary_only=True)` for non-null `subscription.id`s. Summary mode is essential. Read `status`, `entityId`, `entityName`, `arenaName`, `amountRequested`, `modifiedAt`, `mainStates` (`lifecycle` + `stages`).
4. `get_position(entity_id=...)` for **each distinct** `entityId` **seen on the subscriptions** (auto multi-entity — no manual entity list) → committed (`account.name`, `amountCommitted.monies[].{amount,currency}`, `percentOwnership`); source of truth for committed capital + currency. The position→subscription link is unreliable; match by name.
5. `get_document(offering_id, include_views=True)` → per-doc `views`.
6. `get_activities(object_id=prospectId, object_type=5)` → last touch (optional).

**Funnel — bucket each subscription by reading its current stage** (the first stage that isn't COMPLETED or DISABLED). Don't enumerate statuses; statuses are open-ended (`Invited`, `Started`, `PendingSignature`, `Signed`, `StaffReview`, `StaffReviewCompleted`, `Countersigned`, `Accepted`, `Completed`, `Canceled`, `Declined`, `InvestorDiligenceCompleted`, …):

* `subscription == null` → **Not invited**
* status canceled/declined → **Canceled / Declined** (shown aside, not in the funnel)
* status accepted/completed, or a `POSITION_CREATION_*` stage completed → **Completed**
* else by current stage: `POSITION_CREATION_*` → **Position creation** · `STAFF_COUNTER_SIGN` → **Awaiting countersign** · `STAFF_REVIEW` → **Staff review** · `COMPLIANCE_REVIEW` → **Compliance review** · `LP_STEP_REVIEW`/`LP_STEP_SIGN` → **Awaiting signature** · any other LP step → **Invited** (if `lifecycle=="INVITED"`) else **In progress**

Render only the buckets with members, in that order. Per-bucket dollars: committed for Completed, requested for in-flight. Compliance/KYC/diligence are not special-cased — they're just stages that are enabled (vs DISABLED) in those offerings, so they surface automatically.

**Current step + LP progress (show both).** Current step = readable label of the current stage (it may be GP-side, e.g. countersign / position creation). Separately, show **"LP: N of M steps done"** = count of enabled `LP_STEP_*` stages (DISABLED excluded) that are COMPLETED — so the LP's packet progress reads regardless of where the subscription sits (an investor at "GP countersign" shows "LP: all 8 steps done"; one mid-packet shows "LP: 6 of 8 steps done"). Also surface the current stage's `blockedByDetails` when present.

**Phase stepper.** A compact bar collapsing the ~17 stages into macro phases: **LP info → Sign → Compliance → Staff review → Countersign → Position**. Skip any phase whose stages are all DISABLED (so compliance/staff review appear only when the offering uses them; a sub may have 4 or 5 segments). A phase segment is filled only when every enabled stage in it is COMPLETED; light the current phase; leave the rest empty. No "Invited" segment — invitation is the start gate, not a completed phase. Phase labels go in one legend, not per row.

**Days in step** = today − when the current stage was entered (fall back to `subscription.modifiedAt`; if neither, show no age and don't flag stuck on age). Show the subscription's `modifiedAt` as the "Last update" column.

**Money.** Position committed is `{ monies: [{ amount, currency, precision }] }` — `amount` is major units; `precision` is display-only, not a divisor; `monies` may be `[]`. `amountRequested` is a bare number (summary) or decimal string. Format with the currency from the data (default `$`/USD).

**Headline KPIs.** Committed (closed); In-flight requested (Σ requested over non-terminal buckets); Awaiting GP/staff (count in Compliance/Staff review/Awaiting countersign/Position creation); Prospect → commitment (Completed ÷ prospects). No likelihood-weighted figure — that's prospect-side and out of scope.

**Concentration.** Top investor's committed ÷ total committed; show the callout only if > ~40%.

**Engagement.** Doc views (`get_document(include_views=True)`) — a fresh view by an un-invited prospect is hot, "invited but never opened" is cold — plus `dataRoomLastAccessDate` recency. **Omit the whole section** when there are no doc views and no recorded access; note the omission in the footnote instead.

**Outstanding comments** are **not currently returned** by the connector (a full subscription exposes `contacts`, `batch`, `questionBlocks` but no comment thread). If a `comments`/`commentCount` field ever appears, surface "N open comments"; until then, don't show or fabricate it.

**Test / internal records.** Demo workspaces carry obvious test entries (names with "test"/"admin"/"placeholder", placeholder mega-amounts). Exclude them from headline figures and the action list; keep the footnote minimal.

**Rendering handoff (examples-first update).** `jsq-report-render` is now examples-first: before rendering, open its `references/example-action-report.html` (the Tarnwick Ventures reference) and match its structure — the in-flight subscription-steps table (Investor · Requested · Current step [pill + phase stepper + ministep] · Days-in-step ~ · Last update · Status flag) and the data-room table (Investor · Stage · Last access · Signal; hot=red / cold=blue / never=gray) are defined there. Then hand the body to the render skill for the brand patch + envelope (this report is the persistent-artifact target with live refresh). `visualize read_me` is only the on-demand fallback. Ownership: this skill owns content/analysis; report-render owns the look. See Skill: report-render.

## Edge cases

* **Multiple entities:** sum committed across all distinct subscription `entityId`s.
* **Missing step timestamp:** show the step without a days-in-step figure.
* **Imported positions:** a position can exist with no subscription back-link — count it as Completed; don't double-count its investor as "Not invited".
