document.addEventListener("DOMContentLoaded", function() {
    var lat = 42.117974474865015;
    var lon = 2.7640465766256925;
    var map = L.map('map').setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Definir el sistema de coordenadas EPSG:25831
    var crs = new L.Proj.CRS('EPSG:25831',
        '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs',
        {
            resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625],
            origin: [0, 0]
        }
    );

    // Fem la consulta a la API.
    fetch('http://localhost:5000/api/catastral')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            var geojsonLayer = L.Proj.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng);
                }
            });
            geojsonLayer.addTo(map);
            map.fitBounds(geojsonLayer.getBounds());
        })
        .catch(error => {
            console.error('Error loading the GeoJSON data:', error);
        });
});
s
