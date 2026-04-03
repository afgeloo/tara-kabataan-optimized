<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'db.php'; 

$body    = file_get_contents('php://input');
$data    = json_decode($body, true);
$eventId = $data['event_id'] ?? null;

if (!$eventId) {
    echo json_encode(["success" => false, "message" => "Missing event_id"]);
    exit;
}

// Just delete the row. TiDB handles the rest.
if (! $del = $conn->prepare("DELETE FROM tk_webapp.events WHERE event_id = ?")) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Prepare delete failed: " . $conn->error]);
    exit;
}

$del->bind_param("s", $eventId);

if ($del->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Execute delete failed: " . $del->error]);
}

$del->close();
$conn->close();
?>