<?php
include 'db.php';

// --- 1. DYNAMIC CORS HEADERS ---
$allowed_origins = [
    "https://tarakabataan.org",
    "https://www.tarakabataan.org",
    "https://tara-kabataan-optimized.vercel.app"
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 2. GRAB THE COOKIE ---
$session_token = $_COOKIE['admin_session_token'] ?? '';

if (empty($session_token)) {
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "No session cookie found."]);
    exit;
}

// --- 3. VERIFY TOKEN IN DATABASE ---
// Adjust the column names below if your users table uses different names!
$stmt = $conn->prepare("SELECT * FROM users WHERE session_token = ?");
$stmt->bind_param("s", $session_token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // Success! Return the user details to React
    echo json_encode([
        "authenticated" => true,
        "user" => [
            "user_id" => $user['id'] ?? $user['user_id'], // Adjust based on your DB columns
            "user_name" => $user['name'] ?? $user['first_name'],
            "user_email" => $user['user_email']
        ]
    ]);
} else {
    // Token is invalid or expired
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "Invalid or expired session."]);
}
?>