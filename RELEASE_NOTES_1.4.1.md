# REST API Route Tester 1.4.1

## What changed

- **Role-based testing is accurate** — REST permission checks now run as the selected WordPress role (or guest), not as the administrator using the tool.
- **Guest (logged-out)** — New role option to test public vs authenticated behavior.
- **Cleanup** — Original user context is restored after each request; temporary test users and filters are cleared.

## Who should update

Anyone who uses the **role dropdown** to simulate subscribers, customers, or other roles. Results from 1.4.0 in those cases may not have reflected true permissions.

## Upgrade

Update from the WordPress admin **Plugins** screen, or deploy `1.4.1` via SVN tag as usual.

Support: https://wordpress.org/support/plugin/rest-api-route-tester/
