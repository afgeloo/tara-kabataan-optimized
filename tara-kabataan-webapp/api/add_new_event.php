<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['title']) || !isset($data['category']) || !isset($data['event_date']) ||
        !isset($data['event_start_time']) || !isset($data['event_end_time']) ||
        !isset($data['event_venue']) || !isset($data['event_status']) ||
        !isset($data['event_speakers']) || !isset($data['content']) || !isset($data['image_url'])
    ) {
        echo json_encode(["success" => false, "error" => "Missing fields"]);
        exit;
    }

    // --- START ID GENERATOR ---
    $conn->query("INSERT INTO tk_webapp.event_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_event_id = "events-{$year}-{$base36_id}";
    // --- END ID GENERATOR ---

    $stmt = $conn->prepare("
        INSERT INTO tk_webapp.events (
            event_id, event_title, event_category, event_date, event_start_time, event_end_time,
            event_venue, event_status, event_speakers, event_content, event_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssssssssss",
        $new_event_id, // INJECT THE NEW ID HERE!
        $data['title'],
        $data['category'],
        $data['event_date'],
        $data['event_start_time'],
        $data['event_end_time'],
        $data['event_venue'],
        $data['event_status'],
        $data['event_speakers'],
        $data['content'],
        $data['image_url']
    );

    if ($stmt->execute()) {
        // Fetch safely using the exact ID
        $fetchStmt = $conn->prepare("SELECT * FROM tk_webapp.events WHERE event_id = ?");
        $fetchStmt->bind_param("s", $new_event_id);
        $fetchStmt->execute();
        $result = $fetchStmt->get_result();
        $event = $result->fetch_assoc();
        $fetchStmt->close();

        if ($event) {
            $formatted = [
                "event_id" => $event["event_id"],
                "image_url" => $event["event_image"],
                "category" => strtoupper($event["event_category"] ?? "N/A"),
                "title" => $event["event_title"],
                "event_date" => $event["event_date"],
                "event_start_time" => $event["event_start_time"],
                "event_end_time" => $event["event_end_time"],
                "event_venue" => $event["event_venue"],
                "content" => $event["event_content"],
                "event_speakers" => $event["event_speakers"],
                "event_going" => intval($event["event_going"] ?? 0),
                "event_status" => strtoupper($event["event_status"] ?? "UPCOMING"),
                "created_at" => $event["created_at"],
                "updated_at" => $event["updated_at"]
            ];

            echo json_encode(["success" => true, "event" => $formatted]);
        } else {
            echo json_encode(["success" => false, "error" => "Failed to retrieve new event"]);
        }

    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>