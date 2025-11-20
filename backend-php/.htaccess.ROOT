# If backend-php is in ROOT directory (same as index.html)
# Use this .htaccess configuration

# Enable Rewrite Engine
RewriteEngine On

# Allow CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=204,L]

# Route /api requests to backend-php/index.php
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ backend-php/index.php?route=$1 [QSA,L]

# Increase upload size limit (for base64 images)
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value memory_limit 256M

