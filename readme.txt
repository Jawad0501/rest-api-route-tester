=== REST API Route Tester ===
Contributors: jawad0501
Tags: rest-api, api, testing, developer-tools
Requires at least: 5.0
Tested up to: 6.9
Stable tag: 1.4.1
Requires PHP: 8.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A WordPress admin tool to quickly test REST API routes, path params, headers, body payloads, and copy requests as cURL.

== Description ==

REST API Route Tester is a powerful tool for WordPress developers and administrators to test and debug REST API endpoints. It provides a user-friendly interface to:

* View all registered REST API routes
* Test routes with different HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
* Switch between different user roles to test permissions
* Send custom headers and body data
* View detailed responses including status codes and timing

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/rest-api-route-tester` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Use the Tools->REST Route Tester screen to use the plugin

== Frequently Asked Questions ==

= What permissions do I need to use this plugin? =

You need to have the 'manage_options' capability to use this plugin, which is typically granted to administrators.

= Can I test authenticated endpoints? =

Yes, you can test authenticated endpoints by selecting different user roles from the dropdown menu.

= How do I report bugs and request features? =

Please open a topic in our WordPress.org support forum with:

* WordPress version and PHP version
* Route and HTTP method
* Headers/body sample (remove secrets)
* Expected result vs actual result

Support forum: https://wordpress.org/support/plugin/rest-api-route-tester/

== Changelog ==

= 1.4.1 =
* Fixed role-based testing: REST permission checks now evaluate as the selected role or guest, not the logged-in administrator
* Added Guest (logged-out user) option for testing public vs authenticated routes
* Restored original user context and removed temporary filters after each test request

= 1.4.0 =
* Added URL parameter inputs for routes containing tokens such as `{id}`
* Param values are URL-encoded, substituted at send time, and persisted in localStorage
* Added "Copy as cURL" button with method, resolved URL, headers, and body
* Fixed resolved-route validation against regex-based WordPress route patterns
* Fixed route display formatting for complex regex-style parameters (named captures now render as clean `{param}` tokens)
* Added `rest_url` in `wprrt_vars` for more accurate generated cURL commands
* Added JS modules: `src/params.js` and `src/export.js`

= 1.3.0 =
* Added Saved Requests sidebar — save any request by name, click to restore into active tab
* Added auth preset dropdown (No Auth, Bearer Token, API Key, Basic Auth) — auto-fills Headers field
* Saved requests persisted per-user in wp_usermeta (max 100, newest first)
* New PHP class WPRRT_Saved_Requests with save, get_all, delete methods
* New AJAX actions: wprrt_save_request, wprrt_get_saved_requests, wprrt_delete_request
* Auth type selection persisted in localStorage tab state
* Two-column layout: sidebar left, request/response right

= 1.2.0 =
* Introduced Vite build system — source now lives in src/ and compiles to assets/app.js
* Modular JS architecture: state.js, tabs.js, request.js, response.js, main.js
* Added PrismJS syntax highlighting for JSON responses (GitHub-flavoured light theme)
* Build commands: npm run build (production), npm run dev (watch mode)
* Fixed: empty request body was rejected with "Invalid JSON data" — empty string now correctly defaults to {}

= 1.1.0 =
* Security: Fixed XSS vulnerability in route dropdown — route names now inserted via textContent, never innerHTML
* Security: test_route() now wrapped in try/finally so temporary test users are always deleted
* Security: Added 512 KB payload size limit on request body
* Security: Added route existence validation — unknown routes are rejected before execution
* Added support for PATCH, OPTIONS, and HEAD HTTP methods
* Response now returns HTTP status code and response headers alongside body data
* Response panel now shows a color-coded status badge (2xx green, 3xx blue, 4xx yellow, 5xx red)
* Response time displayed as a readable line above the body, not embedded in JSON
* Added collapsible Response Headers section in the response panel
* Fixed formatRoute() regex to correctly handle optional parameter groups
* AJAX failures now show a visible inline error message instead of a silent blank state
* Removed all debug console.log() calls from production JS
* Removed permanently-hidden dead "Form Params" field
* JS globals wrapped in WPRRT namespace object to avoid conflicts

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.4.1 =
Hotfix: correct role and guest simulation for REST permission checks. Recommended if you use role-based route testing.

= 1.1.0 =
Security release. Fixes XSS in route dropdown, orphaned test user leak, and missing input validation. Upgrade recommended.

= 1.0.0 =
Initial release