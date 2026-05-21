<?php
/**
 * Per-user request history (last N tests).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPRRT_Request_History {

	const META_KEY  = 'wprrt_request_history';
	const MAX_ITEMS = 50;

	/**
	 * @param int   $user_id User ID.
	 * @param array $entry   History entry.
	 */
	public static function log( int $user_id, array $entry ): void {
		$items = self::get_all( $user_id );

		array_unshift(
			$items,
			array_merge(
				array(
					'id'         => uniqid( 'hist_', true ),
					'logged_at'  => time(),
				),
				$entry
			)
		);

		if ( count( $items ) > self::MAX_ITEMS ) {
			$items = array_slice( $items, 0, self::MAX_ITEMS );
		}

		update_user_meta( $user_id, self::META_KEY, wp_json_encode( $items ) );
	}

	/**
	 * @param int $user_id User ID.
	 * @return array<int, array>
	 */
	public static function get_all( int $user_id ): array {
		$raw = get_user_meta( $user_id, self::META_KEY, true );
		if ( empty( $raw ) ) {
			return array();
		}
		$items = json_decode( $raw, true );
		return is_array( $items ) ? $items : array();
	}

	/**
	 * @param int $user_id User ID.
	 */
	public static function clear( int $user_id ): void {
		delete_user_meta( $user_id, self::META_KEY );
	}
}
