<?php
/**
 * Shared helpers for REST API Route Tester.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Verify AJAX nonce and manage_options capability.
 */
function wprrt_require_ajax_admin(): void {
	check_ajax_referer( 'wprrt_nonce', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( __( 'Insufficient permissions', 'rest-api-route-tester' ) );
	}
}

/**
 * Decode a JSON field from POST without breaking JSON via sanitize_textarea_field.
 *
 * @param string $key POST key.
 * @return array|WP_Error Decoded array or error.
 */
function wprrt_decode_json_post( string $key ) {
	$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : '{}';
	if ( '' === $raw || null === $raw ) {
		$raw = '{}';
	}
	$decoded = json_decode( $raw, true );
	if ( JSON_ERROR_NONE !== json_last_error() ) {
		return new WP_Error( 'invalid_json', sprintf( __( 'Invalid JSON in %s', 'rest-api-route-tester' ), $key ) );
	}
	if ( ! is_array( $decoded ) ) {
		return new WP_Error( 'invalid_json', sprintf( __( '%s must be a JSON object', 'rest-api-route-tester' ), $key ) );
	}
	return $decoded;
}

/**
 * Sanitize header map for WP_REST_Request.
 *
 * @param array $headers Raw headers.
 * @return array<string, string>
 */
function wprrt_sanitize_headers( array $headers ): array {
	$out = array();
	foreach ( $headers as $name => $value ) {
		if ( ! is_string( $name ) || '' === $name ) {
			continue;
		}
		if ( is_array( $value ) ) {
			$value = implode( ', ', array_map( 'strval', $value ) );
		}
		$out[ $name ] = sanitize_text_field( (string) $value );
	}
	return $out;
}

/**
 * Apply headers and body/query params to a REST request.
 *
 * @param WP_REST_Request $request  Request object.
 * @param string          $method   HTTP method.
 * @param array           $data     Decoded body JSON.
 * @param array           $headers  Header map.
 */
function wprrt_apply_request_payload( WP_REST_Request $request, string $method, array $data, array $headers ): void {
	$method = strtoupper( $method );
	$headers = wprrt_sanitize_headers( $headers );

	foreach ( $headers as $name => $value ) {
		$request->set_header( $name, $value );
	}

	$write_methods = array( 'POST', 'PUT', 'PATCH' );
	$read_methods  = array( 'GET', 'HEAD', 'DELETE' );

	if ( in_array( $method, $write_methods, true ) && is_array( $data ) ) {
		foreach ( $data as $key => $value ) {
			$request->set_param( $key, $value );
		}
		if ( ! empty( $data ) && ! isset( $headers['Content-Type'] ) ) {
			$request->set_header( 'Content-Type', 'application/json' );
		}
	} elseif ( in_array( $method, $read_methods, true ) && is_array( $data ) ) {
		foreach ( $data as $key => $value ) {
			$request->set_param( $key, $value );
		}
	}
}

/**
 * Check whether a route path matches a registered REST route.
 *
 * @param string $route Route path (resolved URL, not regex pattern).
 */
function wprrt_route_exists( string $route ): bool {
	$registered_routes = rest_get_server()->get_routes();
	if ( isset( $registered_routes[ $route ] ) ) {
		return true;
	}
	foreach ( array_keys( $registered_routes ) as $pattern ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( @preg_match( '#^' . $pattern . '$#i', $route ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Whether this site runs WordPress 7.0+ (AI Client ships in core).
 */
function wprrt_ai_wp_version_supported(): bool {
	if ( function_exists( 'is_wp_version_compatible' ) ) {
		return is_wp_version_compatible( '7.0' );
	}
	global $wp_version;
	return version_compare( (string) $wp_version, '7.0', '>=' );
}

/**
 * Whether an AI connector is configured for text generation (WP 7.0+ only).
 */
function wprrt_ai_connector_ready(): bool {
	if ( ! wprrt_ai_wp_version_supported() ) {
		return false;
	}
	if ( ! function_exists( 'wp_supports_ai' ) || ! wp_supports_ai() ) {
		return false;
	}
	if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
		return false;
	}
	$builder = wp_ai_client_prompt();
	if ( is_wp_error( $builder ) ) {
		return false;
	}
	if ( method_exists( $builder, 'is_supported_for_text_generation' ) ) {
		$supported = $builder->is_supported_for_text_generation();
		if ( is_wp_error( $supported ) || ! $supported ) {
			return false;
		}
	}
	return true;
}

/**
 * Whether AI features can run (WP 7.0+ and connector ready).
 */
function wprrt_ai_available(): bool {
	return wprrt_ai_wp_version_supported() && wprrt_ai_connector_ready();
}

/**
 * UI state for admin AI controls: hidden | disconnected | ready.
 */
function wprrt_ai_ui_state(): string {
	if ( ! wprrt_ai_wp_version_supported() ) {
		return 'hidden';
	}
	if ( ! wprrt_ai_connector_ready() ) {
		return 'disconnected';
	}
	return 'ready';
}
