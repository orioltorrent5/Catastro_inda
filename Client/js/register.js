window.onload = function() {

    if (localStorage.getItem('authToken') !== null){

    document.getElementById('register-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el envío tradicional del formulario

        // Recoger los datos del formulario
        var username = document.getElementById('new-username').value;
        var password = document.getElementById('new-password').value;

        // Construir la solicitud fetch
        fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert("Registre correcte.");
                // Si fa el login correcte, redirigm a la pagina on hi ha el mapa.
                location.href ="./login.html";
            } else if (data.error) {
                alert("Error de registre: " + data.error);
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
        })
        .catch(error => {
            console.error('Error durant el registre:', error);
            alert("Error de registre: " + error.message);
        });
        
    });
    }else {
        // Si el usuario no está autenticado, mostrar un mensaje y potencialmente ocultar el formulario
        document.body.innerHTML = '<p>Tens de tenir la sessió iniciada per afegir nous usuaris.</p>'; // Reemplaza todo el contenido de body o ajusta según necesidad
        // También podrías redirigir al usuario al login o realizar otras acciones
    }
};