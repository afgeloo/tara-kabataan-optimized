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
        !isset($data['partner_name']) ||
        !isset($data['partner_dec']) ||
        !isset($data['partner_contact_email']) ||
        !isset($data['partner_phone_number']) ||
        !isset($data['partner_image'])
    ) {
        echo json_encode(["success" => false, "error" => "Missing fields"]);
        exit;
    }

    // --- START ID GENERATOR ---
    $conn->query("INSERT INTO tk_webapp.partnership_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_partner_id = "partner-{$year}-{$base36_id}";
    // --- END ID GENERATOR ---

    $stmt = $conn->prepare("
        INSERT INTO tk_webapp.partnerships (
            partner_id, partner_name, partner_dec, partner_contact_email, partner_phone_number, partner_image
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "ssssss",
        $new_partner_id, // INJECT THE NEW ID!
        $data['partner_name'],
        $data['partner_dec'],
        $data['partner_contact_email'],
        $data['partner_phone_number'],
        $data['partner_image']
    );

    if ($stmt->execute()) {
        
        // Fetch safely using the exact ID we just generated
        $fetchStmt = $conn->prepare("SELECT * FROM tk_webapp.partnerships WHERE partner_id = ?");
        $fetchStmt->bind_param("s", $new_partner_id);
        $fetchStmt->execute();
        $result = $fetchStmt->get_result();
        $partner = $result->fetch_assoc();
        $fetchStmt->close();

        if ($partner) {
            $formatted = [
                "partner_id" => $partner["partner_id"],
                "partner_image" => $partner["partner_image"],
                "partner_name" => $partner["partner_name"],
                "partner_dec" => $partner["partner_dec"],
                "partner_contact_email" => $partner["partner_contact_email"],
                "partner_phone_number" => $partner["partner_phone_number"]
            ];

            echo json_encode(["success" => true, "partner" => $formatted]);
        } else {
            echo json_encode(["success" => false, "error" => "Failed to retrieve new partner"]);
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