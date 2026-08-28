---
name: juniper-square-data-model
description: Reference for the Juniper Square data model — the core objects (Contact, Account, Offering, Prospect, Subscription, Position, Investment Entity, Activity, etc.), how they relate, and how to reason about them when answering questions or calling Juniper Square MCP tools. Use this skill whenever a user asks about Juniper Square data — investors, fundraises, offerings, subscriptions, capital calls, NAV, distributions, GP workspaces — or any time you need to resolve what a term like "entity" or "investor" maps to before querying. Also use when aggregating across Juniper Square records, when disambiguating objects that share a name, or when deciding which object holds the answer (e.g., Subscription vs. Position for committed vs. executed capital).
---

# Juniper Square data model

## Context

Juniper Square is an investment management platform used by General Partners (GPs) — private real estate, private equity, and similar firms — to manage investor relationships, fundraises, and positions. Each GP has its own instance, a **GP Workspace**. GP Staff users inside a workspace manage Contacts (investors), run Offerings (fundraises), and track Positions (executed holdings). Every object and query below is automatically scoped to one workspace. (Some tool outputs use a legacy name for the workspace field; treat it as "workspace.")

## IDs

Pass object IDs to MCP tools as strings, exactly as returned by other tool responses. Every tool also requires a `telemetry.intent` argument.

## Core objects

**Contact** — an investor, person or organization (`contactType`). Exposes name parts, `title`/`jobTitle`, `websiteUrl`/`linkedinUrl`, `notes`/`staffNotes`, `assignee`, `tags`, custom fields, and child collections: `emails`, `phones`, `addresses`, `relations`, `pastEmployments`, `offerings`, `accounts`, `prospects`, `positions`, and `portal` metadata. **For an organization the name is stored in** `lastName` (`firstName` null). May carry third-party enrichment. Not exposed: created/modified or last-contacted timestamps, tax ID, linked-employer/referrer edges, contact-level transaction totals, photo, access groups, and CRM-integration fields.

**Account** — the legal entity through which a Contact invests (LLC, trust, IRA, etc.). Contacts ↔ Accounts are many-to-many. Account and Investment Entity share the same underlying type. This is why tools accept both `account_id` and `entity_id` — pick the parameter matching which side you mean. Accounts can themselves be flagged person/org (`is_person`, `is_org`), but for any person/org question use **Contacts**, not Accounts (see Reasoning).

**Offering** — a container for an active fundraise. Optionally linked 1:1 to a Data Room.

**Data Room** — the investor-facing portal where Offering materials live. Exists only when enabled for an Offering.

**Document** — a file attached to an Account, Investment Entity, Position, Offering, or collection (K-1, distribution notice, capital call, tax form, subscription agreement, etc.). `get_document` returns each document's metadata (name, `category_name`, `state`, `as_of_date`, `file_size`), view analytics, and a download link, scoped by `account_id` / `entity` / `position_id` / `offering_id` / `collection_id` / `ids`.

**Lead** — the result of an external lead-capture form. Transient: once promoted to a Contact + Prospect, the Lead record is deleted. Do not reference Leads after promotion.

**Prospect** — links Contact(s) to an Offering. A prospect can map _several_ contacts (via `prospectContactMaps`, each carrying `isMainContact` and a per-contact `dataRoomKey`), and a single contact can have _multiple_ prospects in the same offering. Holds metadata like `amountExpected`, `likelihood`, and `prospectStatus` (`New`, `Closed`, …). Has **at most one** Subscription — `subscription` is frequently `null` until the investor is invited; committing additional capital requires a new Prospect.

**Subscription** — the legal packet a Prospect completes to commit capital. Carries `status` (`Invited`, `PendingSignature`, `Countersigned`, …), the target `entityId`/`entityName`, a `mainStates.stages` workflow (LP steps → staff review → countersign → position creation), and, in full mode, `questionBlocks` and signatory `contacts` keyed by `contactUUID` (not numeric contact IDs). At most one per Prospect; discover its ID via `prospect.subscription.id`.

**Position** — an executed holding, created after a Subscription is executed. Each Position belongs to exactly one Account and one Investment Entity; an Account holds many Positions, an Investment Entity has many Positions — one account may hold several within a single entity. Carries `amountCommitted` / `initialAmountCommitted`, `percentOwnership`, `ownershipUnit` (e.g. Commitment) / `investorGroup`, ownership/commitment snapshots, and `performanceMetrics`: `irr`, `tvpi`, `dpi`, `rvpi` (+`effectiveDate`) — the per-fund return figures behind a tearsheet. Supports custom fields (its `extensionFields` come back inline with definitions, even though `get_extension_field_definitions` can't list them). **Positions — not Subscriptions — are the source of truth for committed capital, ownership, and performance after execution** (see Tool quirks for what Position does and doesn't return).

**Investment Entity** (often just "Entity") — the GP's legal fund vehicle that issues Positions. Entities ↔ Offerings are many-to-many. Supports custom fields. Status is `Active` or `Completed`.

**Activity** — a meeting note, call note, email, or similar log. Not a single object: the feed is a union over **Notes**, **Emails** (JSQ-sent), **Stored Emails** (BCC'd Outlook), and **Calendar Events**. A single Activity may reference several objects at once. When summarizing, name the related objects so the context is clear. **Note-type** activities support custom (extension) fields — set `include_extension_fields=True` or filter via `extension_field_filters`; emails, stored emails, and calendar events do not.

**Email** — two kinds, both surfaced in the Activity feed: **Email** (sent from within Juniper Square — capital call/distribution notices; includes engagement data: opens, clicks) and **Stored Email** (archived Outlook mail captured via BCC plug-in). Both carry sender, recipients, subject, body, date, direction, and link to the same objects as Activity.

**GP Staff** — the users who work for the GP and log into the workspace. Each workspace has its own set.

## Relationship summary

* Contact ↔ Account: many-to-many (accounts are often shared across several contacts via `accountContactMaps`)
* Contact ↔ Prospect: many-to-many — a contact can have several prospects (even within one offering), and a prospect can map several contacts
* Prospect → Subscription: at most one; frequently null until the investor is invited
* Subscription → Position: one Position per Subscription, created on execution
* Account → Position: one Account holds many Positions (several may fall in one entity)
* Investment Entity → Position: one Entity has many Positions
* Offering ↔ Investment Entity: many-to-many
* Offering ↔ Data Room: zero-or-one Data Room per Offering
* Activity: may link to multiple objects in a single record

## How to reason about Juniper Square data

**Routing rules (apply first):**

* A question about a **person or organization** → use **Contacts**. Never route a person/org lookup to Accounts, even though Accounts carry person/org flags.
* A question about an **investment, position, or fund** → use **Investment Entities** (and their Positions), **not Offerings**. Offerings are fundraise containers, not the fund vehicle.

**If it isn't covered, say so.** When a request needs data, a field, or a record type the tools don't return, tell the user plainly that it isn't available through this connector today — don't guess, approximate, or pull from elsewhere. Answer the specific ask; don't recite the full list of gaps.

**Disambiguate before querying.** If a term maps to multiple objects, resolve it first. The classic case is "entity": an Investment Entity (GP-side fund vehicle) vs. an Account (investor-side legal entity) — ask if ambiguous. When the user omits filtering criteria, assume broad scope (e.g., all Offerings, not just active) and say so.

**Use Position, not Subscription, for post-execution economics.** Subscriptions describe the commitment; Positions describe what was executed — committed amount, ownership %, and performance metrics (IRR/TVPI/DPI/RVPI).

**Convert money amounts before showing them.** Structured money comes as `{monies: [{amount, currency, precision}]}` where `amount` is an integer in **minor units** — always **divide by 10^**`precision` to get the real value (e.g. `amount: 100000000, precision: 2` = $1,000,000, _not_ $100,000,000). Skipping this overstates every figure by 100×. `monies` is a list (multi-currency) and may be empty. Other money fields differ: `amountExpected` may arrive pre-formatted (`"$250,000.00"`) and some `amountRequested` fields are bare or decimal-string numbers — check each field's type before doing math.

**Compute aggregations from retrieved data.** For totals, averages, or counts, pull the underlying records and compute yourself.

**Unknown field names are probably custom (extension) fields.** Contact, Offering, Position, Investment Entity, Prospect, and Note-type Activities all support them in the model. But `get_extension_field_definitions` only enumerates **Contact** fields — for other objects, treat custom values as opaque (read them off the record; you can't list their definitions). If a user references an unrecognized field on an eligible object, assume a custom field, not a typo. Note: only `int` / `float` / `string` / `date` extension-field values come through — **enumeration, datetime, and range-typed (int/numeric/date range) values are not surfaced**, so an enum or date-range custom field may read as empty even when set.

**Account custom data is different.** Accounts use a separate custom-data accessor with its own permission gate — not extension fields, and not covered by `get_extension_field_definitions`.

**Leads disappear on promotion.** Once a Lead becomes a Contact + Prospect, the Lead record is gone — don't try to look it up after.

**Name related objects when summarizing Activities.** An Activity alone is hard to interpret — surface the linked Contact / Prospect / Account / Offering / Entity names.

## Tool quirks & limitations

Every tool is named `get_*` and requires a `telemetry.intent` argument.

* **No global search for Subscriptions or Prospects.** Discover Subscription IDs via `get_prospect` (`prospect.subscription.id`) — the Position back-link is unreliable. Discover Prospects scoped to an Offering or a Contact. `get_prospect` mode priority: `offering_id` > `contact_id` > `ids`.
* **Extension-field definitions are Contact-only.** `get_extension_field_definitions(object_type=...)` accepts only `"contact"`; other types error.
* **Activity feed object types are limited.** `get_activities(object_id, object_type)` supports only `3=contact, 5=prospect, 9=position, 27=lead`. Offering, account, and entity are rejected — reach their activity via the dashboard feed's `offerings_filter` / `entities_filter` instead. `max_results` is capped at 20; `note_type_filter` and `sync_filter` (sync source) results should be verified client-side.
* `get_contacts` `position_in_filter` is not implemented — it returns all contacts regardless of the offerings passed. Use `prospect_for_filter` to scope by offering instead.
* `get_entity` search `status` is title-case (`Active`/`Completed`); `term` cannot be empty.
* `get_accounts` `object_filter` values: `is_entity`, `is_person`, `is_org`, `is_not_entity`, `is_account_for_owning_positions`.
* `get_position` `term` requires `entity_id`. Returns commitment, ownership, snapshots, and `performanceMetrics` (IRR/TVPI/DPI/RVPI) — not per-transaction capital calls/distributions, NAV, or capital-account balances. Performance figures populate only where the fund has computed valuations (TVPI/RVPI are often null without a current NAV). To list an account's positions, resolve its ID via `get_accounts`, then call `get_position(account_id=…)`.
* `get_document` is staff-only (LP users get a permission error) and may be disabled in a given workspace (returns a clean `feature_unavailable` envelope, not an error). When enabled it returns document metadata, view analytics (`include_views`), and a download link across `account_id` / `position_id` / `offering_id` / `entity` / `collection_id` / `ids`. A scope parameter is required.
* `get_accounts` **term-search includes Investment Entities** (rows with `isInvestmentEntity: true`). For true investor accounts only, pass `object_filter="is_not_entity"`.
* `get_contacts` `include_*` **flags duplicate data.** Base hydration (`ids` mode) already returns `accounts`, `prospects`, and `extensionFields` (camelCase). `include_account_links` / `include_prospect_links` / `include_extension_fields` re-emit the same data again under snake_case keys (`account_links`, `prospect_links`, `extension_fields`) — redundant and payload-bloating; usually leave them off.
* `get_subscription` **full payloads are very large** — `questionBlocks` embeds entire legal questionnaires (accredited-investor / qualified-purchaser text). Use `summary_only=True` for bulk reads. Full-mode signatory `contacts` are keyed by `contactUUID`, not the numeric contact IDs used elsewhere; `account.accountId` may be null pre-position-creation.
* `dataRoomKey` lives on `prospectContactMaps` (per contact), is null until the data room is provisioned, and is required for the `get_subscription` documents pass. Document `lpDocumentUrl`s may be null when nothing is uploaded; template rows use negative `subscriptionDocumentId`s.
