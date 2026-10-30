![Juniper Square](assets/banner.svg)

# Juniper Square — Claude Plugin

Connect Claude Code and Claude Cowork to the Juniper Square private markets platform, and
work with your investor and fund data through natural conversation.

**Requirements:** an active Juniper Square account with MCP access enabled.

---

## What Claude can reach

Through the Juniper Square MCP server, Claude can work with:

- **Investors** — contacts, investment accounts, and investment entities
- **Fundraising** — offerings, prospects, and subscriptions
- **Performance** — positions, including commitments, capital called, distributions,
  NAV, and returns
- **Documents** — by account, offering, or entity, filtered by category or date
- **Activity** — notes, emails, and calendar events

---

## Skills

Claude activates these on its own, based on what you ask for.

| Skill | When Claude invokes it |
|-------|------------------------|
| `investor-tearsheet` | "tearsheet for [contact]", "prep me for my meeting with [LP]", "brief me on [LP]" |
| `offering-action-report` | "action report for [offering]", "what needs my attention on [offering]", fundraise status checks |
| `entity-org-chart` | "org chart", "entity structure diagram", "ownership chart", "show me Fund Y's structure" |
| `document-coverage-audit` | "K-1 audit", "who's missing a K-1", "tax document check", "document coverage for Fund III" |
| `juniper-square-data-model` | Any question about Juniper Square objects (Contact, Account, Offering, Position, etc.) or how they relate |
| `juniper-square-studio` | "open Studio", "what can I build with Juniper Square", "show me ideas", "help me get started" |
| `juniper-square-report-design` | Shared report design used by the report skills above and Studio — not invoked directly |

---

## Platform support

| Client | Support |
|--------|---------|
| **Claude Code** (CLI) | Full — tools + skills |
| **Claude Cowork** | Full — tools + skills |
| **Claude Desktop / Web / Mobile** (Settings → Integrations) | Tools only — no skills |

---

## Installation

If your administrator has already rolled the plugin out, it appears automatically — skip
to [Verifying it works](#verifying-it-works).

### Claude Code (CLI)

```bash
/plugin marketplace add junipersquare-public/plugins
/plugin install junipersquare@junipersquare
```

### Claude Desktop / Web / Mobile

These clients support the tools but not the skills:

1. Open **Settings → Integrations → Add a connector → Custom → Web**
2. Enter the server URL: `https://mcp.junipersquare.com/mcp`
3. Leave **OAuth Client ID** and **Client Secret** blank — they aren't needed
4. Click **Connect** — a browser window opens for your Juniper Square login

### Verifying it works

Run `/mcp`. `junipersquare` should appear, along with the tools available to your account.

---

## Authentication and data

Nothing to copy-paste. On first use Claude opens a browser window for your normal
Juniper Square login, then keeps you signed in automatically. The plugin never sees your
password.

Your access level matches your Juniper Square account — the plugin cannot reach anything
you can't already reach. GP staff and LP portal users see different field sets.

The plugin itself holds no credentials and stores no data; it is a set of skill
definitions plus a pointer to the Juniper Square MCP server. Data flows between your
Claude client and `mcp.junipersquare.com`, governed by your existing Juniper Square
agreement rather than by this repository. Example data in `skills/` is synthetic — the
firms, people, and figures are fictional.

---

## Rolling out to your organization

Administrators can enable the plugin for everyone at once, so individual users don't need
to install anything.

**Claude Cowork** — in the admin dashboard, go to **Customize → Plugins → Private
Marketplace**, connect the GitHub repo `junipersquare-public/plugins`, and enable
**Sync automatically**. Users get the plugin on their next session.

**Claude Code** — add the marketplace and plugin to a shared `.claude/settings.json`
distributed to your team, using the `extraKnownMarketplaces` and `enabledPlugins` keys.
See the [Claude Code plugin marketplace
documentation](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces) for the
current settings format.

---

## Troubleshooting

**`/mcp` shows `junipersquare` as failed, or no login window appears**
- Run `/mcp` again — Claude will retry signing you in
- Check that you can reach `mcp.junipersquare.com` and your Juniper Square login domain
- Contact your Juniper Square administrator if your account doesn't have MCP access enabled

---

## Contributing

This repository is published and maintained by Juniper Square. We don't accept external
pull requests. For bugs, feature requests, or access problems, contact your Juniper Square
administrator.

To report a security vulnerability, see [SECURITY.md](SECURITY.md) — please don't open a
public issue.

---

## License

Licensed under the [Apache License, Version 2.0](LICENSE). See
[NOTICE](NOTICE) for trademark usage and third-party content terms.
