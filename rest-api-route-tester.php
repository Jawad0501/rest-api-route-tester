<?php
/**
 * Plugin Name: REST API Route Tester
 * Description: View and test all registered REST API routes from the WP admin.
 * Version: 1.0.0
 * Author: Nowshad Jawad
 * Text Domain: rest-api-route-tester
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit;

class WPRestRouteTester {
    public function __construct() {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_wprrt_get_routes', [$this, 'get_rest_routes']);
        add_action('wp_ajax_wprrt_get_user_roles', [$this, 'get_user_roles']);
        add_action('wp_ajax_wprrt_test_route', [$this, 'test_rest_route']);
    }

    public function register_menu() {
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

    public function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_rest-api-route-tester') return;

        wp_enqueue_style('wprrt-style', plugin_dir_url(__FILE__) . 'assets/style.css');
        wp_enqueue_script('wprrt-script', plugin_dir_url(__FILE__) . 'assets/app.js', ['jquery'], null, true);

        wp_localize_script('wprrt-script', 'wprrt_vars', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wprrt_nonce')
        ]);
    }

    public function render_admin_page() {
        include plugin_dir_path(__FILE__) . 'templates/admin-page.php';
    }

    public function get_rest_routes() {
        check_ajax_referer('wprrt_nonce', 'nonce');
        $routes = rest_get_server()->get_routes();
        wp_send_json_success($routes);
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

    public function test_rest_route() {
        check_ajax_referer('wprrt_nonce', 'nonce');

        $method = strtoupper(sanitize_text_field($_POST['method']));
        $route  = esc_url_raw($_POST['route']);
        $role   = sanitize_text_field($_POST['role'] ?? '');
        
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
        
        // For POST and PUT requests, only pass the body data
        if (in_array($method, ['POST', 'PUT'])) {
            $raw_data = stripslashes($_POST['body'] ?? '{}');
            $request = new WP_REST_Request($method, $route);
            
            // Decode the JSON body and set it as parameters
            $body_data = json_decode($raw_data, true);
            if (is_array($body_data)) {
                foreach ($body_data as $key => $value) {
                    $request->set_param($key, $value);
                }
            }
        } else {
            // For GET and DELETE, process as before
            $request = new WP_REST_Request($method, $route);
        }

        $response = rest_do_request($request);
        
        // Clean up test user if one was created
        if ($test_user) {
            wp_delete_user($test_user->ID);
        }
        
        wp_send_json_success($response->get_data());
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

new WPRestRouteTester();
