document.addEventListener("DOMContentLoaded", function () {

    // Recuperar el nivel de zoom y la posición del almacenamiento local
    var savedLat = localStorage.getItem('mapLat');
    var savedLon = localStorage.getItem('mapLon');
    var savedZoom = localStorage.getItem('mapZoom');
    
    // Si tenim uns valors guardats osigui si no es null, li posem el que tenía i sino posem el perdefecte.
    var lat = savedLat ? parseFloat(savedLat) : 42.117974474865015;
    var lon = savedLon ? parseFloat(savedLon) : 2.7640465766256925;
    var zoom = savedZoom ? parseInt(savedZoom) : 13;


    var map = L.map('map').setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Passem les coordenades a el format que ens interessa.
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
            // Això sería cada parcela
            var geojsonLayer = L.Proj.geoJson(data, {
                // Depenent del valor de la cobertura apliquem un style o un altre
                style: function(feature) {
                    return {
                        color: feature.properties.COBERTURA ? '#67E70E' : 'red'
                    };
                },
                onEachFeature: function (feature, layer) {
                    var cobertura = feature.properties.COBERTURA ? "Sí" : "No";
                    var newCobertura = feature.properties.COBERTURA ? 0 : 1;
                    layer.bindPopup(
                        `<b>Parcela:</b> ${feature.properties.PARCELA}<br>
                        <b>Coordenades:</b> (${feature.properties.COORX}, ${feature.properties.COORY})<br>
                        <b>Cobertura:</b> ${cobertura}<br>
                        <button onclick="updateCobertura(${feature.properties.NINTERNO}, ${newCobertura})">
                            Canviar Cobertura
                        </button>`
                    );
                }
            });
            geojsonLayer.addTo(map);
            // map.fitBounds(geojsonLayer.getBounds());
        })
        .catch(error => {
            console.error('Error loading the GeoJSON data:', error);
        });

    // Funció per actualitzar la cobertura
    window.updateCobertura = function (NINTERNO, cobertura) {
        console.log('Updating cobertura for:', NINTERNO, 'to:', cobertura);
        fetch(`http://localhost:5000/api/update_cobertura/${NINTERNO}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ COBERTURA: cobertura })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Guardar el nivel de zoom y la posición actual del mapa en el almacenamiento local. En items al cache
                localStorage.setItem('mapLat', map.getCenter().lat);
                localStorage.setItem('mapLon', map.getCenter().lng);
                localStorage.setItem('mapZoom', map.getZoom());
                location.reload();
            } else {
                alert('Error al actualitzar la cobertura');
            }
        })
        .catch(error => {
            console.error('Error updating cobertura:', error);
        });
    }

    //TODO:
    // - Buscador de carrer.
    // - Direccio de carres a la info.
});
