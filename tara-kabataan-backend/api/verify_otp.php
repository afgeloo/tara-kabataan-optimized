<?php
// START SESSION (No strict cookie settings needed for tokens)
session_start();

include '../config/db.php'; 

// DYNAMIC CORS HEADERS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$otp   = trim($data['otp'] ?? '');

if (!$email || !$otp) {
  echo json_encode(["success" => false, "message" => "Email and OTP are required."]);
  exit;
}

$emailEscaped = $conn->real_escape_string($email);

try {
  $userQuery = "SELECT * FROM tk_webapp.users WHERE user_email = ?";  $stmt = $conn->prepare($userQuery);
  $stmt->bind_param("s", $emailEscaped);
  $stmt->execute();
  $userResult = $stmt->get_result();

  if ($userResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Email not registered."]);
    exit;
  }

  $user = $userResult->fetch_assoc();

  $otpQuery = "SELECT otp, expires_at FROM tk_webapp.admin_otp WHERE email = ?";
  $stmt = $conn->prepare($otpQuery);
  $stmt->bind_param("s", $emailEscaped);
  $stmt->execute();
  $otpResult = $stmt->get_result();

  if ($otpResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No OTP found for this email."]);
    exit;
  }

  $row = $otpResult->fetch_assoc();

  if (strtotime($row['expires_at']) < time()) {
    echo json_encode(["success" => false, "message" => "OTP has expired."]);
    exit;
  }

  if ($row['otp'] !== $otp) {
    echo json_encode(["success" => false, "message" => "Incorrect OTP."]);
    exit;
  }

  $deleteStmt = $conn->prepare("DELETE FROM tk_webapp.admin_otp WHERE email = ?");
  $deleteStmt->bind_param("s", $emailEscaped);
  $deleteStmt->execute();

  // THE SECURITY LOCKDOWN
  $_SESSION['admin_logged_in'] = true;
  $_SESSION['admin_user_id']   = $user['user_id']; 
  $_SESSION['admin_email']     = $user['user_email'];
  $_SESSION['admin_name']      = $user['user_name']; 

  // Send back success WITH THE MAGIC TOKEN!
  echo json_encode([
      "success" => true, 
      "message" => "Authenticated successfully.",
      "token" => session_id(), // <--- THIS IS YOUR NEW VIP PASS
      "user" => [
          "user_id" => $user['user_id'],
          "user_name" => $user['user_name'],
          "user_email" => $user['user_email'],
          "user_contact" => $user['user_contact'] ?? ''
      ]
  ]);
} catch (Exception $e) {
  echo json_encode(["success" => false, "message" => "Server error"]);
}
?>