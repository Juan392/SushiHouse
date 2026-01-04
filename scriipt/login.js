// Verificar que el archivo JavaScript se esté ejecutando
console.log("📢 El archivo login.js se está ejecutando correctamente.");


// Manejar el evento submit del formulario
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Previene el envío tradicional del formulario

    // Obtener los valores de los campos del formulario
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPassword").value.trim();

    // Depuración: Verificar los datos antes de enviarlos
    console.log("📡 Datos a enviar:", { email, password });

    // Validar que los campos no estén vacíos
    if (!email || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    // Enviar la solicitud al servidor
    fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // Especificar que el cuerpo es JSON
        },
        body: JSON.stringify({ email, password }), // Convertir los datos a JSON
    })
        .then((response) => {

            if (!response.ok) {
                // Si la respuesta no es exitosa, lanzar un error
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            return response.json(); // Parsear la respuesta como JSON
        })
        .then((data) => {
            // Verificar si se recibió un token
            if (data.token) {
                // Guardar token, rol y userId correctamente
                localStorage.setItem("token", data.token);
                localStorage.setItem("rol", data.rol); // Guardar el rol del usuario
                localStorage.setItem("userId", data.id); 
                console.log("🎉 Token y datos guardados en localStorage.");

                alert("✅ Inicio de sesión exitoso.");

                // Redirigir según el rol
                switch (data.rol) {
                    case "admin":
                        window.location.href = "/adminDashboard";
                        break;
                    case "empleado":
                        window.location.href = "/empleado-dashboard";
                        break;
                    default:
                        window.location.href = "/perfil"; // Para usuarios normales
                        break;
                }
            } else {
                alert(data.message || "Error en el inicio de sesión.");
            }
        })
        .catch((error) => {
            // Depuración: Mostrar errores en la consola
            console.error("Error en el proceso de login:", error);
            alert("Ocurrió un error. Por favor, inténtalo de nuevo.");
        });
});
