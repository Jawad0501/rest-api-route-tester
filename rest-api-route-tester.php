<?php
/**
 * Plugin Name: REST API Route Tester
 * Plugin URI: https://wordpress.org/plugins/rest-api-route-tester/
 * Description: A tool to test WordPress REST API routes with different user roles and authentication methods.
 * Version: 1.4.0
 * Author: jawad0501
 * Author URI: https://profiles.wordpress.org/jawad0501/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: rest-api-route-tester
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'includes/class-saved-requests.php';

class RESTAPIRouteTester {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_wprrt_get_routes', array($this, 'get_routes'));
        add_action('wp_ajax_wprrt_test_route', array($this, 'test_route'));
        add_action('wp_ajax_wprrt_get_user_roles', array($this, 'get_user_roles'));
        add_action('wp_ajax_wprrt_save_request', array($this, 'save_request'));
        add_action('wp_ajax_wprrt_get_saved_requests', array($this, 'get_saved_requests'));
        add_action('wp_ajax_wprrt_delete_request', array($this, 'delete_request'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'REST Route Tester',
            'REST Tester',
            'manage_options',
            'rest-api-route-tester',
            [$this, 'render_admin_page'],
            'dashicons-rest-api',
            80
        );
    }

    public function enqueue_scripts($hook) {
        if ($hook !== 'toplevel_page_rest-api-route-tester') return;

        $version = '1.4.0';
        wp_enqueue_style('wprrt-style', plugin_dir_url(__FILE__) . 'assets/style.css', array(), $version);
        wp_enqueue_script('wprrt-script', plugin_dir_url(__FILE__) . 'assets/app.js', array('jquery'), $version, true);

        wp_localize_script('wprrt-script', 'wprrt_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('wprrt_nonce'),
            'rest_url' => get_rest_url(),
        ));
    }

    public function render_admin_page() {
        include plugin_dir_path(__FILE__) . 'templates/admin-page.php';
    }

    public function get_routes() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        $routes = rest_get_server()->get_routes();
        
        // Process routes to include method information
        $processed_routes = array();
        foreach ($routes as $route => $handlers) {
            $methods = array();
            foreach ($handlers as $handler) {
                if (isset($handler['methods'])) {
                    $methods = array_merge($methods, array_keys($handler['methods']));
                }
            }
            // Remove duplicates and sort
            $methods = array_unique($methods);
            sort($methods);
            
            $processed_routes[$route] = array(
                'methods' => $methods,
                'primary_method' => !empty($methods) ? $methods[0] : 'GET'
            );
        }
        
        wp_send_json_success($processed_routes);
    }

    public function get_user_roles() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        
        // Get all roles
        $wp_roles = wp_roles();
        $roles = array();
        
        if ($wp_roles) {
            foreach ($wp_roles->get_names() as $role_name => $role_title) {
                $roles[$role_name] = $role_title;
            }
        }
        
        // Add a default option
        $roles = array_merge(
            array('' => 'Default (Current User)'),
            $roles
        );
        
        wp_send_json_success($roles);
    }

    public function test_route() {
        check_ajax_referer('wprrt_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $route = sanitize_text_field(wp_unslash($_POST['route'] ?? ''));
        $method = sanitize_text_field(wp_unslash($_POST['method'] ?? 'GET'));
        $headers = json_decode(stripslashes(sanitize_textarea_field(wp_unslash($_POST['headers'] ?? '{}'))), true);
        $form = json_decode(stripslashes(sanitize_textarea_field(wp_unslash($_POST['form'] ?? '{}'))), true);
        $raw_data = stripslashes(sanitize_textarea_field(wp_unslash($_POST['body'] ?? '')));
        if (empty($raw_data)) {
            $raw_data = '{}';
        }
        $role = sanitize_text_field(wp_unslash($_POST['role'] ?? ''));

        // Validate method
        $allowed_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        if (!in_array(strtoupper($method), $allowed_methods)) {
            wp_send_json_error('Invalid method');
        }

        // Guard against oversized payloads (512 KB)
        if (strlen($raw_data) > 524288) {
            wp_send_json_error('Request body exceeds maximum allowed size of 512 KB');
        }

        // Validate JSON data
        $data = json_decode($raw_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('Invalid JSON data');
        }

        // Validate route exists — check exact key first, then match against regex patterns
        $registered_routes = rest_get_server()->get_routes();
        $route_valid = isset($registered_routes[$route]);
        if (!$route_valid) {
            foreach (array_keys($registered_routes) as $pattern) {
                // phpcs:ignore WordPress.PHP.NoSilencedErrors -- suppress invalid regex warnings
                if (@preg_match('#^' . $pattern . '$#i', $route)) {
                    $route_valid = true;
                    break;
                }
            }
        }
        if (!$route_valid) {
            wp_send_json_error('Route not found: ' . $route);
        }

        // Create a test user with the specified role if a role is provided
        $test_user = null;
        if (!empty($role)) {
            $test_user = $this->create_test_user($role);
            if (is_wp_error($test_user)) {
                wp_send_json_error($test_user->get_error_message());
                return;
            }
            wp_set_current_user($test_user->ID);
        }

        try {
            // For POST and PUT/PATCH requests, set body params
            if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
                $request = new WP_REST_Request($method, $route);
                if (is_array($data)) {
                    foreach ($data as $key => $value) {
                        $request->set_param($key, $value);
                    }
                }
            } else {
                $request = new WP_REST_Request($method, $route);
            }

            $response = rest_do_request($request);

            wp_send_json_success([
                'status'  => $response->get_status(),
                'headers' => $response->get_headers(),
                'data'    => $response->get_data(),
            ]);
        } finally {
            // Always clean up the test user, even if an exception was thrown
            if ($test_user) {
                wp_delete_user($test_user->ID);
            }
        }
    }

    public function save_request() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $name    = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
        $route   = sanitize_text_field(wp_unslash($_POST['route'] ?? ''));
        $method  = sanitize_text_field(wp_unslash($_POST['method'] ?? 'GET'));
        $headers = sanitize_textarea_field(wp_unslash($_POST['headers'] ?? ''));
        $body    = sanitize_textarea_field(wp_unslash($_POST['body'] ?? ''));

        if (empty($name) || empty($route)) {
            wp_send_json_error('Name and route are required');
        }

        $item = WPRRT_Saved_Requests::save(get_current_user_id(), $name, $route, $method, $headers, $body);
        wp_send_json_success($item);
    }

    public function get_saved_requests() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        wp_send_json_success(WPRRT_Saved_Requests::get_all(get_current_user_id()));
    }

    public function delete_request() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $id = sanitize_text_field(wp_unslash($_POST['id'] ?? ''));
        if (empty($id)) {
            wp_send_json_error('ID is required');
        }

        WPRRT_Saved_Requests::delete(get_current_user_id(), $id);
        wp_send_json_success();
    }

    private function create_test_user($role) {
        $username = 'wprrt_test_user_' . time();
        $email = $username . '@example.com';
        
        $user_id = wp_create_user($username, wp_generate_password(), $email);
        
        if (is_wp_error($user_id)) {
            return $user_id;
        }
        
        $user = new WP_User($user_id);
        $user->set_role($role);
        
        return $user;
    }
}

new RESTAPIRouteTester();
