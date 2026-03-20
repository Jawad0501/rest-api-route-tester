# Rest API Route Tester
Version: 1.4.0
Author: Nowshad Jawad
Requires at least: 4.5
Tested up to: 6.9
Stable Tag: 1.4.0
License: GPLv2 or later


A powerful WordPress plugin that provides a user-friendly interface to test WordPress REST API endpoints directly from your WordPress admin panel. This plugin is inspired by Postman's functionality but integrated directly into WordPress.

## Features

### 1. Plugin-Specific Route Testing
- Filter and test REST API endpoints by plugin
- View all available routes from a specific plugin
- Option to view routes from all plugins at once

### 2. Smart Route Selection
- Editable route input field with dropdown suggestions
- Automatic route parameter formatting for better readability
- Converts complex WordPress route patterns into human-readable format
  - Example: `(?P<id>[0-9]+)` becomes `{id}`
  - Example: `([0-9]+)` becomes `{}`

### 3. Comprehensive Request Testing
- Support for all HTTP methods:
  - GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
- Customizable request components:
  - Headers (JSON format)
  - Request Body (JSON format)

### 4. User-Friendly Interface
- Clean and intuitive admin interface
- Real-time response display
- Formatted JSON response output
- Easy-to-use dropdown menus and input fields

### 5. Security
- WordPress nonce verification
- Admin-only access
- Secure AJAX handling

## Installation

1. Download the plugin files
2. Upload the plugin folder to your WordPress plugins directory (`wp-content/plugins/`)
3. Activate the plugin through the WordPress admin panel
4. Access the tester from the WordPress admin menu

## Usage

1. Navigate to the plugin's admin page in WordPress
2. Select a plugin from the dropdown to filter its routes (or choose "All Plugins")
3. Choose a route from the dropdown or type your own
4. Select the HTTP method (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
5. Configure your request:
   - Add headers in JSON format
   - Add request body in JSON format (for POST / PUT / PATCH)
6. Click "Send" to test the endpoint
7. View the response in the formatted output area

## Requirements

- WordPress 5.0 or higher
- PHP 8.0 or higher
- jQuery (included with WordPress)

## Security Notes

- This plugin should only be used in development environments
- Ensure proper user capabilities are set
- Always use nonces for AJAX requests
- Consider disabling the plugin in production environments


## Changelog

### 1.4.0
- URL parameter detection — `{param}` tokens in a selected route render labeled input fields below the route field
- Param values are URL-encoded and substituted before sending the request
- Param values persist in localStorage as part of tab state
- cURL export button — copies a ready-to-paste cURL command to clipboard (method, full URL, headers, body)
- Fixed route validation: resolved routes (e.g. `/wp/v2/posts/123`) now correctly match WordPress regex route patterns via `preg_match`
- Fixed route display formatting for complex regex-style parameters so named captures render as clean `{param}` tokens
- Added `rest_url` to `wprrt_vars` JS object for accurate cURL URL construction
- New JS modules: `src/params.js`, `src/export.js`

### 1.3.0
- Saved Requests sidebar — save any request by name, click to restore into active tab, delete with ×
- Auth preset dropdown per tab (No Auth / Bearer Token / API Key / Basic Auth) — auto-fills Headers JSON
- Saved requests stored in `wp_usermeta` per user, max 100, newest first
- New: `includes/class-saved-requests.php` with static save / get_all / delete methods
- New JS modules: `src/saved.js`, `src/auth.js`
- Two-column layout: 230px sidebar left, request/response right
- Auth type selection persisted in localStorage as part of tab state

### 1.2.0
- Introduced Vite build system — source in `src/`, output to `assets/app.js`
- Modular JS: `state.js`, `tabs.js`, `request.js`, `response.js`, `main.js`
- Added PrismJS syntax highlighting on JSON response body (GitHub light theme)
- `npm run dev` — watch mode rebuild; `npm run build` — production build
- Fixed: empty request body was rejected with "Invalid JSON data" — empty string now correctly defaults to `{}`

### 1.1.0
- Security: Fixed XSS vulnerability in route dropdown (textContent instead of innerHTML)
- Security: Temporary test users now always cleaned up via try/finally
- Security: Added 512 KB request body size limit
- Security: Added route existence validation before execution
- Added PATCH, OPTIONS, HEAD HTTP method support
- Response panel now shows a color-coded HTTP status badge (2xx/3xx/4xx/5xx)
- Response time shown as a readable line above the body, not embedded in JSON
- Added collapsible Response Headers section
- Response returns HTTP status code and headers from server
- Fixed formatRoute() regex handling of optional parameter groups
- AJAX failures now show a visible inline error message
- Removed debug console.log() calls from frontend
- Removed dead "Form Params" hidden field
- JS globals consolidated into WPRRT namespace

### 1.0.0
- Initial release

## License

This plugin is licensed under the GPL v2 or later.