<?php
/**
 * WP 7.0 AI Client helpers for REST Route Tester.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPRRT_AI_Service {

	/**
	 * Explain a REST API response for developers.
	 *
	 * @param string $route   Route tested.
	 * @param string $method  HTTP method.
	 * @param int    $status  Status code.
	 * @param string $body_snippet JSON snippet (truncated).
	 * @return string|WP_Error
	 */
	public static function explain_response( string $route, string $method, int $status, string $body_snippet ) {
		if ( ! wprrt_ai_wp_version_supported() ) {
			return new WP_Error(
				'ai_unavailable',
				__( 'AI features require WordPress 7.0 or newer.', 'rest-api-route-tester' )
			);
		}
		if ( ! wprrt_ai_connector_ready() ) {
			return new WP_Error(
				'ai_unavailable',
				__( 'AI is not configured. Connect a provider under Settings → Connectors.', 'rest-api-route-tester' )
			);
		}

		$prompt = sprintf(
			"You are helping a WordPress developer debug a REST API test.\n\nRoute: %s\nMethod: %s\nHTTP status: %d\n\nResponse body (truncated):\n%s\n\nIn 3–5 short paragraphs: explain what this response likely means, common causes for this status on this route, and one concrete next debugging step. Do not invent endpoint behavior not shown in the snippet.",
			$route,
			$method,
			$status,
			$body_snippet
		);

		return self::generate_text( $prompt, 0.4 );
	}

	/**
	 * Suggest a sample JSON request body for a route.
	 *
	 * @param string $route  Route path.
	 * @param string $method HTTP method.
	 * @return string|WP_Error JSON string.
	 */
	public static function suggest_body( string $route, string $method ) {
		if ( ! wprrt_ai_wp_version_supported() ) {
			return new WP_Error(
				'ai_unavailable',
				__( 'AI features require WordPress 7.0 or newer.', 'rest-api-route-tester' )
			);
		}
		if ( ! wprrt_ai_connector_ready() ) {
			return new WP_Error(
				'ai_unavailable',
				__( 'AI is not configured. Connect a provider under Settings → Connectors.', 'rest-api-route-tester' )
			);
		}

		$prompt = sprintf(
			"Suggest a minimal valid JSON request body for testing this WordPress REST API route.\nRoute: %s\nHTTP method: %s\n\nReturn ONLY valid JSON (no markdown fences). Use realistic WordPress REST field names when obvious (e.g. title, content, status for posts). If GET/HEAD/DELETE or no body is needed, return {}.",
			$route,
			$method
		);

		$text = self::generate_text( $prompt, 0.5 );
		if ( is_wp_error( $text ) ) {
			return $text;
		}

		$text = trim( $text );
		$text = preg_replace( '/^```(?:json)?\s*/i', '', $text );
		$text = preg_replace( '/\s*```$/', '', $text );

		json_decode( $text, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error( 'ai_invalid_json', __( 'AI returned invalid JSON. Try again.', 'rest-api-route-tester' ) );
		}

		return $text;
	}

	/**
	 * @param string $prompt      Prompt text.
	 * @param float  $temperature Temperature 0–1.
	 * @return string|WP_Error
	 */
	private static function generate_text( string $prompt, float $temperature ) {
		$builder = wp_ai_client_prompt( $prompt );
		if ( is_wp_error( $builder ) ) {
			return $builder;
		}

		if ( method_exists( $builder, 'using_temperature' ) ) {
			$builder = $builder->using_temperature( $temperature );
		}

		$text = $builder->generate_text();
		if ( is_wp_error( $text ) ) {
			return $text;
		}

		return is_string( $text ) ? trim( $text ) : '';
	}
}
