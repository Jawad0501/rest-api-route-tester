# Graph Report - /Users/authlab/Herd/wordpress/wp-content/plugins/rest-api-route-tester  (2026-05-21)

## Corpus Check
- 35 files · ~82,271 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 296 nodes · 394 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 1% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.86)
- Token cost: 12,480 input · 4,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Bundled app.js (Vite output)|Bundled app.js (Vite output)]]
- [[_COMMUNITY_Frontend modules (src)|Frontend modules (src/)]]
- [[_COMMUNITY_Src module implementations|Src module implementations]]
- [[_COMMUNITY_UI screenshots & product|UI screenshots & product]]
- [[_COMMUNITY_PHP RESTAPIRouteTester core|PHP RESTAPIRouteTester core]]
- [[_COMMUNITY_Plugin bootstrap & assets|Plugin bootstrap & assets]]
- [[_COMMUNITY_Docs site & security|Docs site & security]]
- [[_COMMUNITY_v1.4 params & cURL export|v1.4 params & cURL export]]
- [[_COMMUNITY_v1.4.1 hotfix & Vite history|v1.4.1 hotfix & Vite history]]
- [[_COMMUNITY_Role impersonation & test_route|Role impersonation & test_route]]
- [[_COMMUNITY_Saved requests AJAX|Saved requests AJAX]]
- [[_COMMUNITY_Saved requests (srcsaved.js)|Saved requests (src/saved.js)]]
- [[_COMMUNITY_Auth presets (srcauth.js)|Auth presets (src/auth.js)]]
- [[_COMMUNITY_Docs landing & safety|Docs landing & safety]]
- [[_COMMUNITY_Architecture roadmap (PLAN)|Architecture roadmap (PLAN)]]
- [[_COMMUNITY_Saved requests v1.3|Saved requests v1.3]]
- [[_COMMUNITY_Docs static nav JS|Docs static nav JS]]
- [[_COMMUNITY_Future v1.5v2 plans|Future v1.5/v2 plans]]
- [[_COMMUNITY_Human-readable routes|Human-readable routes]]
- [[_COMMUNITY_HTTP methods (readme)|HTTP methods (readme)]]
- [[_COMMUNITY_get_user_roles docs|get_user_roles docs]]

## God Nodes (most connected - your core abstractions)
1. `RESTAPIRouteTester` - 14 edges
2. `initializeApp` - 13 edges
3. `initializeApp()` - 12 edges
4. `test_route` - 9 edges
5. `sendRequest` - 9 edges
6. `createNewTab` - 9 edges
7. `saveState` - 9 edges
8. `createNewTab()` - 8 edges
9. `Request configuration panel` - 8 edges
10. `WPRRT_Saved_Requests` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Client-Side Auth Header Presets` --semantically_similar_to--> `Request Headers Collected but Not Applied Server-Side`  [INFERRED] [semantically similar]
  assets/app.js → rest-api-route-tester.php
- `Human-Readable Route Patterns` --semantically_similar_to--> `Readable Route Patterns (Marketing)`  [INFERRED] [semantically similar]
  README.md → docs/site/index.html
- `Development and Staging Safety Notice` --semantically_similar_to--> `Development Environment Warning`  [INFERRED] [semantically similar]
  docs/site/index.html → README.md
- `Vite Modular JS (v1.2+)` --semantically_similar_to--> `v1.2.0 Vite Build Introduction`  [INFERRED] [semantically similar]
  README.md → PLAN.md
- `Saved Requests Sidebar (v1.3)` --semantically_similar_to--> `v1.3.0 Saved Requests and Auth Presets`  [INFERRED] [semantically similar]
  README.md → PLAN.md

## Hyperedges (group relationships)
- **Admin AJAX REST Route Testing Flow** — rart_restapiroutetester, rart_fn_send_request, rart_fn_initialize_app, rart_method_test_route, rart_wprrt_vars_localization [INFERRED 0.90]
- **Saved Requests CRUD Pipeline** — rart_wprrt_saved_requests, rart_method_save_request, rart_method_get_saved_requests, rart_method_delete_request, rart_fn_save_current_tab, rart_usermeta_saved_requests [EXTRACTED 1.00]
- **Role and Guest Auth Context Switching** — rart_method_test_route, rart_method_force_current_user, rart_method_force_user_caps, rart_method_create_test_user, rart_role_impersonation, rart_guest_context_testing, rart_test_user_cleanup [EXTRACTED 1.00]
- **Version 1.4.0 Feature Bundle** — release_notes_1_4_0_url_param_inputs, release_notes_1_4_0_copy_as_curl, release_notes_1_4_0_route_validation_fix, params_js_module, export_js_module, localstorage_tab_state [EXTRACTED 1.00]
- **Version 1.4.1 Role Simulation Fix** — release_notes_1_4_1_role_based_testing, release_notes_1_4_1_guest_role, release_notes_1_4_1_context_cleanup, release_notes_1_4_1_upgrade_audience [EXTRACTED 1.00]
- **Admin-Ajax Testing API Surface** — admin_ajax, wprrt_vars, docs_site_api_wprrt_get_routes, docs_site_api_wprrt_get_user_roles, docs_site_api_wprrt_test_route, docs_site_dev_rest_do_request [EXTRACTED 1.00]
- **Request configuration form controls** — screenshot_1_plugin_filter_dropdown, screenshot_1_route_input_field, screenshot_1_http_method_dropdown, screenshot_1_headers_json_textarea, screenshot_1_form_params_textarea, screenshot_1_body_json_textarea, screenshot_1_send_button [EXTRACTED 1.00]
- **Screenshot user flow: idle → configure → response** — screenshot_1_rest_tester_admin_ui, screenshot_2_rest_tester_configured_request, screenshot_3_rest_tester_with_json_response [INFERRED 0.95]
- **REST testing core plugin concepts** — rest_api_route_tester_plugin, rest_api_testing, wordpress_rest_api, plugin_specific_route_filtering, http_method_selection, json_request_payload [INFERRED 0.85]

## Communities (31 total, 6 thin omitted)

### Community 0 - "Bundled app.js (Vite output)"
Cohesion: 0.07
Nodes (40): addAfter(), app, applyPreset(), AUTH_KEYS, AUTH_PRESETS, bindEvents(), buildRouteDropdown(), clearState() (+32 more)

### Community 1 - "Frontend modules (src/)"
Cohesion: 0.08
Nodes (40): wprrt_get_routes, wprrt_get_user_roles, wprrt_test_route, applyPreset, initAuthDropdown, AUTH_PRESETS, copyCurl, legacyCopy (+32 more)

### Community 2 - "Src module implementations"
Cohesion: 0.12
Nodes (26): copyCurl(), legacyCopy(), app, formatRoute(), initializeApp(), wrapper, parseParams(), renderParams() (+18 more)

### Community 3 - "UI screenshots & product"
Cohesion: 0.09
Nodes (31): Admin AJAX with nonce verification, Authentication via JSON headers, HTTP method selection (GET POST PUT PATCH DELETE etc), JSON request payload (headers form params body), Plugin-specific route filtering, REST API Route Tester plugin, REST API endpoint testing, Saved requests persistence (+23 more)

### Community 5 - "Plugin bootstrap & assets"
Cohesion: 0.13
Nodes (18): Admin Page Template, Admin App Bundle (app.js), Client-Side Auth Header Presets, initializeApp, saveCurrentTab, English (US) Translation Catalog, localStorage Tab State Persistence, delete_request (+10 more)

### Community 6 - "Docs site & security"
Cohesion: 0.12
Nodes (17): No Public REST Routes for Testing, Admin-Ajax API Reference Page, wprrt_get_routes AJAX Action, wprrt_test_route AJAX Action, Developer Documentation Page, rest_do_request Runtime Flow, wprrt_vars Localized Script, Static Site Build-Free Design (+9 more)

### Community 7 - "v1.4 params & cURL export"
Cohesion: 0.17
Nodes (13): WordPress admin-ajax.php, src/export.js Module, localStorage Tab State, src/params.js Module, v1.4.0 URL Params and cURL Export Plan, URL Params and cURL Export (v1.4), Copy as cURL, rest_url in wprrt_vars (+5 more)

### Community 8 - "v1.4.1 hotfix & Vite history"
Cohesion: 0.18
Nodes (11): Hotfix 1.4.1 Checklist, Fast Hotfix Response Workflow, Hotfix Ship Trigger Criteria, v1.2.0 Vite Build Introduction, Vite Modular JS (v1.2+), Role Switching for Permission Tests, 1.4.1 Hotfix Upgrade Notice, User Context Restoration (+3 more)

### Community 9 - "Role impersonation & test_route"
Cohesion: 0.24
Nodes (10): sendRequest, Guest (Logged-out) Context Testing, create_test_user, force_current_user_for_test, force_user_caps_for_test, test_route, 512 KB Request Body Size Guard, Role Impersonation for REST Tests (+2 more)

### Community 10 - "Saved requests AJAX"
Cohesion: 0.25
Nodes (9): wprrt_delete_request, wprrt_get_saved_requests, wprrt_save_request, Saved Requests sidebar, bindEvents, initSidebar, loadSaved, renderSavedList (+1 more)

### Community 11 - "Saved requests (src/saved.js)"
Cohesion: 0.39
Nodes (6): bindEvents(), initSidebar(), loadSaved(), METHOD_COLOURS, populateTabFromId(), saveCurrentTab()

### Community 12 - "Auth presets (src/auth.js)"
Cohesion: 0.5
Nodes (4): applyPreset(), AUTH_KEYS, AUTH_PRESETS, initAuthDropdown()

### Community 13 - "Docs landing & safety"
Cohesion: 0.4
Nodes (5): Documentation Site Landing Page, No Public Endpoints Added, Route Discovery Feature, Development and Staging Safety Notice, Development Environment Warning

### Community 14 - "Architecture roadmap (PLAN)"
Cohesion: 0.67
Nodes (3): Split Backend Architecture, Independently Runnable Versions, v1.0 to v2.0 Upgrade Plan

### Community 15 - "Saved requests v1.3"
Cohesion: 0.67
Nodes (3): WPRRT_Saved_Requests PHP Class, v1.3.0 Saved Requests and Auth Presets, Saved Requests Sidebar (v1.3)

## Ambiguous Edges - Review These
- `test_route` → `Request Headers Collected but Not Applied Server-Side`  [AMBIGUOUS]
  rest-api-route-tester.php · relation: rationale_for
- `renderParams` → `populateTabFromId`  [AMBIGUOUS]
  src/saved.js · relation: calls

## Knowledge Gaps
- **83 isolated node(s):** `WPRRT`, `AUTH_PRESETS`, `AUTH_KEYS`, `Prism$1`, `STATUS_LABELS` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `test_route` and `Request Headers Collected but Not Applied Server-Side`?**
  _Edge tagged AMBIGUOUS (relation: rationale_for) - confidence is low._
- **What is the exact relationship between `renderParams` and `populateTabFromId`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **Why does `wprrt_test_route AJAX Action` connect `Docs site & security` to `v1.4.1 hotfix & Vite history`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `initializeApp` connect `Frontend modules (src/)` to `Saved requests AJAX`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `WPRRT`, `AUTH_PRESETS`, `AUTH_KEYS` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bundled app.js (Vite output)` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Frontend modules (src/)` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._