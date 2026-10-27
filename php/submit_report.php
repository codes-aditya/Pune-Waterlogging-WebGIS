<?php

header('Content-Type: application/json');

require_once 'db_connect.php';

try {

    // Get form data
    $citizen_name = $_POST['citizen_name'] ?? '';
    $contact_number = $_POST['contact_number'] ?? '';
    $water_depth = trim($_POST['water_depth'] ?? '');

$allowed_depths = [
    'Foot level (0-6 inches)',
    'Ankle deep (6-12 inches)',
    'Knee deep (12-24 inches)',
    'Above knee / thigh (24-36 inches)',
    'Waist deep (36-42 inches)',
    'Chest deep (42-60 inches)',
    'First-floor level',
    'Second-floor level',
    'Cannot estimate'
];

if (!in_array($water_depth, $allowed_depths, true)) {
    die('Invalid water-depth selection. Please select a valid water level.');
}
    $cause = $_POST['cause'] ?? '';
    $location_desc = $_POST['location_desc'] ?? '';

    $latitude = $_POST['latitude'] ?? '';
    $longitude = $_POST['longitude'] ?? '';
    $gps_accuracy = $_POST['gps_accuracy'] ?? '';

    // Basic validation
    if ($citizen_name === '') {
        throw new Exception('Citizen name is required.');
    }

    if ($water_depth === '') {
        throw new Exception('Water depth is required.');
    }

    if ($cause === '') {
        throw new Exception('Cause is required.');
    }

    if (!is_numeric($latitude) || !is_numeric($longitude)) {
        throw new Exception('Valid GPS location is required.');
    }

    // ---------------------------------------
    // Handle photo upload
    // ---------------------------------------

    $photo_path = null;

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {

        $upload_dir = __DIR__ . '/../uploads/';

        // Create uploads folder if it does not exist
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $original_name = $_FILES['photo']['name'];
        $tmp_name = $_FILES['photo']['tmp_name'];

        // Get file extension
        $extension = strtolower(
            pathinfo($original_name, PATHINFO_EXTENSION)
        );

        // Allowed image extensions
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($extension, $allowed_extensions)) {
            throw new Exception('Invalid image format.');
        }

        // Generate unique filename
        $new_filename = uniqid('waterlog_', true) . '.' . $extension;

        $destination = $upload_dir . $new_filename;

        // Move uploaded image
        if (!move_uploaded_file($tmp_name, $destination)) {
            throw new Exception('Failed to upload photo.');
        }

        // Path stored in database
        $photo_path = 'uploads/' . $new_filename;
    }

    // ---------------------------------------
    // Insert report into PostgreSQL/PostGIS
    // ---------------------------------------

    $sql = "
        INSERT INTO citizen_reports
        (
            citizen_name,
            contact_number,
            water_depth,
            cause,
            location_desc,
            photo_path,
            gps_accuracy,
            geom
        )
        VALUES
        (
            :citizen_name,
            :contact_number,
            :water_depth,
            :cause,
            :location_desc,
            :photo_path,
            :gps_accuracy,
            ST_SetSRID(
                ST_MakePoint(
                    :longitude,
                    :latitude
                ),
                4326
            )
        )
        RETURNING report_id
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':citizen_name' => $citizen_name,
        ':contact_number' => $contact_number,
        ':water_depth' => $water_depth,
        ':cause' => $cause,
        ':location_desc' => $location_desc,
        ':photo_path' => $photo_path,
        ':gps_accuracy' => $gps_accuracy !== '' ? $gps_accuracy : null,
        ':longitude' => $longitude,
        ':latitude' => $latitude
    ]);

    $report_id = $stmt->fetchColumn();

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Waterlogging report submitted successfully!',
        'report_id' => $report_id
    ]);

} catch (Exception $e) {

    // Error response
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>