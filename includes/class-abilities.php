<?php
/**
 * WordPress Abilities API registration (WP 6.9+ / 7.0).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPRRT_Abilities {

	public static function init(): void {
		add_action( 'wp_abilities_api_init', array( __CLASS__, 'register' ) );
	}

	public static function register(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		if ( function_exists( 'wp_register_ability_category' ) ) {
			wp_register_ability_category(
				'wprrt',
				array(
					'label'       => __( 'REST Route Tester', 'rest-api-route-tester' ),
					'description' => __( 'Test and discover WordPress REST API routes.', 'rest-api-route-tester' ),
				)
			);
		}

		wp_register_ability(
			'wprrt/list-rest-routes',
			array(
				'label'               => __( 'List REST API routes', 'rest-api-route-tester' ),
				'description'         => __( 'Returns registered WordPress REST routes with supported HTTP methods.', 'rest-api-route-tester' ),
				'category'            => 'wprrt',
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'namespace' => array(
							'type'        => 'string',
							'description' => __( 'Optional namespace prefix filter, e.g. wp/v2', 'rest-api-route-tester' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'object',
					'additionalProperties' => array(
						'type'       => 'object',
						'properties' => array(
							'methods'        => array( 'type' => 'array', 'items' => array( 'type' => 'string' ) ),
							'primary_method' => array( 'type' => 'string' ),
						),
					),
				),
				'execute_callback'    => static function ( $input = array() ) {
					$input     = is_array( $input ) ? $input : array();
					$namespace = isset( $input['namespace'] ) ? sanitize_text_field( $input['namespace'] ) : '';
					$routes    = rest_get_server()->get_routes();
					$out       = array();

					foreach ( $routes as $route => $handlers ) {
						if ( $namespace && ! str_starts_with( ltrim( $route, '/' ), $namespace ) ) {
							continue;
						}
						$methods = array();
						foreach ( $handlers as $handler ) {
							if ( isset( $handler['methods'] ) ) {
								$methods = array_merge( $methods, array_keys( $handler['methods'] ) );
							}
						}
						$methods = array_values( array_unique( $methods ) );
						sort( $methods );
						$out[ $route ] = array(
							'methods'        => $methods,
							'primary_method' => ! empty( $methods ) ? $methods[0] : 'GET',
						);
					}

					return $out;
				},
				'permission_callback' => static function (): bool {
					return current_user_can( 'manage_options' );
				},
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);

		wp_register_ability(
			'wprrt/test-rest-route',
			array(
				'label'               => __( 'Test a REST API route', 'rest-api-route-tester' ),
				'description'         => __( 'Executes rest_do_request for a route (admin context). Does not switch user roles.', 'rest-api-route-tester' ),
				'category'            => 'wprrt',
				'input_schema'        => array(
					'type'       => 'object',
					'required'   => array( 'route', 'method' ),
					'properties' => array(
						'route'   => array( 'type' => 'string' ),
						'method'  => array( 'type' => 'string' ),
						'headers' => array( 'type' => 'object' ),
						'body'    => array( 'type' => 'object' ),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'status'  => array( 'type' => 'integer' ),
						'headers' => array( 'type' => 'object' ),
						'data'    => array( 'type' => 'object' ),
					),
				),
				'execute_callback'    => static function ( $input = array() ) {
					$input  = is_array( $input ) ? $input : array();
					$route  = isset( $input['route'] ) ? sanitize_text_field( $input['route'] ) : '';
					$method = isset( $input['method'] ) ? strtoupper( sanitize_text_field( $input['method'] ) ) : 'GET';

					if ( ! wprrt_route_exists( $route ) ) {
						return new WP_Error( 'route_not_found', __( 'Route not found.', 'rest-api-route-tester' ) );
					}

					$headers = isset( $input['headers'] ) && is_array( $input['headers'] ) ? $input['headers'] : array();
					$body    = isset( $input['body'] ) && is_array( $input['body'] ) ? $input['body'] : array();

					$request = new WP_REST_Request( $method, $route );
					wprrt_apply_request_payload( $request, $method, $body, $headers );
					$response = rest_do_request( $request );

					return array(
						'status'  => $response->get_status(),
						'headers' => $response->get_headers(),
						'data'    => $response->get_data(),
					);
				},
				'permission_callback' => static function (): bool {
					return current_user_can( 'manage_options' );
				},
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
				),
			)
		);
	}
}
