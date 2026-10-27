function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById("locationStatus").innerText =
            "Geolocation is not supported by this browser.";

        return;
    }


    document.getElementById("locationStatus").innerText =
        "Getting your location...";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            document.getElementById("latitude").value =
                latitude;

            document.getElementById("longitude").value =
                longitude;

            document.getElementById("gps_accuracy").value =
                accuracy;


            document.getElementById("locationStatus").innerText =
                "Location captured successfully! " +
                "Latitude: " +
                latitude.toFixed(6) +
                " | Longitude: " +
                longitude.toFixed(6) +
                " | Accuracy: " +
                accuracy.toFixed(1) +
                " m";

        },


        function(error) {

            document.getElementById("locationStatus").innerText =
                "Unable to get your location. Please allow location access.";

        }

    );

}
document.getElementById("reportForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const form = this;

    // Check whether GPS location has been captured
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    if (!latitude || !longitude) {
        alert("Please click 'Get My Location' before submitting the report.");
        return;
    }

    // Create form data
    const formData = new FormData(form);

    try {

        // Send data to PHP
        const response = await fetch("php/submit_report.php", {
            method: "POST",
            body: formData
        });

        // Convert PHP response to JSON
        const result = await response.json();

        if (result.success) {

            alert(
                "Report submitted successfully!\n" +
                "Report ID: " + result.report_id
            );

            // Clear the form
            form.reset();

            // Clear location status
            document.getElementById("locationStatus").innerText =
                "Location not captured";

        } else {

            alert("Error: " + result.message);

        }

    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to the server.\n" +
            "Please make sure Apache is running."
        );
    }

});