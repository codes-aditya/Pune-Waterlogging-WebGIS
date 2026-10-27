<?php

header('Content-Type: application/json');

require_once 'db_connect.php';

try {

    $sql = "
        SELECT
            report_id,
            citizen_name,
            contact_number,
            water_depth,
            cause,
            location_desc,
            photo_path,
            gps_accuracy,
            created_at,
            ST_AsGeoJSON(geom) AS geometry
        FROM citizen_reports
        ORDER BY created_at DESC
    ";

    $stmt = $pdo->query($sql);

    $features = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

        $geometry = json_decode($row['geometry']);

        unset($row['geometry']);

        $features[] = [
            'type' => 'Feature',
            'geometry' => $geometry,
            'properties' => $row
        ];
    }

    $geojson = [
        'type' => 'FeatureCollection',
        'features' => $features
    ];

    echo json_encode($geojson);

} catch (Exception $e) {

    echo json_encode([
        'type' => 'FeatureCollection',
        'features' => [],
        'error' => $e->getMessage()
    ]);
}
?>