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

    if (!isset($data['member_name']) || !isset($data['role_id'])) {
        echo json_encode(["success" => false, "error" => "Missing fields: member_name or role_id"]);
        exit;
    }

    $member_name = trim($data['member_name']);
    $role_id = trim($data['role_id']);
    $member_image = isset($data['member_image']) ? trim($data['member_image']) : "";

    // --- START ID GENERATOR ---
    $conn->query("INSERT INTO tk_webapp.member_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_member_id = "member-{$year}-{$base36_id}";
    // --- END ID GENERATOR ---

    $stmt = $conn->prepare("
        INSERT INTO tk_webapp.members (
            member_id, member_name, member_image, role_id
        ) VALUES (?, ?, ?, ?)
    ");

    $stmt->bind_param("ssss", $new_member_id, $member_name, $member_image, $role_id);

    if ($stmt->execute()) {
        $result = $conn->query("
            SELECT m.*, r.role_name
            FROM tk_webapp.members m
            LEFT JOIN tk_webapp.roles r ON m.role_id = r.role_id
            WHERE m.member_id = '{$new_member_id}'
            LIMIT 1
        ");

        $member = $result->fetch_assoc();

        if ($member) {
            $formatted = [
                "member_id" => $member["member_id"],
                "member_name" => $member["member_name"],
                "member_image" => $member["member_image"],
                "role_id" => $member["role_id"],
                "role_name" => $member["role_name"] ?? "N/A",
            ];

            echo json_encode(["success" => true, "member" => $formatted]);
        } else {
            echo json_encode(["success" => false, "error" => "Failed to retrieve new member"]);
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