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

    function loadData() {
        // Mostrar logo de "cargando"
        document.getElementById('loading').style.display = 'block';

        var bounds = map.getBounds();
        var minx = bounds.getWest();
        var miny = bounds.getSouth();
        var maxx = bounds.getEast();
        var maxy = bounds.getNorth();

        fetch(`http://localhost:5000/api/catastral?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (window.geojsonLayer) {
                    map.removeLayer(window.geojsonLayer);
                }

                var geojsonLayer = L.Proj.geoJson(data, {
                    style: function (feature) {
                        switch (feature.properties.COBERTURA) {
                            case 1: return { color: 'green' };
                            case 2: return { color: 'orange' };
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
                            <button class='btn_si' onclick="updateCobertura(${feature.properties.NINTERNO}, 1)">Sí</button>
                            <button class='btn_no' onclick="updateCobertura(${feature.properties.NINTERNO}, 0)">No</button>
                            <button class='btn_prox' onclick="updateCobertura(${feature.properties.NINTERNO}, 2)">Pròximament</button>`
                        );
                    }
                });
                geojsonLayer.addTo(map);
                window.geojsonLayer = geojsonLayer;  // Guardem la capa per utilitzar-la al cercar.
                // map.fitBounds(geojsonLayer.getBounds());
                // Quan carraguem la capa amaguem el logo de loading.
                document.getElementById('loading').style.display = 'none';
            })
            .catch(error => {
                console.error('Error loading the GeoJSON data:', error);
                 // Ocultar logo de "cargando" en caso de error también
                document.getElementById('loading').style.display = 'none';
            });
    }


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

    // Cada vegada que canvia la posicó del mapa fem crida a la base de dades per saber les dades catastrals.
    map.on('moveend', loadData);

    loadData();  // Cargar los datos inicialmente

    //TODO:
    // - Buscador de carrer.
    // - Quan sigui client color rosa.
});
