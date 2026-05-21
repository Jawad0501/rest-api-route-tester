# AGENTS.md — REST API Route Tester

> **Always consult `graphify-out/` before reading source files.** Use the knowledge graph for orientation, then open only the files the graph points to.

---

## 1. Graphify-first navigation (mandatory)

This repo includes a pre-built knowledge graph in [`graphify-out/`](graphify-out/). Treat it as the **first** source of truth for architecture, dependencies, and where to look in code.

### Order of operations

1. **Start in `graphify-out/`** — do not grep the tree or read random files until you have context from the graph artifacts below.
2. **Read targeted source files** — open only paths named in the graph (via `source_file` on nodes/edges, or community hubs in the report).
3. **Re-run graphify when the corpus changes** — after large doc/code edits, run `/graphify` (or `graphify --update`) so `graphify-out/` stays current.

### What to read (in order)

| Priority | File | Use for |
|----------|------|---------|
| 1 | [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md) | God nodes, communities, surprising connections, ambiguous edges, suggested questions |
| 2 | [`graphify-out/.graphify_labels.json`](graphify-out/.graphify_labels.json) | Short community names (e.g. role impersonation, saved requests, v1.4 cURL) |
| 3 | [`graphify-out/graph.json`](graphify-out/graph.json) | Machine-readable nodes/edges, `source_file`, confidence (`EXTRACTED` / `INFERRED` / `AMBIGUOUS`) |
| 4 | [`graphify-out/graph.html`](graphify-out/graph.html) | Interactive exploration when relationships are unclear |

Optional CLI (from plugin root, if `graphify` is installed):

```bash
graphify query "how does test_route apply headers?"
graphify path "sendRequest" "test_route"
graphify explain "RESTAPIRouteTester"
```

Prefer **graph-backed answers** over re-scanning the whole repo. If the graph lacks an edge or marks it `AMBIGUOUS`, then read the cited `source_file` and update mental model — do not invent connections.

---

## 2. Repository purpose

**WP REST Route Tester** — WordPress admin tool to discover and test REST routes (plugin filter, HTTP methods, JSON headers/body, role/guest impersonation, saved requests, Copy as cURL). Inspired by Postman; runs via **Admin AJAX** (`wprrt_*` actions), not public REST endpoints for the tester UI itself.

| Layer | Location |
|-------|----------|
| PHP bootstrap & AJAX | `rest-api-route-tester.php`, `includes/class-saved-requests.php` |
| Admin UI bundle | `assets/app.js` (built from `src/` via Vite — `vite.config.js`) |
| Frontend modules | `src/main.js`, `src/request.js`, `src/response.js`, `src/params.js`, `src/auth.js`, `src/tabs.js`, `src/saved.js`, `src/state.js`, `src/export.js` |
| Static docs site | `docs/site/` |
| Product docs | `README.md`, `readme.txt`, `PLAN.md`, `RELEASE_NOTES_*.md` |

---

## 3. Version 1.5.0 notes

- **History:** `includes/class-request-history.php`, sidebar History tab, AJAX `wprrt_get_history` / `wprrt_clear_history`.
- **AI (WP 7.0):** `includes/class-ai-service.php`, AJAX `wprrt_ai_explain` / `wprrt_ai_suggest_body`, `src/ai.js`. Requires `wp_ai_client_prompt()` + Connectors (`options-connectors.php`).
- **Abilities:** `includes/class-abilities.php` — `wprrt/list-rest-routes`, `wprrt/test-rest-route`.
- **Request building:** `includes/helpers.php` — `wprrt_apply_request_payload()` applies headers and query/body params.

## 4. Core abstractions (from graph)

Use the graph for detail; these are the usual entry points:

- **`RESTAPIRouteTester`** — plugin class, menus, script localize (`wprrt_vars`), AJAX handlers.
- **`test_route`** — server-side route execution, role/guest switching, body size guard.
- **`WPRRT_Saved_Requests`** — per-user saved requests in usermeta.
- **`initializeApp` / `sendRequest`** — client boot and AJAX test dispatch.
- **Communities** — bundled `app.js` vs `src/` modules vs PHP core vs docs/releases (see labels in `graphify-out/`).

Headers are applied in `test_route` via `wprrt_apply_request_payload()` (fixed in 1.5.0).

---

## 5. Development conventions

- **Build UI:** `npm run build` (Vite → `assets/app.js`). Do not edit `assets/app.js` by hand for feature work; change `src/` and rebuild.
- **Security:** Admin AJAX uses nonces and `manage_options`; keep capability checks on new actions.
- **Scope:** Minimal diffs; match existing jQuery/vanilla patterns in `src/`.
- **Version docs:** Update `readme.txt`, release notes, and `docs/site/` when shipping user-visible changes.

---

## 6. When graphify-out is missing or stale

If `graphify-out/GRAPH_REPORT.md` or `graphify-out/graph.json` is absent:

1. Run `/graphify` on this plugin directory (or ask the user to run it).
2. Until then, fall back to `README.md`, `docs/site/api.html`, and `rest-api-route-tester.php` — but prefer restoring the graph before deep refactors.

After substantive code changes, suggest `/graphify --update` so AST/semantic cache stays aligned.
