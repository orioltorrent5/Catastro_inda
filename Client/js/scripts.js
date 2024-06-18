document.addEventListener("DOMContentLoaded", function () {
    var lat = 42.117974474865015;
    var lon = 2.7640465766256925;
    var map = L.map('map').setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    var crs = new L.Proj.CRS('EPSG:25831',
        '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs',
        {
            resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625],
            origin: [0, 0]
        }
    );

    fetch('http://localhost:5000/api/catastral')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            var geojsonLayer = L.Proj.geoJson(data, {
                onEachFeature: function (feature, layer) {
                    var cobertura = feature.properties.cobertura ? "Sí" : "No";
                    var newCobertura = feature.properties.cobertura ? 0 : 1; // Canviar el valor correctament
                    layer.bindPopup(
                        `<b>Parcela:</b> ${feature.properties.parcela}<br>
                        <b>Coordenades:</b> (${feature.properties.coorx}, ${feature.properties.coory})<br>
                        <b>Cobertura:</b> ${cobertura}<br>
                        <button onclick="updateCobertura(${feature.properties.id}, ${newCobertura})">
                            Canviar Cobertura
                        </button>`
                    );
                }
            });
            geojsonLayer.addTo(map);
            map.fitBounds(geojsonLayer.getBounds());
        })
        .catch(error => {
            console.error('Error loading the GeoJSON data:', error);
        });

    window.updateCobertura = function (id, cobertura) {
        fetch(`http://localhost:5000/api/update_cobertura/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cobertura: cobertura })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Cobertura actualitzada');
                location.reload();  // Recargar la pàgina per reflectir els canvis
            } else {
                alert('Error al actualitzar la cobertura');
            }
        })
        .catch(error => {
            console.error('Error updating cobertura:', error);
        });
    }
});
