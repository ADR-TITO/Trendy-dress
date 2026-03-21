<?php
namespace App\Utils;

/**
 * Authentication Utility
 */
class Auth {
    /**
     * Check if the current request is from an authenticated admin.
     * Accepts EITHER a valid PHP session OR a Bearer token.
     */
    public static function isAdminAuthenticated(): bool {
        // Method 1: PHP session cookie
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
            return true;
        }

        // Method 2: Bearer token from Authorization header
        $authHeader = self::getAuthorizationHeader();
        
        if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            
            if (empty($token)) {
                return false;
            }

            // Check session token (if set during login)
            if (isset($_SESSION['auth_token']) && hash_equals($_SESSION['auth_token'], $token)) {
                return true;
            }

            // Check persistent token file (critical for environments where session isn't shared)
            $tokenFile = sys_get_temp_dir() . '/trendy_admin_' . hash('sha256', $token) . '.tok';
            if (file_exists($tokenFile)) {
                $content = file_get_contents($tokenFile);
                $storedData = json_decode($content, true);
                
                if ($storedData && isset($storedData['expires']) && $storedData['expires'] > time()) {
                    // Token is valid, ensure session is marked as authenticated for the rest of this request
                    $_SESSION['admin_logged_in'] = true;
                    $_SESSION['admin_username'] = $storedData['username'] ?? 'Admin';
                    $_SESSION['admin_id'] = $storedData['admin_id'] ?? 0;
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Helper to extract the Authorization header from various sources
     */
    private static function getAuthorizationHeader(): ?string {
        // Check standard $_SERVER variable
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        // Check for REDIRECT_HTTP_AUTHORIZATION (common in some Apache setups)
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        // Check if apache_request_headers is available
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
            if (isset($headers['authorization'])) {
                return $headers['authorization'];
            }
        }
        
        return null;
    }
}
