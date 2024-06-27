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

    var searchMarker = null;  // Guardar el marcador de búsqueda

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
                    // Si ja ha carregat una capa geojsonLayer anteriorment la borra.
                    // Només eliminem la capa geojsonLayer, i no la search.
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
                            <b>Direcció:</b> ${feature.properties.DIRECCION}<br> 
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


    // Función para buscar dirección
    window.searchAddress = function () {
        var query = document.getElementById('search-input').value;
        fetch(`http://localhost:5000/api/search_address?query=${encodeURIComponent(query)}&option=2`)
            .then(response => {
                if (!response.ok) {
                    
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(address => {
                if (!address) {
                    alert('No se encontraron resultados');
                    return;
                }

                // Centrar el mapa en la nueva dirección encontrada
                map.setView([address.LAT, address.LON], 22);

                // Crear un marcador en la dirección encontrada
                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }
                searchMarker = L.marker([address.LAT, address.LON]).addTo(map);

                // Añadir popup al marcador
                searchMarker.bindPopup(
                    `<b>Parcela:</b> ${address.PARCELA}<br>
                <b>Direcció:</b> (${address.DIRECCION})<br> 
                <b>Coordenades:</b> (${address.LAT}, ${address.LON})<br> 
                <b>Cobertura:</b> ${["No", "Sí", "Próximament"][address.COBERTURA]}<br>
                <button class='btn_si' onclick="updateCobertura(${address.NINTERNO}, 1)">Sí</button>
                <button class='btn_no' onclick="updateCobertura(${address.NINTERNO}, 0)">No</button>
                <button class='btn_prox' onclick="updateCobertura(${address.NINTERNO}, 2)">Pròximament</button>`
                ).openPopup();
            })
            .catch(error => {
                console.error('Error searching address:', error);
                 // Si dona error al buscar.
                 var suggestionsList = document.getElementById('suggestions');
                 suggestionsList.innerHTML = ''; // Clear suggestions list
                 const errorMessage = document.createElement('li');
                 errorMessage.textContent = 'No hi ha cap resultat.'; // Display custom error message
                 suggestionsList.appendChild(errorMessage); // Append error message to the suggestions list
                 console.error('Error fetching suggestions:', error);
            });
    };

    // Funció per mostrar suggeriments a mesura que s'escriu
    window.showSuggestions = function (query) {
        // Fins que no s'han escrit 3 lletres no fa la cerca.
        if (query.length < 3) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }
        fetch(`http://localhost:5000/api/search_address?query=${encodeURIComponent(query)}&option=1`)
            .then(response => { // Mirem la reposta de la 
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('No s\'han trobat resultats'); // Specific message for 404 error
                    }
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(suggestions => {
                var suggestionsList = document.getElementById('suggestions');
                suggestionsList.innerHTML = '';
                suggestions.forEach(address => {
                    // Mostrem els elemetns suggertis.
                    var listItem = document.createElement('li');
                    listItem.textContent = address.DIRECCION;
                    // Quan cliquem un element.
                    listItem.onclick = function () {
                        // Posem la direccio a la barra de buscar.
                        document.getElementById('search-input').value = address.DIRECCION;
                        suggestionsList.innerHTML = ''; // Netejem els camps suggerits.
                        window.searchAddress(); // Executem la funció buscar adreça que ja agafe el valor del camp search-input
                    };
                    suggestionsList.appendChild(listItem);
                });
            })
            .catch(error => {
                // Si dona error al buscar mostrem a les sugerides que no s'ha trobat resultats.
                var suggestionsList = document.getElementById('suggestions');
                suggestionsList.innerHTML = ''; // Clear suggestions list
                const errorMessage = document.createElement('li');
                errorMessage.textContent = error.message; // Display custom error message
                suggestionsList.appendChild(errorMessage); // Append error message to the suggestions list
                console.error('Error fetching suggestions:', error);
            });
    };



    // Funció per eliminar la marca de cerca
    window.deleteAddress = function () {
        document.getElementById('search-input').value = '';
        // Comprova si hi ha un mercador creat.
        if (searchMarker) {
            // Si esta creat l'elimina i posa la variable com a null.
            map.removeLayer(searchMarker);
            searchMarker = null;
            query == '';
        }
    };

    // Cada vegada que canvia la posicó del mapa fem crida a la base de dades per saber les dades catastrals.
    map.on('moveend', loadData);

    loadData();  // Cargar los datos inicialmente

});
