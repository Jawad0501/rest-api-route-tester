# Rest API Route Tester
Version: 1.0.0
Author: Nowshad Jawad
Requires at least: 4.5
Tested up to: 6.8
Stable Tag: 1.0.0
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
  - GET
  - POST
  - PUT
  - DELETE
- Customizable request components:
  - Headers (JSON format)
  - Form Parameters (JSON format)
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
4. Select the HTTP method (GET, POST, PUT, DELETE)
5. Configure your request:
   - Add headers in JSON format
   - Add form parameters in JSON format
   - Add request body in JSON format
6. Click "Send" to test the endpoint
7. View the response in the formatted output area

## Requirements

- WordPress 5.0 or higher
- PHP 7.2 or higher
- jQuery (included with WordPress)

## Security Notes

- This plugin should only be used in development environments
- Ensure proper user capabilities are set
- Always use nonces for AJAX requests
- Consider disabling the plugin in production environments


## License

This plugin is licensed under the GPL v2 or later.