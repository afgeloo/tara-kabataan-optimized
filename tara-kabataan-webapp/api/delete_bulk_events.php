<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php';

$body = file_get_contents('php://input');
$data = json_decode($body, true);
$ids  = $data['event_ids'] ?? [];

if (!is_array($ids) || empty($ids)) {
    echo json_encode(["success" => false, "message" => "You must provide a non-empty array of event_ids"]);
    exit;
}

// Build dynamic placeholders (?, ?, ?)
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$types = str_repeat('s', count($ids));

$sqlDel = "DELETE FROM tk_webapp.events WHERE event_id IN ($placeholders)";
$stmtDel = $conn->prepare($sqlDel);

if (!$stmtDel) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmtDel->bind_param($types, ...$ids);

if ($stmtDel->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Delete failed: " . $stmtDel->error]);
}

$stmtDel->close();
$conn->close();
?>