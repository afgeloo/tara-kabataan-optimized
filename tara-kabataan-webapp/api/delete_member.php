<?php
ini_set('display_errors', 0); 
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'db.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $member_id = $data['member_id'] ?? null;

    if (!$member_id) {
        echo json_encode(["success" => false, "message" => "Missing member_id"]);
        exit;
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT m.member_image, u.user_id 
        FROM members m 
        LEFT JOIN users u ON m.member_id = u.member_id 
        WHERE m.member_id = ?
    ");
    $stmt->bind_param("s", $member_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $memberData = $result->fetch_assoc();

    if (!$memberData) {
        throw new Exception("Member not found in database.");
    }

    $leaver_user_id = $memberData['user_id'];

    if ($leaver_user_id) {
        $randomQuery = $conn->query("SELECT user_id FROM users WHERE user_id != '$leaver_user_id' ORDER BY RAND() LIMIT 1");
        $newOwner = $randomQuery->fetch_assoc();

        if ($newOwner) {
            $new_user_id = $newOwner['user_id'];
            
            $updateBlogs = $conn->prepare("UPDATE blogs SET blog_author_id = ? WHERE blog_author_id = ?");
            $updateBlogs->bind_param("ss", $new_user_id, $leaver_user_id);
            $updateBlogs->execute();
            $updateBlogs->close();
        } else {
            $conn->query("DELETE FROM blogs WHERE blog_author_id = '$leaver_user_id'");
        }

        $deleteUser = $conn->prepare("DELETE FROM users WHERE user_id = ?");
        $deleteUser->bind_param("s", $leaver_user_id);
        $deleteUser->execute();
        $deleteUser->close();
    }

    $deleteMember = $conn->prepare("DELETE FROM members WHERE member_id = ?");
    $deleteMember->bind_param("s", $member_id);
    $deleteMember->execute();
    $deleteMember->close();

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Member deleted and blogs reassigned successfully."]);

} catch (Exception $e) {
    if (isset($conn)) { $conn->rollback(); }
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server Error: Could not complete deletion.",
        "error_details" => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) { $stmt->close(); }
    if (isset($conn)) { $conn->close(); }
}
?>