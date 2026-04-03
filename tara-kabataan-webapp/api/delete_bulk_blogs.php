<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 1. Correct CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Correct Database Path
include 'db.php';

$input = json_decode(file_get_contents("php://input"), true);
$ids   = $input['blog_ids'] ?? [];

if (!is_array($ids) || empty($ids)) {
    echo json_encode(["success" => false, "error" => "No blog IDs provided"]);
    exit;
}

// 3. Dynamically build the (?, ?, ?) string based on how many blogs were selected
$placeholders = implode(',', array_fill(0, count($ids), '?'));

// Create a string of 's' (string) types for bind_param
$types = str_repeat('s', count($ids));

// 4. Delete the blogs! 
// Note: TiDB ON DELETE CASCADE will automatically handle the blog_images table.
$deleteSql = "DELETE FROM tk_webapp.blogs WHERE blog_id IN ($placeholders)";
$delStmt   = $conn->prepare($deleteSql);

if (!$delStmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
    exit;
}

// Use the splat operator (...) to dynamically pass the array of IDs
$delStmt->bind_param($types, ...$ids);
$success = $delStmt->execute();

if (!$success) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Execute failed: " . $delStmt->error]);
} else {
    echo json_encode(["success" => true]);
}

$delStmt->close();
$conn->close();
?>