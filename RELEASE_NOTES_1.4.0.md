# REST API Route Tester 1.4.0

## What's new
- Added URL parameter inputs for routes with tokens like `{id}`.
- Param values are URL-encoded and injected into the route before sending.
- Param values now persist in localStorage with tab state.
- Added "Copy as cURL" in the response panel for quick request sharing.

## Fixes
- Fixed route validation for resolved routes such as `/wp/v2/posts/123` against regex route patterns.
- Improved generated cURL URL accuracy by using `rest_url` from localized variables.

## We need your feedback
If you are actively using the plugin, please share your feedback in the WordPress.org support forum:

https://wordpress.org/support/plugin/rest-api-route-tester/

Helpful report format:
- WordPress version and PHP version
- Route + method
- Headers/body sample (without secrets)
- Expected behavior vs actual behavior
