<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

header("Content-Type: application/json");
require_once 'db.php'; 

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid JSON", "message" => json_last_error_msg()]);
  exit;
}

foreach (['event_id','name','email'] as $f) {
  if (empty($data[$f])) {
    http_response_code(400);
    echo json_encode(["error"=>"Missing $f"]);
    exit;
  }
}

$eventId      = $conn->real_escape_string($data['event_id']);
$name         = $conn->real_escape_string($data['name']);
$email        = $conn->real_escape_string($data['email']);
$contact      = isset($data['contact']) ? $conn->real_escape_string($data['contact']) : null;
$expectations = isset($data['expectations']) ? $conn->real_escape_string($data['expectations']) : null;

// --- START ID GENERATOR ---
$conn->query("INSERT INTO tk_webapp.participant_id_counter VALUES (NULL)");
$next_id = $conn->insert_id;
$base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
$year = date("Y");
$new_participant_id = "participant-{$year}-{$base36_id}";
// --- END ID GENERATOR ---

// 1. Insert the participant
$sql = "INSERT INTO tk_webapp.participants (participant_id, event_id, name, email, contact, expectations) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error"=>"Prepare failed (insert)"]);
  exit;
}

$stmt->bind_param("ssssss", $new_participant_id, $eventId, $name, $email, $contact, $expectations);

if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(["error"   => "DB insert failed", "message" => $stmt->error]);
  exit;
}
$stmt->close();

// 2. INCREMENT THE EVENT GOING COUNT! (The magic fix)
$updateSql = "UPDATE tk_webapp.events SET event_going = event_going + 1 WHERE event_id = ?";
$updateStmt = $conn->prepare($updateSql);
if ($updateStmt) {
    $updateStmt->bind_param("s", $eventId);
    $updateStmt->execute();
    $updateStmt->close();
}

echo json_encode(["success" => true]);
?>