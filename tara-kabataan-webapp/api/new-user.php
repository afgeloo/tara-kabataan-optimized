<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php'; 

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['member_id']) || empty($data['email']) || empty($data['phone'])) {
        echo json_encode(["success" => false, "error" => "Missing fields: member_id, email, and phone are required"]);
        exit;
    }

    $member_id = trim($data['member_id']);
    $email     = trim($data['email']);
    $phone     = trim($data['phone']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "error" => "Invalid email format"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT member_name, role_id FROM tk_webapp.members WHERE member_id = ?");
    $stmt->bind_param("s", $member_id);
    $stmt->execute();
    $stmt->bind_result($member_name, $role_id);
    if (!$stmt->fetch()) {
        echo json_encode(["success" => false, "error" => "Member not found"]);
        exit;
    }
    $stmt->close();

    $default_pw = '@Admin123';
    $password_hash = password_hash($default_pw, PASSWORD_BCRYPT);

    // --- START ID GENERATOR ---
    $conn->query("INSERT INTO tk_webapp.user_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_user_id = "user-{$year}-{$base36_id}";
    // --- END ID GENERATOR ---

    $stmt = $conn->prepare("
        INSERT INTO tk_webapp.users
          (user_id, user_name, user_email, user_contact, password_hash, role_id, member_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "sssssss",
        $new_user_id, // INJECT THE NEW ID!
        $member_name,
        $email,
        $phone,
        $password_hash,
        $role_id,
        $member_id
    );

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "error" => "Failed to create user: " . $stmt->error]);
        exit;
    }
    $stmt->close();

    $sql = "SELECT user_id, user_name, user_email, user_contact, role_id, member_id FROM tk_webapp.users WHERE user_id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $new_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    echo json_encode(["success" => true, "user" => $user]);

    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "error"   => $e->getMessage()]);
}
?>