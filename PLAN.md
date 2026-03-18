# REST API Route Tester — Upgrade Plan
## Current: v1.0.0 → Target: v2.0.0

---

## Architecture Overview

```
rest-api-route-tester/
├── rest-api-route-tester.php     # Main plugin, OOP class
├── includes/                     # NEW: split backend concerns
│   ├── class-ajax-handler.php    # AJAX request handlers
│   ├── class-route-registry.php  # Route discovery logic
│   └── class-saved-requests.php  # Persistence layer (wp_usermeta)
├── src/                          # NEW: JS source (Vite, introduced v1.2.0)
│   ├── main.js                   # Entry point
│   ├── state.js                  # State management
│   ├── tabs.js                   # Tab system
│   ├── request.js                # Request sending logic
│   ├── response.js               # Response display
│   └── ui/                       # UI components
├── assets/                       # Built output (dist stays here for WP compat)
│   ├── app.js                    # Built by Vite (v1.0.x = manual, v1.2.0+ = built)
│   └── style.css
└── templates/
    └── admin-page.php
```

**Guiding principle:** Each version is independently runnable. Versions before 1.2.0 require no build step. From 1.2.0 onward: `npm install && npm run build` (or `npm run dev` for watch mode).

---

## v1.0.1 — Security Hotfixes
**No build system. Pure PHP + vanilla JS edits.**

### PHP (`rest-api-route-tester.php`)
- Wrap `test_route()` body in `try/finally` so `wp_delete_user()` always runs even if an exception is thrown
- Add route existence check: validate submitted route exists in `rest_get_server()->get_routes()` before executing
- Add payload size guard: reject `$_POST['body']` if `strlen() > 512KB`
- Extend `$allowed_methods` to include `PATCH`, `OPTIONS`, `HEAD`
- Return HTTP status code alongside response data: `['status' => $response->get_status(), 'data' => $response->get_data()]`

### JS (`assets/app.js`)
- Replace all `.append(\`...\${route}...\`)` with DOM-safe insertion (`document.createTextNode` or `.text()`) in route dropdown rendering (lines 416, 446)
- Remove all 5 `console.log()` calls from `formatRoute()` (lines 222–230)
- Wrap all globals (`pluginRoutes`, `formattedRoutes`, `routeMethods`, `activeTabId`, `tabCounter`) in a single `const WPRRT = {}` namespace

### Visible output
Load the admin page — routes render, requests work, no console spam.

---

## v1.1.0 — Bug Fixes + Response Improvements
**No build system. Editing existing files.**

### PHP
- `get_routes()`: also return `$response->get_headers()` per route response (needed by frontend)
- `test_route()`: return `status`, `data`, and `headers` together in `wp_send_json_success()`

### JS (`assets/app.js`)
- Fix `formatRoute()`: rewrite regex to correctly handle optional groups `(?:/([^/]+))?` and trailing modifiers
- Remove the permanently-hidden `<label style="display:none">Form Params</label>` block entirely
- Response panel: display HTTP status code as a colored badge above JSON (`2xx` green, `3xx` blue, `4xx` yellow, `5xx` red)
- Response panel: add a collapsible "Response Headers" section below the status badge
- Response time: move out of JSON body, show as a small line `200 OK · 142ms` above the pre block
- AJAX failure: replace silent fail with a visible inline error message in the response panel

### Visible output
Status badge appears, response headers are inspectable, route formatting is cleaner.

---

## v1.2.0 — Build System Introduction
**Introduces npm + Vite. From here: `npm run build` required after changes.**

### New files
- `package.json` — Vite, prismjs dependencies
- `vite.config.js` — input: `src/main.js`, output: `assets/app.js` (lib mode, IIFE, no hashing)
- `src/main.js` — entry, imports all modules
- `src/state.js` — localStorage read/write (extracted from app.js)
- `src/tabs.js` — tab create/switch/close (extracted)
- `src/request.js` — AJAX send logic (extracted)
- `src/response.js` — response render + status badge (extracted)

### Syntax highlighting
- Add `prismjs` (lightweight, ~30kb). Apply to the response `<pre>` block after render.
- Apply to body/headers textareas in `input` event for live JSON highlighting (optional at this stage).

### Build commands
```
npm install
npm run dev    # watch mode
npm run build  # production build → assets/app.js
```

### Visible output
`npm run dev`, edit a source file, refresh admin — syntax-highlighted JSON response.

---

## v1.3.0 — Saved Requests + Auth Presets
**Build system required. New PHP includes file.**

### New PHP: `includes/class-saved-requests.php`
- `save_request( $user_id, $name, $data )` — stores to `wp_usermeta` key `wprrt_saved_requests`
- `get_requests( $user_id )` — returns array of saved requests
- `delete_request( $user_id, $id )` — removes by ID
- Register 3 new AJAX actions: `wprrt_save_request`, `wprrt_get_saved_requests`, `wprrt_delete_request`

### Frontend: `src/saved.js`
- Left-sidebar panel: "Saved Requests" list, loads on init
- "Save" button per tab — prompts for a name, POSTs to new handler
- Click a saved request → populates the active tab's route/method/headers/body
- Delete button per saved item

### Auth presets: `src/auth.js`
- Dropdown above the Headers textarea: "No Auth | Bearer Token | API Key | Basic Auth"
- Selecting a type auto-injects the appropriate header template into the Headers JSON field
- Preset values stored in `localStorage` under `wprrt_auth_presets`

### Visible output
Sidebar with saved requests. Auth preset dropdown auto-fills the headers field.

---

## v1.4.0 — URL Parameter Detection + cURL Export
**Build system required.**

### JS: `src/params.js`
- After a route is selected from the dropdown, parse `{paramName}` tokens from the formatted route string
- For each token, render a small labeled input below the route field (e.g. `id: [___]`)
- On `Send`, interpolate input values back into the route string before submitting
- Parameters also auto-populate the body JSON scaffold for POST/PUT routes

### JS: `src/export.js`
- "Copy as cURL" button in the response panel header
- Builds a `curl -X METHOD URL -H "header: val" -d '{"body"}'` string from current tab state
- Copies to clipboard via `navigator.clipboard.writeText()`

### Visible output
Select `/wp/v2/posts/{id}` → an `id` input appears. Fill it, send. Copy cURL button works.

---

## v1.5.0 — Request History
**Build system required. New PHP handler.**

### PHP
- New AJAX handler `wprrt_log_request` — stores last 50 requests in `wp_usermeta` key `wprrt_request_history`
- Stores: route, method, status code, response time, timestamp
- New handler `wprrt_get_history` — returns the log

### JS: `src/history.js`
- Second tab in the left sidebar (alongside Saved): "History"
- Each entry shows: `METHOD /route · STATUS · TIMEms · timestamp`
- Click → restores full request (route, method, headers, body) into a new tab
- "Clear history" button at top

### Visible output
History tab fills up as you make requests. One-click restore into a new tab.

---

## v1.6.0 — Safety + Dark Mode
**Build system required.**

### PHP
- Admin notice banner (dismissible, stores `wprrt_notice_dismissed` in usermeta):
  `"REST API Route Tester is active. This tool is intended for development only."`
  — only shows when `WP_DEBUG === false` (i.e. looks like production)

### JS: `src/theme.js`
- Dark mode toggle button (sun/moon icon) in the top-right toolbar
- Toggles a `data-theme="dark"` attribute on `#wprrt-app`
- Preference saved in localStorage

### CSS
- Add CSS custom properties (`--bg`, `--border`, `--text`, `--accent`) to all rules
- Dark theme: override variables under `[data-theme="dark"]`

### Visible output
`npm run dev` → toggle dark mode. Production WP site shows the dev warning banner.

---

## v2.0.0 — Final Release
**Build system required. Polish + export.**

### Response time graph: `src/chart.js`
- Per-route: store last 10 response times in localStorage
- Small inline sparkline (pure SVG, no library) rendered below the response time line
- Only appears after 2+ requests to the same route

### Collection export: `src/collections.js`
- "Export Collection" button in saved requests sidebar
- Outputs a JSON file matching Postman Collection v2.1 schema
- "Import Collection" — parses the same format and bulk-saves requests

### Localization
- Move all hard-coded JS strings to `wprrt_vars` (PHP `wp_localize_script`) as a `strings` key
- Populate `languages/rest-api-route-tester-en_US.po` with all PHP strings
- Run `msgfmt` to regenerate `.mo`

### Performance
- Route list: virtual-scroll the dropdown if >200 routes (avoids DOM bloat)
- Debounce route search input (already instant, but worth explicit debounce at 150ms)

### Final build
- `npm run build` → minified `assets/app.js` (~80kb target with prismjs)
- Bump plugin header to `Version: 2.0.0`
- Update `readme.txt` changelog

### Visible output
`npm run build` → full admin experience: dark mode, history, saved requests, sparkline graphs, cURL export, collection import/export.

---

## Version Summary

| Version | Theme | Build? | Key Deliverable |
|---|---|---|---|
| **v1.0.1** | Security | No | XSS fix, user cleanup, route validation |
| **v1.1.0** | Bug fixes | No | Status badge, response headers, timing display |
| **v1.2.0** | Architecture | **Yes** | Vite build, modular JS, syntax highlighting |
| **v1.3.0** | Persistence | Yes | Saved requests, auth presets sidebar |
| **v1.4.0** | UX | Yes | URL param inputs, cURL export |
| **v1.5.0** | History | Yes | Request history log + restore |
| **v1.6.0** | Polish | Yes | Dark mode, production safety notice |
| **v2.0.0** | Release | Yes | Graphs, collections, localization, perf |
