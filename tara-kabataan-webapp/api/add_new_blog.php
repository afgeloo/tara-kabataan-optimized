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

    if (
        !isset($data['title']) || !isset($data['content']) || !isset($data['category']) ||
        !isset($data['blog_status']) || !isset($data['image_url']) || !isset($data['author'])
    ) {
        echo json_encode(["success" => false, "error" => "Missing fields"]);
        exit;
    }

    // ==============================================================================
    // 1. GENERATE CUSTOM BLOG ID (Replaces the TiDB missing trigger)
    // ==============================================================================
    // Hit the counter table to get a new number
    $conn->query("INSERT INTO tk_webapp.blog_id_counter VALUES (NULL)");
    $next_id = $conn->insert_id;

    // Convert number to Base36, pad with zeros to 6 chars, make uppercase
    $base36_id = str_pad(strtoupper(base_convert($next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
    $year = date("Y");
    $new_blog_id = "blogs-{$year}-{$base36_id}";

    // ==============================================================================
    // 2. INSERT BLOG WITH NEW ID
    // ==============================================================================
    $stmt = $conn->prepare("INSERT INTO tk_webapp.blogs (blog_id, blog_title, blog_content, blog_category, blog_status, blog_image, blog_author_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->bind_param(
        "sssssss",
        $new_blog_id,       // <-- The newly generated ID!
        $data['title'],
        $data['content'],
        $data['category'],
        $data['blog_status'],
        $data['image_url'],
        $data['author']
    );

    if ($stmt->execute()) {
        
        // Safe fetch using the exact ID we just created
        $fetchStmt = $conn->prepare("SELECT * FROM tk_webapp.blogs WHERE blog_id = ?");
        $fetchStmt->bind_param("s", $new_blog_id);
        $fetchStmt->execute();
        $result = $fetchStmt->get_result();
        $blog = $result->fetch_assoc();
        $fetchStmt->close();
    
        // ==============================================================================
        // 3. GENERATE IDS AND INSERT EXTRA IMAGES
        // ==============================================================================
        if (isset($data['more_images']) && is_array($data['more_images'])) {
            $imgStmt = $conn->prepare("INSERT INTO tk_webapp.blog_images (blog_image_id, blog_id, image_url) VALUES (?, ?, ?)");
    
            foreach ($data['more_images'] as $imgUrl) {
                // Hit the image counter table
                $conn->query("INSERT INTO tk_webapp.blog_image_id_counter VALUES (NULL)");
                $img_next_id = $conn->insert_id;
                
                // Convert to Base36
                $img_base36 = str_pad(strtoupper(base_convert($img_next_id, 10, 36)), 6, '0', STR_PAD_LEFT);
                $new_blog_image_id = "blogimg-{$year}-{$img_base36}";

                $imgStmt->bind_param("sss", $new_blog_image_id, $new_blog_id, $imgUrl);
                $imgStmt->execute();
            }
    
            $imgStmt->close();
        }
    
        echo json_encode(["success" => true, "blog" => $blog]);
    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }    

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>