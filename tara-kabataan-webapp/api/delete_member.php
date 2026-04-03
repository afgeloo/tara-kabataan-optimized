<?php
// 1. ENVIRONMENT SETTINGS
ini_set('display_errors', 0); // Hide HTML errors to prevent React from crashing
error_reporting(E_ALL);

// 2. CORS & JSON HEADERS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// 3. HANDLE PREFLIGHT REQUESTS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 4. DATABASE CONNECTION
require '../config/db.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // 5. GET INPUT DATA
    $data = json_decode(file_get_contents("php://input"), true);
    $member_id = $data['member_id'] ?? null;

    if (!$member_id) {
        echo json_encode(["success" => false, "message" => "Missing member_id"]);
        exit;
    }

    // 6. START TRANSACTION (The Safety Net)
    $conn->begin_transaction();

    // STEP 1: Fetch Member & User Info
    // We need the image path to delete the file, and the user_id to handle blogs.
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
    $imagePath = $memberData['member_image'];

    // STEP 2: REASSIGN BLOGS (The "Inheritance" Logic)
    if ($leaver_user_id) {
        // Find a random user who is NOT the one being deleted
        $randomQuery = $conn->query("SELECT user_id FROM users WHERE user_id != '$leaver_user_id' ORDER BY RAND() LIMIT 1");
        $newOwner = $randomQuery->fetch_assoc();

        if ($newOwner) {
            $new_user_id = $newOwner['user_id'];
            
            // Reassign all blogs from the leaver to the new random owner
            $updateBlogs = $conn->prepare("UPDATE blogs SET blog_author_id = ? WHERE blog_author_id = ?");
            $updateBlogs->bind_param("ss", $new_user_id, $leaver_user_id);
            $updateBlogs->execute();
            $updateBlogs->close();
        } else {
            // If no other users exist, we must delete the blogs or the FK constraint will fail
            $conn->query("DELETE FROM blogs WHERE blog_author_id = '$leaver_user_id'");
        }

        // STEP 3: Delete the User Account
        $deleteUser = $conn->prepare("DELETE FROM users WHERE user_id = ?");
        $deleteUser->bind_param("s", $leaver_user_id);
        $deleteUser->execute();
        $deleteUser->close();
    }

    // STEP 4: Delete the Member Record
    $deleteMember = $conn->prepare("DELETE FROM members WHERE member_id = ?");
    $deleteMember->bind_param("s", $member_id);
    $deleteMember->execute();
    $deleteMember->close();

    // STEP 5: Physically delete the image file from EC2
    if (!empty($imagePath)) {
        // Convert URL path to a local server path
        $localPath = $_SERVER['DOCUMENT_ROOT'] . parse_url($imagePath, PHP_URL_PATH);
        if (file_exists($localPath) && is_file($localPath)) {
            unlink($localPath);
        }
    }

    // 7. COMMIT EVERYTHING
    $conn->commit();
    echo json_encode(["success" => true, "message" => "Member deleted and blogs reassigned successfully."]);

} catch (Exception $e) {
    // 8. ROLLBACK ON ERROR
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