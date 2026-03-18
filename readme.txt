=== REST API Route Tester ===
Contributors: jawad0501
Tags: rest-api, api, testing, developer-tools
Requires at least: 5.0
Tested up to: 6.8
Stable tag: 1.0.1
Requires PHP: 7.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A tool to test WordPress REST API routes with different user roles and authentication methods.

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

== Changelog ==

= 1.0.1 =
* Security: Fixed XSS vulnerability in route dropdown — route names now inserted via textContent, never innerHTML
* Security: test_route() now wrapped in try/finally so temporary test users are always deleted
* Security: Added 512 KB payload size limit on request body
* Security: Added route existence validation — unknown routes are rejected before execution
* Added support for PATCH, OPTIONS, and HEAD HTTP methods
* Response now returns HTTP status code and response headers alongside body data
* Removed all debug console.log() calls from production JS
* Removed permanently-hidden dead "Form Params" field
* JS globals wrapped in WPRRT namespace object to avoid conflicts

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.1 =
Security release. Fixes XSS in route dropdown, orphaned test user leak, and missing input validation. Upgrade recommended.

= 1.0.0 =
Initial release