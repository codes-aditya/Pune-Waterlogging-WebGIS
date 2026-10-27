
/* =========================================
   1. INITIALIZE MAP
========================================= */

const map = L.map("map", {
    center: [18.5204, 73.8567],
    zoom: 12,
    zoomControl: true
});


/* =========================================
   2. BASEMAPS
========================================= */

const esriStreet = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    }
);

const esriSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    }
);

esriStreet.addTo(map);



/* =========================================
   3. GEOSERVER WMS CONFIGURATION
========================================= */

// GeoServer WMS URL
const geoserverURL =
    "http://localhost:8080/geoserver/pune/wms";


// AHP Waterlogging Susceptibility
const ahpLayer = L.tileLayer.wms(geoserverURL, {
    layers: "pune:Pune_Waterlogging_Susceptibility_5Classes",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.7
});


// Land Use / Land Cover
const lulcLayer = L.tileLayer.wms(geoserverURL, {
    layers: "pune:pune_lulc_10m",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.7
});


// Digital Elevation Model
const demLayer = L.tileLayer.wms(geoserverURL, {
    layers: "pune:pune_dem_projected",
    format: "image/png",
    transparent: true,
    version: "1.1.1",
    opacity: 0.6
});

/* =========================================
   4. CITIZEN REPORT MARKER COLOURS
========================================= */

function getMarkerColor(waterDepth) {

    const depth = String(waterDepth || "")
        .toLowerCase()
        .trim();

    if (
        depth.includes("foot level") ||
        depth.includes("ankle")
    ) {
        return "#16a34a";
    }

    if (depth.includes("above knee") ||
        depth.includes("thigh") ||
        depth.includes("waist")) {
        return "#f97316";
    }

    if (depth.includes("knee deep")) {
        return "#eab308";
    }

    if (depth.includes("chest")) {
        return "#dc2626";
    }

    if (
        depth.includes("first-floor") ||
        depth.includes("first floor") ||
        depth.includes("second-floor") ||
        depth.includes("second floor")
    ) {
        return "#7f1d1d";
    }

    return "#2563eb";
}


/* =========================================
   5. CITIZEN REPORTS LAYER
========================================= */

const citizenReports = L.layerGroup();

async function loadCitizenReports() {

    try {

        const response = await fetch(
            "php/get_reports.php"
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        citizenReports.clearLayers();

        L.geoJSON(data, {

            pointToLayer: function(feature, latlng) {

                return L.circleMarker(latlng, {
                    radius: 9,
                    color: "white",
                    weight: 2,
                    fillColor: getMarkerColor(
                        feature.properties.water_depth
                    ),
                    fillOpacity: 0.95
                });

            },

            onEachFeature: function(feature, layer) {

                const p = feature.properties;

                const popup = document.createElement("div");

                const title = document.createElement("strong");
                title.textContent = "Waterlogging Report";
                popup.appendChild(title);

                [
                    ["Water Depth", p.water_depth],
                    ["Cause", p.cause],
                    ["Location", p.location_desc],
                    ["Date", p.created_at]
                ].forEach(function(item) {

                    const line = document.createElement("p");

                    line.textContent =
                        item[0] + ": " +
                        (item[1] ?? "N/A");

                    popup.appendChild(line);

                });

                if (p.photo_path) {

                    const img = document.createElement("img");

                    img.src = p.photo_path;
                    img.className = "popup-img";
                    img.alt = "Waterlogging report photograph";

                    popup.appendChild(img);
                }

                layer.bindPopup(popup);
            }

        }).addTo(citizenReports);

    } catch (error) {

        console.error(
            "Unable to load citizen reports:",
            error
        );
    }
}

citizenReports.addTo(map);
loadCitizenReports();


/* =========================================
   6. DEFAULT VISIBLE GIS LAYERS
========================================= */

demLayer.addTo(map);


/* =========================================
   7. LAYER CONTROL
========================================= */

const baseMaps = {
    "Street Map (Esri)": esriStreet,
    "Satellite Imagery": esriSatellite
};

const overlayMaps = {
    "AHP Susceptibility (WMS)": ahpLayer,
    "Land Use / Land Cover (LULC)": lulcLayer,
    "DEM Elevation": demLayer,
    "Citizen Reports (Markers)": citizenReports
};

L.control.layers(
    baseMaps,
    overlayMaps,
    {
        collapsed: false,
        position: "topright"
    }
).addTo(map);


/* =========================================
   8. MAP LEGEND
========================================= */

const legend = L.control({
    position: "bottomright"
});

legend.onAdd = function() {

    const div = L.DomUtil.create(
        "div",
        "legend"
    );

    div.innerHTML = `
        <h4>Citizen Reports</h4>

        <div><i style="background:#16a34a"></i>
        Shallow / ankle level</div>

        <div><i style="background:#eab308"></i>
        Moderate depth</div>

        <div><i style="background:#f97316"></i>
        Above knee / waist</div>

        <div><i style="background:#dc2626"></i>
        Chest deep</div>

        <div><i style="background:#7f1d1d"></i>
        Building-floor level</div>

        <div><i style="background:#2563eb"></i>
        Other / unknown</div>

        <hr>

        <h4>AHP Susceptibility</h4>

        <div class="legend-ahp">
        <i style="background:#34c9a0"></i>
        Very Low</div>

        <div class="legend-ahp">
        <i style="background:#a3d939"></i>
        Low</div>

        <div class="legend-ahp">
        <i style="background:#facc15"></i>
        Moderate</div>

        <div class="legend-ahp">
        <i style="background:#fb923c"></i>
        High</div>

        <div class="legend-ahp">
        <i style="background:#f05252"></i>
        Very High</div>
    `;

    return div;
};

legend.addTo(map);


/* =========================================
   9. FIX MAP DISPLAY
========================================= */

setTimeout(function() {
    map.invalidateSize();
}, 300);
