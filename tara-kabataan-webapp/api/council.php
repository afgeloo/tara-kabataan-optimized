<?php
// Add this to the top of your GET APIs:
header("Cache-Control: max-age=0, s-maxage=60, stale-while-revalidate=86400");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php';

$query = "
    SELECT 
        members.member_id,
        members.member_name,
        members.member_image,
        members.role_id,
        roles.role_name 
    FROM tk_webapp.members 
    JOIN tk_webapp.roles ON members.role_id = roles.role_id
";

$result = $conn->query($query);

if ($result) {
    $council = [];
    while ($row = $result->fetch_assoc()) {
        $council[] = $row;
    }
    echo json_encode($council, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch council members."]);
}

$conn->close();
?>