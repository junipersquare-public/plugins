# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in this plugin, please report
it privately. **Do not open a public GitHub issue.**

Email **security@junipersquare.com** with:

- A description of the issue and its potential impact
- Steps to reproduce, or a proof of concept
- Any relevant versions, configuration, or logs

We aim to acknowledge reports within three business days and will keep you updated
as we investigate. Please give us a reasonable opportunity to address the issue
before any public disclosure.

## Scope

**In scope** — this repository: the plugin manifest, MCP server configuration, and
the skill definitions and reference templates under `skills/`.

**Out of scope** — the Juniper Square platform, its APIs, and the hosted MCP server
at `mcp.junipersquare.com`. Vulnerabilities in the Juniper Square product should be
reported through Juniper Square's standard product security process rather than this
repository.

## A note on data access

This plugin contains no credentials. You sign in with your own Juniper Square account,
and the plugin's access is limited to what that account is already permitted to see.
Example data in `skills/*/references/` is synthetic and does not represent real clients,
people, or holdings.
