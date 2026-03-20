<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Persists saved requests to wp_usermeta.
 * One meta key per user, value = JSON array, newest first.
 */
class WPRRT_Saved_Requests {

    const META_KEY  = 'wprrt_saved_requests';
    const MAX_ITEMS = 100;

    public static function save( $user_id, $name, $route, $method, $headers, $body ) {
        $items = self::get_all( $user_id );

        $item = [
            'id'       => uniqid( 'wprrt_', true ),
            'name'     => sanitize_text_field( $name ),
            'route'    => sanitize_text_field( $route ),
            'method'   => sanitize_text_field( $method ),
            'headers'  => sanitize_textarea_field( $headers ),
            'body'     => sanitize_textarea_field( $body ),
            'saved_at' => time(),
        ];

        array_unshift( $items, $item );

        if ( count( $items ) > self::MAX_ITEMS ) {
            $items = array_slice( $items, 0, self::MAX_ITEMS );
        }

        update_user_meta( $user_id, self::META_KEY, wp_json_encode( $items ) );

        return $item;
    }

    public static function get_all( $user_id ) {
        $raw = get_user_meta( $user_id, self::META_KEY, true );
        if ( empty( $raw ) ) return [];
        $items = json_decode( $raw, true );
        return is_array( $items ) ? $items : [];
    }

    public static function delete( $user_id, $id ) {
        $items    = self::get_all( $user_id );
        $filtered = array_values(
            array_filter( $items, fn( $item ) => $item['id'] !== $id )
        );
        update_user_meta( $user_id, self::META_KEY, wp_json_encode( $filtered ) );
        return true;
    }
}
