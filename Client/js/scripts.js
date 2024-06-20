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
                    switch (feature.properties.COBERTURA) {
                        case 1: return { color: 'green' };
                        case 2: return { color: 'orange' };
                        case 3: return { color: 'blue' };
                        default: return { color: 'red' };
                    };
                },
                onEachFeature: function (feature, layer) {
                    var coberturaText = ["No", "Sí", "Próximament", "Client"][feature.properties.COBERTURA];
                    layer.bindPopup(
                        `<b>Parcela:</b> ${feature.properties.PARCELA}<br>
                        <b>Direcció:</b> (${feature.properties.DIRECCION})<br> 
                        <b>Coordenades:</b> (${feature.properties.LAT}, ${feature.properties.LON})<br> 
                        <b>Cobertura:</b> ${coberturaText}<br>
                        <form onsubmit="event.preventDefault(); updateCobertura(${feature.properties.NINTERNO}, this.cobertura.value);">
                            <select name="cobertura">
                                <option value="0">No</option>
                                <option value="1">Sí</option>
                                <option value="2">Próximament</option>
                                <option value="3">Client</option>
                            </select>
                            <button type="submit">Canviar</button>
                        </form>`
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
    // - Posar Latitut i Longitut a descripció del mapa
    // - Quan sigui client color rosa.
});
