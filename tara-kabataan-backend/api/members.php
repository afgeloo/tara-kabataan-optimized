<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../config/db.php';

$sql = "SELECT members.member_id, members.member_name, members.member_image, roles.role_name, roles.role_id
        FROM members
        LEFT JOIN roles ON members.role_id = roles.role_id";

$result = $conn->query($sql);

$members = [];
while ($row = $result->fetch_assoc()) {
  $members[] = $row;
}

echo json_encode(["success" => true, "members" => $members]);

$conn->close();
?>
