# REST API Route Tester 1.5.0

## Highlights

- **WordPress 7.0** — Tested up to 7.0; AI helpers via WP AI Client when a connector is configured.
- **Bug fixes** — Custom headers and GET query params now apply to `rest_do_request`.
- **Request history** — Last 50 tests in sidebar History tab; click to open in a new tab.
- **Abilities API** — `wprrt/list-rest-routes` and `wprrt/test-rest-route` for agents (WP 6.9+).

## Fixed

- Headers (Bearer, API key, Content-Type, etc.) are sent on the REST request.
- Body JSON keys are merged as query parameters for GET, HEAD, and DELETE.
- All AJAX actions require `manage_options`.
- Safer JSON parsing for headers and body (no `sanitize_textarea_field` before decode).
- Saved requests store role, auth preset, and URL param values; restore re-renders param inputs.
- Invalid roles rejected when creating test users.
- cURL export escapes single quotes in URLs and header values.
- Route namespace filter uses `wp/v2`-style namespaces instead of a single path segment.

## Added

- **Explain response** — AI summary of status + JSON (WordPress 7.0 + Connectors).
- **Suggest body** — AI-generated sample JSON for the current route/method.
- **History tab** — Status, timing, clear history.
- Admin notice when AI connectors are not configured.

## Compatibility

- Tested up to: **7.0**
- AI features require WordPress **7.0+** and Settings → Connectors; other features work on earlier supported versions.
