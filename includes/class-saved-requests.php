<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Persists saved requests to wp_usermeta.
 * One meta key per user, value = JSON array, newest first.
 */
class WPRRT_Saved_Requests {

	const META_KEY  = 'wprrt_saved_requests';
	const MAX_ITEMS = 100;

	/**
	 * @param int    $user_id   User ID.
	 * @param string $name      Display name.
	 * @param string $route     Route path.
	 * @param string $method    HTTP method.
	 * @param string $headers   Headers JSON string.
	 * @param string $body      Body JSON string.
	 * @param string $role      Role slug or guest.
	 * @param string $auth_type Auth preset key.
	 * @param array  $params    URL param values.
	 * @return array Saved item.
	 */
	public static function save( $user_id, $name, $route, $method, $headers, $body, $role = '', $auth_type = 'none', $params = array() ) {
		$items = self::get_all( $user_id );

		$item = array(
			'id'        => uniqid( 'wprrt_', true ),
			'name'      => sanitize_text_field( $name ),
			'route'     => sanitize_text_field( $route ),
			'method'    => sanitize_text_field( $method ),
			'headers'   => sanitize_textarea_field( $headers ),
			'body'      => sanitize_textarea_field( $body ),
			'role'      => sanitize_text_field( $role ),
			'auth_type' => sanitize_text_field( $auth_type ),
			'params'    => is_array( $params ) ? $params : array(),
			'saved_at'  => time(),
		);

		array_unshift( $items, $item );

		if ( count( $items ) > self::MAX_ITEMS ) {
			$items = array_slice( $items, 0, self::MAX_ITEMS );
		}

		update_user_meta( $user_id, self::META_KEY, wp_json_encode( $items ) );

		return $item;
	}

	/**
	 * @param int $user_id User ID.
	 * @return array<int, array>
	 */
	public static function get_all( $user_id ) {
		$raw = get_user_meta( $user_id, self::META_KEY, true );
		if ( empty( $raw ) ) {
			return array();
		}
		$items = json_decode( $raw, true );
		return is_array( $items ) ? $items : array();
	}

	/**
	 * @param int    $user_id User ID.
	 * @param string $id      Item ID.
	 */
	public static function delete( $user_id, $id ) {
		$items    = self::get_all( $user_id );
		$filtered = array_values(
			array_filter( $items, fn( $item ) => ( $item['id'] ?? '' ) !== $id )
		);
		update_user_meta( $user_id, self::META_KEY, wp_json_encode( $filtered ) );
		return true;
	}
}
