# Changelog

All notable changes to **REST API Route Tester** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where practical.

**Support:** [WordPress.org plugin forum](https://wordpress.org/support/plugin/rest-api-route-tester/)

---

## [Unreleased]

_No changes yet._

---

## [1.5.0] — 2026-05-21

### Summary

Major release: fixes long-standing gaps where the UI collected headers and query data but PHP did not apply them; adds request history, WordPress 7.0 AI helpers, Abilities API registration, and a polished admin workspace. Declares compatibility with **WordPress 7.0**.

### Added

- **Request history**
  - New sidebar **History** tab (alongside **Saved**).
  - Last **50** tests per user stored in `wp_usermeta` (`wprrt_request_history`).
  - Each entry: route, method, role, headers/body snapshot, HTTP status, server timing (ms), timestamp.
  - **Clear history** control.
  - Click an entry to open a new request tab with route, method, headers, body, and role restored.
  - AJAX: `wprrt_get_history`, `wprrt_clear_history`.
  - PHP: `includes/class-request-history.php`.

- **WordPress 7.0 AI integration** (optional; requires WP 7.0+ and a configured connector under **Settings → Connectors**)
  - **Explain response** — summarizes status code and response JSON for debugging (`wprrt_ai_explain`).
  - **Suggest body** — generates sample JSON for the current route and HTTP method (`wprrt_ai_suggest_body`).
  - Uses `wp_ai_client_prompt()` when available (`includes/class-ai-service.php`, `src/ai.js`).
  - **UI gating** — on WordPress versions before 7.0, AI controls are hidden; on 7.0+ without a connector, buttons are disabled and a **Connectors** notice is shown (`wprrt_ai_ui_state()`: `hidden` | `disconnected` | `ready`; `ai_show_ui`, `ai_ready`, `connectors_url` in `wprrt_vars`).
  - Admin notice on the tester screen when AI is supported but connectors are not configured.
  - Localized strings and `ai_available` flag in `wprrt_vars`.

- **Abilities API** (WordPress 6.9+ / 7.0 agent workflows)
  - `wprrt/list-rest-routes` — list registered REST routes (optional `namespace` filter, e.g. `wp/v2`).
  - `wprrt/test-rest-route` — execute `rest_do_request` with route, method, headers, and body (admin capability).
  - Category: `wprrt` (`includes/class-abilities.php`).

- **Shared request helpers** (`includes/helpers.php`)
  - `wprrt_require_ajax_admin()` — nonce + `manage_options`.
  - `wprrt_decode_json_post()` — safe JSON decode from POST.
  - `wprrt_apply_request_payload()` — headers + body/query params on `WP_REST_Request`.
  - `wprrt_route_exists()` — route validation helper.
  - `wprrt_ai_available()` — AI client readiness check.

### Fixed

- **Custom headers now affect REST requests** — `Authorization`, `Content-Type`, API keys, etc. are applied via `WP_REST_Request::set_header()` (previously decoded but ignored).
- **GET / HEAD / DELETE query parameters** — keys from the Body (JSON) field are merged as query params on the REST request (previously only POST/PUT/PATCH body params were set).
- **Capability checks** — `wprrt_get_routes` and `wprrt_get_user_roles` now require `manage_options`, consistent with other actions and documentation.
- **JSON handling** — headers and body are no longer passed through `sanitize_textarea_field()` before `json_decode`; invalid headers JSON returns a clear error.
- **Saved requests completeness** — persist and restore **role**, **auth preset** (`auth_type`), and **URL parameter** values; `populateTabFromId` calls `renderParams()` after load.
- **Invalid roles** — `create_test_user()` validates against `wp_roles()->is_role()` before assignment.
- **cURL export** — single quotes in URLs and header values are escaped to avoid broken shell commands.
- **localStorage corruption** — `loadState()` catches parse errors and clears invalid state.
- **Request history** logged to the wrong user while testing as Guest or another role (entries went to user ID `0` or a deleted ephemeral test user, so the History sidebar stayed empty for the admin). History is now stored on the admin who sent the test (`$original_user_id`).
- History list refreshes when opening the **History** sidebar tab.
- **Save** shows an alert when the server rejects or fails the save request (previously failed silently).

### Changed

- **Route filter label** — "Plugin" dropdown renamed to **Namespace**; grouping uses REST-style namespaces (e.g. `wp/v2`) instead of only the first URL segment.
- **Test user emails** — ephemeral users use `@wprrt.local` instead of `@example.com`.
- **Admin UI/UX**
  - Sidebar **Saved** / **History** tabs; wider sidebar (320px) with improved list readability.
  - Two-column **workspace** (`wprrt-workspace`): request form + response panel; response panel sticky on large screens.
  - Form grouped into **Request**, **Payload**, and **Headers** sections; auth preset lives in **Headers**.
  - **Suggest body** beside the body field; suggestions in an inline card with **Apply to body** / **Dismiss**.
  - **Explain** in the response toolbar; answers in **JSON | AI insight** tabs (same panel, no scrolling to the form).
  - Shared button styles (`.wprrt-btn`) and response view tabs.
  - Response panel **fixed height** (`--wprrt-response-height`) with `overflow-y: auto` on JSON body, AI insight, and long response-header blocks.
  - Accent colors aligned closer to WordPress 7.0 admin palette.
- **Version constant** — `WPRRT_VERSION` (`1.5.0`) used for enqueued assets.
- **Documentation** — `AGENTS.md` updated for graphify-first workflow and 1.5.0 architecture.

### Developer notes

- New JS modules: `src/history.js`, `src/ai.js`, `src/ui-response.js`.
- `WPRRT_Saved_Requests::save()` signature extended with `$role`, `$auth_type`, `$params`.
- Built assets: run `npm run build` after editing `src/` (Vite → `assets/app.js`).

### Compatibility

- **Tested up to:** WordPress **7.0**
- **Requires at least:** WordPress 5.0 (unchanged)
- **Requires PHP:** 8.0 (unchanged)
- AI features: WordPress **7.0+** + Connectors; all non-AI features work on earlier supported versions.

### Upgrade notice

**Recommended for all users.** Headers and GET query params now behave as the UI implies. If you relied on role simulation, stay on 1.4.1+; 1.5.0 retains those fixes and adds history and optional AI tools.

---

## [1.4.1] — 2026 (hotfix)

### Summary

Security and correctness hotfix for **role-based** and **guest** REST testing. Permission checks had been evaluating as the logged-in administrator instead of the selected role.

### Fixed

- **Role impersonation** — `determine_current_user` and `user_has_cap` filters force REST auth to use a temporary user with the selected role.
- **Guest (logged-out) testing** — new **Guest (Logged-out User)** option; request context runs with no authenticated user.
- **Context cleanup** — `try` / `finally` restores the original user, removes filters, and deletes temporary test users after every test.

### Added

- Guest role option in the role selector (`guest`).

### Upgrade notice

**Required** if you use the role dropdown to test subscriber, customer, editor, or other non-admin permissions. Results from **1.4.0** for role simulation may not reflect true REST permissions.

---

## [1.4.0]

### Summary

UX release: URL path parameters, Copy as cURL, and improved route formatting/validation.

### Added

- **URL parameter inputs** — routes with `{id}`-style tokens show labeled inputs; values are URL-encoded and substituted at send time (`src/params.js`).
- **Param persistence** — param values saved in `localStorage` with tab state.
- **Copy as cURL** — builds a curl command from method, resolved URL, headers, and body (`src/export.js`).
- **`rest_url` in `wprrt_vars`** — accurate base URL for generated cURL commands.
- JS modules: `src/params.js`, `src/export.js`.

### Fixed

- **Route validation** — resolved paths like `/wp/v2/posts/123` validate against regex-registered route patterns, not only exact route keys.
- **Route display formatting** — named capture groups `(?P<id>…)` render as `{id}`; improved handling of optional groups and regex noise in `formatRoute()`.

### Changed

- Form actions row includes **Copy as cURL** alongside Send and Save.

---

## [1.3.0]

### Summary

Persistence release: saved requests, auth header presets, and two-column admin layout.

### Added

- **Saved Requests sidebar** — save named requests; click to restore into the active tab (max **100** per user, newest first).
- **Auth presets** — No Auth, Bearer Token, API Key, Basic Auth; merges into Headers JSON (`src/auth.js`).
- **PHP:** `includes/class-saved-requests.php` — `WPRRT_Saved_Requests` (usermeta key `wprrt_saved_requests`).
- **AJAX:** `wprrt_save_request`, `wprrt_get_saved_requests`, `wprrt_delete_request`.
- **Layout** — fixed left sidebar (saved list) + main area (tabs, form, response).
- **localStorage** — auth preset selection persisted per tab.

### Changed

- `initializeApp()` builds two-column `wprrt-layout` wrapper.

---

## [1.2.0]

### Summary

Architecture release: Vite build pipeline, modular JavaScript, and JSON syntax highlighting.

### Added

- **Vite** build (`vite.config.js`, `package.json`) — `src/` → IIFE `assets/app.js`.
- **Modules:** `src/main.js`, `src/state.js`, `src/tabs.js`, `src/request.js`, `src/response.js`.
- **PrismJS** — syntax highlighting for JSON response body.
- **Scripts:** `npm run build`, `npm run dev` (watch).

### Fixed

- Empty request body no longer triggers "Invalid JSON data"; empty string defaults to `{}`.

### Changed

- Production JS is built from `src/`; edit sources and rebuild instead of editing `assets/app.js` directly.

---

## [1.1.0]

### Summary

Security and response UX release. No build step required (pre-Vite workflow).

### Security

- **XSS** — route dropdown options use `textContent` / DOM APIs, not `innerHTML` with route strings.
- **Test user leak** — `test_route()` wrapped in `try` / `finally` so temporary users are always deleted.
- **Payload limit** — request body capped at **512 KB**.
- **Route validation** — unknown routes rejected before `rest_do_request()`.

### Added

- HTTP methods: **PATCH**, **OPTIONS**, **HEAD**.
- Response payload includes **HTTP status** and **response headers**.
- **Status badge** — color by class (2xx / 3xx / 4xx / 5xx).
- **Response time** — shown above body (not inside JSON).
- **Collapsible response headers** section.
- Visible **AJAX error** message on failure (no silent blank panel).

### Fixed

- `formatRoute()` handles optional parameter groups more reliably.
- Removed debug `console.log()` calls from production JS.
- Removed hidden dead **Form Params** UI block.
- JS globals consolidated under **`WPRRT`** namespace.

### Changed

- `get_routes` returns method metadata per route (`methods`, `primary_method`).

---

## [1.0.0]

### Summary

Initial public release.

### Added

- WordPress admin menu: **REST Tester** (`manage_options`).
- List registered REST routes via Admin AJAX (`wprrt_get_routes`).
- Test routes via `rest_do_request()` (`wprrt_test_route`).
- HTTP methods: GET, POST, PUT, DELETE (extended in 1.1.0).
- Role selector for permission testing (refined in 1.4.1).
- Headers and body JSON fields.
- Tabbed request UI and response panel.
- Nonce-protected AJAX (`wprrt_nonce`).
- Main plugin class `RESTAPIRouteTester` in `rest-api-route-tester.php`.

---

## Version comparison (at a glance)

| Version | Theme | Build required |
|--------|--------|----------------|
| 1.5.0 | Headers/query fix, history, WP 7.0 AI, Abilities, admin UI polish | Yes (`npm run build`) |
| 1.4.1 | Role/guest simulation fix | Yes |
| 1.4.0 | URL params, cURL export | Yes |
| 1.3.0 | Saved requests, auth presets | Yes |
| 1.2.0 | Vite, modules, Prism | Yes |
| 1.1.0 | Security, response UX | No (legacy) |
| 1.0.0 | Initial release | No (legacy) |

---

## Links

- [Plugin on WordPress.org](https://wordpress.org/plugins/rest-api-route-tester/)
- [Support forum](https://wordpress.org/support/plugin/rest-api-route-tester/)
- [Release notes 1.5.0](RELEASE_NOTES_1.5.0.md)
- [Release notes 1.4.1](RELEASE_NOTES_1.4.1.md)
- [Release notes 1.4.0](RELEASE_NOTES_1.4.0.md)
