<?php
/**
 * Plugin Name: REST API Route Tester
 * Plugin URI: https://wordpress.org/plugins/rest-api-route-tester/
 * Description: A tool to test WordPress REST API routes with different user roles and authentication methods.
 * Version: 1.5.0
 * Author: jawad0501
 * Author URI: https://profiles.wordpress.org/jawad0501/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: rest-api-route-tester
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 8.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WPRRT_VERSION', '1.5.0' );

require_once plugin_dir_path( __FILE__ ) . 'includes/helpers.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-saved-requests.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-request-history.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-ai-service.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-abilities.php';

WPRRT_Abilities::init();

class RESTAPIRouteTester {

	/**
	 * When set, force REST auth checks to run as this user ID.
	 *
	 * @var int
	 */
	private $forced_user_id = 0;

	/**
	 * Whether to force guest (logged-out) context for current test request.
	 *
	 * @var bool
	 */
	private $force_guest_user = false;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_notices', array( $this, 'admin_notices' ) );

		add_action( 'wp_ajax_wprrt_get_routes', array( $this, 'get_routes' ) );
		add_action( 'wp_ajax_wprrt_test_route', array( $this, 'test_route' ) );
		add_action( 'wp_ajax_wprrt_get_user_roles', array( $this, 'get_user_roles' ) );
		add_action( 'wp_ajax_wprrt_save_request', array( $this, 'save_request' ) );
		add_action( 'wp_ajax_wprrt_get_saved_requests', array( $this, 'get_saved_requests' ) );
		add_action( 'wp_ajax_wprrt_delete_request', array( $this, 'delete_request' ) );
		add_action( 'wp_ajax_wprrt_get_history', array( $this, 'get_history' ) );
		add_action( 'wp_ajax_wprrt_clear_history', array( $this, 'clear_history' ) );
		add_action( 'wp_ajax_wprrt_ai_explain', array( $this, 'ai_explain' ) );
		add_action( 'wp_ajax_wprrt_ai_suggest_body', array( $this, 'ai_suggest_body' ) );
	}

	public function add_admin_menu() {
		add_menu_page(
			'REST Route Tester',
			'REST Tester',
			'manage_options',
			'rest-api-route-tester',
			array( $this, 'render_admin_page' ),
			'dashicons-rest-api',
			80
		);
	}

	/**
	 * AI connector notice on the tester screen when WP 7.0 AI is available but not configured.
	 */
	public function admin_notices() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'toplevel_page_rest-api-route-tester' !== $screen->id ) {
			return;
		}
		if ( wprrt_ai_wp_version_supported() && ! wprrt_ai_connector_ready() ) {
			$connectors_link = '<a href="' . esc_url( admin_url( 'options-connectors.php' ) ) . '">' . esc_html__( 'Settings → Connectors', 'rest-api-route-tester' ) . '</a>';
			echo '<div class="notice notice-warning"><p>';
			echo wp_kses_post(
				sprintf(
					/* translators: %s: link to Settings → Connectors */
					__( 'REST Route Tester: Connect an AI provider under %s to use Explain response and Suggest body.', 'rest-api-route-tester' ),
					$connectors_link
				)
			);
			echo '</p></div>';
		}
	}

	public function enqueue_scripts( $hook ) {
		if ( 'toplevel_page_rest-api-route-tester' !== $hook ) {
			return;
		}

		wp_enqueue_style( 'wprrt-style', plugin_dir_url( __FILE__ ) . 'assets/style.css', array(), WPRRT_VERSION );
		wp_enqueue_script( 'wprrt-script', plugin_dir_url( __FILE__ ) . 'assets/app.js', array( 'jquery' ), WPRRT_VERSION, true );

		$connectors_url = admin_url( 'options-connectors.php' );

		wp_localize_script(
			'wprrt-script',
			'wprrt_vars',
			array(
				'ajax_url'       => admin_url( 'admin-ajax.php' ),
				'nonce'          => wp_create_nonce( 'wprrt_nonce' ),
				'rest_url'       => get_rest_url(),
				'ai_show_ui'     => wprrt_ai_wp_version_supported(),
				'ai_ready'       => wprrt_ai_connector_ready(),
				'ai_available'   => wprrt_ai_available(),
				'ai_ui'          => wprrt_ai_ui_state(),
				'connectors_url' => $connectors_url,
				'strings'        => array(
					'ai_explain'          => __( 'Explain response', 'rest-api-route-tester' ),
					'ai_explain_short'    => __( 'Explain', 'rest-api-route-tester' ),
					'ai_insight_tab'      => __( 'AI insight', 'rest-api-route-tester' ),
					'ai_suggest_body'     => __( 'Suggest body', 'rest-api-route-tester' ),
					'ai_apply_body'       => __( 'Apply to body', 'rest-api-route-tester' ),
					'ai_dismiss'          => __( 'Dismiss', 'rest-api-route-tester' ),
					'ai_suggestion_title' => __( 'Suggested request body', 'rest-api-route-tester' ),
					'ai_thinking'         => __( 'Asking AI…', 'rest-api-route-tester' ),
					'ai_connect_required' => __( 'Connect an AI provider under Settings → Connectors to use this feature.', 'rest-api-route-tester' ),
					'ai_connect_link'     => __( 'Open Connectors settings', 'rest-api-route-tester' ),
					'history_title'    => __( 'History', 'rest-api-route-tester' ),
					'saved_title'      => __( 'Saved', 'rest-api-route-tester' ),
					'clear_history'    => __( 'Clear history', 'rest-api-route-tester' ),
					'history_empty'    => __( 'No requests logged yet.', 'rest-api-route-tester' ),
				),
			)
		);
	}

	public function render_admin_page() {
		include plugin_dir_path( __FILE__ ) . 'templates/admin-page.php';
	}

	public function get_routes() {
		wprrt_require_ajax_admin();

		$routes            = rest_get_server()->get_routes();
		$processed_routes  = array();

		foreach ( $routes as $route => $handlers ) {
			$methods = array();
			foreach ( $handlers as $handler ) {
				if ( isset( $handler['methods'] ) ) {
					$methods = array_merge( $methods, array_keys( $handler['methods'] ) );
				}
			}
			$methods = array_unique( $methods );
			sort( $methods );

			$processed_routes[ $route ] = array(
				'methods'        => $methods,
				'primary_method' => ! empty( $methods ) ? $methods[0] : 'GET',
			);
		}

		wp_send_json_success( $processed_routes );
	}

	public function get_user_roles() {
		wprrt_require_ajax_admin();

		$wp_roles = wp_roles();
		$roles    = array();

		if ( $wp_roles ) {
			foreach ( $wp_roles->get_names() as $role_name => $role_title ) {
				$roles[ $role_name ] = $role_title;
			}
		}

		$roles = array_merge(
			array(
				''      => __( 'Default (Current User)', 'rest-api-route-tester' ),
				'guest' => __( 'Guest (Logged-out User)', 'rest-api-route-tester' ),
			),
			$roles
		);

		wp_send_json_success( $roles );
	}

	public function test_route() {
		wprrt_require_ajax_admin();

		$route  = sanitize_text_field( wp_unslash( $_POST['route'] ?? '' ) );
		$method = strtoupper( sanitize_text_field( wp_unslash( $_POST['method'] ?? 'GET' ) ) );
		$role   = sanitize_text_field( wp_unslash( $_POST['role'] ?? '' ) );

		$headers = wprrt_decode_json_post( 'headers' );
		if ( is_wp_error( $headers ) ) {
			wp_send_json_error( $headers->get_error_message() );
		}

		$raw_data = isset( $_POST['body'] ) ? wp_unslash( $_POST['body'] ) : '';
		if ( '' === $raw_data || null === $raw_data ) {
			$raw_data = '{}';
		}

		$allowed_methods = array( 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD' );
		if ( ! in_array( $method, $allowed_methods, true ) ) {
			wp_send_json_error( __( 'Invalid method', 'rest-api-route-tester' ) );
		}

		if ( strlen( $raw_data ) > 524288 ) {
			wp_send_json_error( __( 'Request body exceeds maximum allowed size of 512 KB', 'rest-api-route-tester' ) );
		}

		$data = json_decode( $raw_data, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			wp_send_json_error( __( 'Invalid JSON data', 'rest-api-route-tester' ) );
		}
		if ( ! is_array( $data ) ) {
			wp_send_json_error( __( 'Body must be a JSON object', 'rest-api-route-tester' ) );
		}

		if ( ! wprrt_route_exists( $route ) ) {
			wp_send_json_error( sprintf( __( 'Route not found: %s', 'rest-api-route-tester' ), $route ) );
		}

		$original_user_id = get_current_user_id();
		$test_user        = null;
		$started          = microtime( true );

		if ( 'guest' === $role ) {
			$this->force_guest_user = true;
			$this->forced_user_id   = 0;
			add_filter( 'determine_current_user', array( $this, 'force_current_user_for_test' ), PHP_INT_MAX );
			wp_set_current_user( 0 );
		} elseif ( ! empty( $role ) ) {
			$test_user = $this->create_test_user( $role );
			if ( is_wp_error( $test_user ) ) {
				wp_send_json_error( $test_user->get_error_message() );
			}

			$this->forced_user_id = (int) $test_user->ID;
			add_filter( 'determine_current_user', array( $this, 'force_current_user_for_test' ), PHP_INT_MAX );
			add_filter( 'user_has_cap', array( $this, 'force_user_caps_for_test' ), PHP_INT_MAX, 4 );
			wp_set_current_user( $test_user->ID );
		}

		try {
			$request = new WP_REST_Request( $method, $route );
			wprrt_apply_request_payload( $request, $method, $data, $headers );

			$response   = rest_do_request( $request );
			$elapsed_ms = (int) round( ( microtime( true ) - $started ) * 1000 );

			$payload = array(
				'status'     => $response->get_status(),
				'headers'    => $response->get_headers(),
				'data'       => $response->get_data(),
				'elapsed_ms' => $elapsed_ms,
			);

			$this->log_history_entry( $original_user_id, $route, $method, $role, $headers, $raw_data, $payload );

			wp_send_json_success( $payload );
		} catch ( Exception $e ) {
			wp_send_json_error( $e->getMessage() );
		} finally {
			if ( 'guest' === $role || $test_user ) {
				remove_filter( 'determine_current_user', array( $this, 'force_current_user_for_test' ), PHP_INT_MAX );
			}

			if ( $test_user ) {
				remove_filter( 'user_has_cap', array( $this, 'force_user_caps_for_test' ), PHP_INT_MAX );
			}

			$this->forced_user_id   = 0;
			$this->force_guest_user = false;
			wp_set_current_user( $original_user_id );

			if ( $test_user ) {
				wp_delete_user( $test_user->ID );
			}
		}
	}

	/**
	 * @param int                  $user_id Admin user running the test (not the impersonated test user).
	 * @param string               $route   Route.
	 * @param string               $method  Method.
	 * @param string               $role    Role.
	 * @param array                $headers Headers.
	 * @param string               $body    Raw body JSON.
	 * @param array<string, mixed> $result  Response payload.
	 */
	private function log_history_entry( int $user_id, string $route, string $method, string $role, array $headers, string $body, array $result ): void {
		if ( $user_id <= 0 ) {
			return;
		}

		WPRRT_Request_History::log(
			$user_id,
			array(
				'route'      => $route,
				'method'     => $method,
				'role'       => $role,
				'headers'    => wp_json_encode( $headers ),
				'body'       => $body,
				'status'     => (int) ( $result['status'] ?? 0 ),
				'elapsed_ms' => (int) ( $result['elapsed_ms'] ?? 0 ),
			)
		);
	}

	public function force_current_user_for_test( $user_id ) {
		if ( $this->force_guest_user ) {
			return 0;
		}
		if ( $this->forced_user_id > 0 ) {
			return $this->forced_user_id;
		}
		return $user_id;
	}

	public function force_user_caps_for_test( $allcaps, $caps, $args, $user ) {
		unset( $caps, $args, $user );
		if ( $this->forced_user_id <= 0 ) {
			return $allcaps;
		}
		$forced_user = get_userdata( $this->forced_user_id );
		if ( ! $forced_user instanceof WP_User ) {
			return $allcaps;
		}
		return $forced_user->allcaps;
	}

	public function save_request() {
		wprrt_require_ajax_admin();

		$name      = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
		$route     = sanitize_text_field( wp_unslash( $_POST['route'] ?? '' ) );
		$method    = sanitize_text_field( wp_unslash( $_POST['method'] ?? 'GET' ) );
		$headers   = isset( $_POST['headers'] ) ? wp_unslash( $_POST['headers'] ) : '';
		$body      = isset( $_POST['body'] ) ? wp_unslash( $_POST['body'] ) : '';
		$role      = sanitize_text_field( wp_unslash( $_POST['role'] ?? '' ) );
		$auth_type = sanitize_text_field( wp_unslash( $_POST['auth_type'] ?? 'none' ) );

		$params_raw = isset( $_POST['params'] ) ? wp_unslash( $_POST['params'] ) : '{}';
		$params     = json_decode( $params_raw, true );
		if ( ! is_array( $params ) ) {
			$params = array();
		}

		if ( empty( $name ) || empty( $route ) ) {
			wp_send_json_error( __( 'Name and route are required', 'rest-api-route-tester' ) );
		}

		$item = WPRRT_Saved_Requests::save(
			get_current_user_id(),
			$name,
			$route,
			$method,
			is_string( $headers ) ? $headers : '',
			is_string( $body ) ? $body : '',
			$role,
			$auth_type,
			$params
		);

		wp_send_json_success( $item );
	}

	public function get_saved_requests() {
		wprrt_require_ajax_admin();
		wp_send_json_success( WPRRT_Saved_Requests::get_all( get_current_user_id() ) );
	}

	public function delete_request() {
		wprrt_require_ajax_admin();

		$id = sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) );
		if ( empty( $id ) ) {
			wp_send_json_error( __( 'ID is required', 'rest-api-route-tester' ) );
		}

		WPRRT_Saved_Requests::delete( get_current_user_id(), $id );
		wp_send_json_success();
	}

	public function get_history() {
		wprrt_require_ajax_admin();
		wp_send_json_success( WPRRT_Request_History::get_all( get_current_user_id() ) );
	}

	public function clear_history() {
		wprrt_require_ajax_admin();
		WPRRT_Request_History::clear( get_current_user_id() );
		wp_send_json_success();
	}

	public function ai_explain() {
		wprrt_require_ajax_admin();

		$route  = sanitize_text_field( wp_unslash( $_POST['route'] ?? '' ) );
		$method = sanitize_text_field( wp_unslash( $_POST['method'] ?? 'GET' ) );
		$status = absint( $_POST['status'] ?? 0 );
		$body   = isset( $_POST['body'] ) ? wp_unslash( $_POST['body'] ) : '';

		if ( strlen( $body ) > 12000 ) {
			$body = substr( $body, 0, 12000 ) . "\n…";
		}

		$result = WPRRT_AI_Service::explain_response( $route, $method, $status, $body );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message() );
		}

		wp_send_json_success( array( 'text' => $result ) );
	}

	public function ai_suggest_body() {
		wprrt_require_ajax_admin();

		$route  = sanitize_text_field( wp_unslash( $_POST['route'] ?? '' ) );
		$method = sanitize_text_field( wp_unslash( $_POST['method'] ?? 'GET' ) );

		if ( empty( $route ) ) {
			wp_send_json_error( __( 'Route is required', 'rest-api-route-tester' ) );
		}

		$result = WPRRT_AI_Service::suggest_body( $route, $method );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message() );
		}

		wp_send_json_success( array( 'body' => $result ) );
	}

	/**
	 * @param string $role Role slug.
	 * @return WP_User|WP_Error
	 */
	private function create_test_user( $role ) {
		if ( ! wp_roles()->is_role( $role ) ) {
			return new WP_Error( 'invalid_role', __( 'Invalid user role', 'rest-api-route-tester' ) );
		}

		$username = 'wprrt_test_' . wp_generate_password( 8, false, false );
		$email    = $username . '@wprrt.local';

		$user_id = wp_create_user( $username, wp_generate_password( 24, true, true ), $email );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		$user = new WP_User( $user_id );
		$user->set_role( $role );

		return $user;
	}
}

new RESTAPIRouteTester();
