# Hotfix Window Checklist (1.4.1)

Use this only if a critical issue is reported after `1.4.0` release.

## Trigger criteria (ship 1.4.1)
- Fatal error or admin page not loading.
- Requests cannot be sent for common flows.
- Route param handling breaks valid requests.
- cURL export generates unusable commands for normal cases.
- Security regression.

## Fast response workflow
1. Reproduce issue with minimal steps.
2. Confirm severity and impact scope.
3. Patch only the critical issue (no scope creep).
4. Rebuild assets (`npm run build`) if JS changes.
5. Smoke test main flows:
   - Route select + params
   - Send request with headers/body
   - cURL export
6. Update `readme.txt` changelog with `= 1.4.1 =`.
7. Publish and post support update with workaround/fix note.

## Communication template
`We identified a critical issue in 1.4.0 affecting <area>. A hotfix (1.4.1) is now available. Please update and let us know if you still see the issue with your route, method, and WP/PHP version details.`
