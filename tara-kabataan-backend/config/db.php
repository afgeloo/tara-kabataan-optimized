<?php
// db.php — database connection for Tara Kabataan backend

$host = "tara-kabataan-rds.cdy2k86gkg9l.ap-southeast-2.rds.amazonaws.com";
$port = 3306;
$user = "tkadmin";
$pass = "tkwebapp2025";
$db   = "tk_webapp";

// Enable error logging (log to backend folder)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../php-error.log');

$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

// Path to RDS SSL certificate bundle
$ca = __DIR__ . '/rds-combined-ca-bundle.pem';

// Enable SSL if CA file is available
if (is_readable($ca)) {
    mysqli_ssl_set($conn, null, null, $ca, null, null);
    $flags = MYSQLI_CLIENT_SSL;
} else {
    $flags = 0; // fallback without SSL
}

// Attempt connection
if (!mysqli_real_connect($conn, $host, $user, $pass, $db, $port, null, $flags)) {
    http_response_code(500);
    echo json_encode([
        "error" => "DB connect failed",
        "code"  => mysqli_connect_errno(),
        "msg"   => mysqli_connect_error()
    ]);
    exit;
}

// Set charset
$conn->set_charset("utf8mb4");
