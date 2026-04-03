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

if (empty($data['event_id']) || empty($data['name']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    exit;
}

$eventId      = $conn->real_escape_string($data['event_id']);
$name         = $conn->real_escape_string($data['name']);
$email        = $conn->real_escape_string($data['email']);
$contact      = isset($data['contact']) ? $conn->real_escape_string($data['contact']) : null;
$expectations = isset($data['expectations']) ? $conn->real_escape_string($data['expectations']) : null;

// --- START TRANSACTION ---
$conn->begin_transaction();

try {
    // 1. Generate ID
    $conn->query("INSERT INTO tk_webapp.participant_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_participant_id = "participant-{$year}-{$base36_id}";

    // 2. Insert Participant
    $sql = "INSERT INTO tk_webapp.participants (participant_id, event_id, name, email, contact, expectations) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssss", $new_participant_id, $eventId, $name, $email, $contact, $expectations);
    $stmt->execute();
    $stmt->close();

    // 3. Increment event_going (COALESCE handles NULL safely)
    $updateSql = "UPDATE tk_webapp.events SET event_going = COALESCE(event_going, 0) + 1 WHERE event_id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("s", $eventId);
    $updateStmt->execute();
    
    if ($updateStmt->affected_rows === 0) {
        throw new Exception("Event ID not found or count not updated.");
    }
    $updateStmt->close();

    // If we got here, commit the changes to TiDB
    $conn->commit();
    echo json_encode(["success" => true]);

} catch (Exception $e) {
    // If anything fails, undo everything
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>