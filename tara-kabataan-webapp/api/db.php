<?php
// Use $_ENV as a fallback since Vercel sometimes prefers it over getenv()
$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
$port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: 4000; 
$user = $_ENV['DB_USER'] ?? getenv('DB_USER');
$pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS');
$db   = $_ENV['DB_NAME'] ?? getenv('DB_NAME');

// Force mysqli to throw exceptions so we can catch them cleanly
mysqli_report(MYSQLI_REPORT_STRICT | MYSQLI_REPORT_ERROR);

try {
    $conn = mysqli_init();
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

    // TiDB requires SSL
    mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL); 

    // Attempt connection
    mysqli_real_connect($conn, $host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL);
    $conn->set_charset("utf8mb4");

} catch (mysqli_sql_exception $e) {
    // If it fails, catch the crash and return the EXACT error message to the frontend
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed",
        "details" => $e->getMessage() // This is the golden ticket!
    ]);
    exit;
}
?>