window.onload = function() {
    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el envío tradicional del formulario

        // Recoger los datos del formulario
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var btn_register = document.getElementById('password').value;

        // Construir la solicitud fetch
        fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert("Benvingut " + data.username);
                // Si fa el login correcte, redirigm a la pagina on hi ha el mapa.
                location.href ="../../Client";
                // Creem un token de login
                localStorage.setItem('authToken', 'e1feqwefqw');
                localStorage.setItem('username', data.username);
                localStorage.setItem('rol', data.rol);

            } else if (data.error) {
                alert("Error de logueo: " + data.error);
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
        })
        .catch(error => {
            console.error('Error durante el login:', error);
            alert("Error de logueo: " + error.message);
        });
        
    });
};