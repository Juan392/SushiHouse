let token = localStorage.getItem("token");
let userId = "";
let newAddress = "";

if (!token) {
    window.location.href = "/login";
} else {
    // Función para decodificar el token JWT
    function decodeJWT(token) {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            return null;
        }
    }

    const decodedToken = decodeJWT(token);

    if (!decodedToken || !decodedToken.rol || !decodedToken.userId) {
        console.error("Token inválido o sin rol. Redirigiendo a /login...");
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    const rol = decodedToken.rol;
    const nombre = decodedToken.nombre;
    userId = decodedToken.userId; // Asignar el userId desde el token
    const email = decodedToken.email;
    
    // Actualizar la interfaz con datos del token decodificado
    document.getElementById("userName").textContent = nombre || "Usuario";
    document.getElementById("userRole").textContent = `Rol: ${rol === "usuario" ? "Cliente" : rol.charAt(0).toUpperCase() + rol.slice(1)}`;
    document.getElementById("userEmail").textContent = email || "Usuario";
    
    // Mostrar la sección correspondiente al rol
    if (rol === "admin") {
        document.getElementById("adminSection").style.display = "block";
        loadProfileImage("profileImageAdmin");
        document.getElementById("adminName").textContent = nombre || "Usuario";
        document.getElementById("adminEmail").textContent = email || "Usuario";
    } else if (rol === "empleado") {
        document.getElementById("empleadoSection").style.display = "block";
        loadProfileImage("profileImageEmpleado");
        document.getElementById("empleadoName").textContent = nombre || "Usuario";
        document.getElementById("empleadoEmail").textContent = email || "Usuario";
    } else {
        document.getElementById("usuarioSection").style.display = "block";
        loadProfileImage("profileImage");
        loadUserAddress(userId);
    }
}

function getCurrentUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decodedToken = decodeJWT(token);
    return decodedToken?.rol || null;
}

// Función para cargar la foto de perfil
async function loadProfileImage(imgElementId) {
    try {
        const response = await fetch("/get-profile-image", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener la foto de perfil: ${response.statusText}`);
        }

        const data = await response.json();

        // Si se encuentra la imagen, mostrarla; de lo contrario, mantener perfil.png
        if (data.fotoPerfil) {
            document.getElementById(imgElementId).src = data.fotoPerfil;
        } else {
            document.getElementById(imgElementId).src = "../assets/perfil.png"; // Imagen predeterminada
        }
    } catch (error) {
        console.error("Error al cargar la foto de perfil:", error);
        document.getElementById(imgElementId).src = "../assets/perfil.png";
    }
}

// Función para cargar la dirección desde la base de datos
async function loadUserAddress(userId) {
    try {
        const response = await fetch(`/get-user-address/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener la dirección: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.direccion) {
            document.getElementById("userAddress").textContent = data.direccion;
        } else {
            document.getElementById("userAddress").textContent = "Dirección no proporcionada";
        }
    } catch (error) {
        console.error("Error al cargar la dirección:", error);
        document.getElementById("userAddress").textContent = "Error al cargar la dirección";
    }
}

// Botón para cerrar sesión para TODOS los roles
const logoutButtons = document.querySelectorAll("[id^='logoutButton']");
logoutButtons.forEach((button) => {
    button.addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "/login";
    });
});

// Función para redirigir al panel del administrador
document.getElementById("adminDashboardButton").addEventListener("click", function () {
    const rol = getCurrentUserRole();

    if (rol === "admin") {
        window.location.href = "/web/adminDashboard.html";
    } else {
        alert("No tienes permisos para acceder al panel de administración.");
    }
});

// Función para redirigir al panel del empleado
document.getElementById("empleadoTasksButton").addEventListener("click", function () {
    const rol = getCurrentUserRole();

    if (rol === "empleado") {
        window.location.href = "/web/EmpleadoDashBoard.html";
    } else {
        alert("No tienes permisos para acceder al panel de administración.");
    }
});

// Manejar subida de imagen y edición de dirección para usuario
document.addEventListener("DOMContentLoaded", function () {
    const roles = ["usuario", "admin", "empleado"];
    roles.forEach((rol) => {
        const profileImage = document.getElementById(
            `profileImage${rol === "usuario" ? "" : rol.charAt(0).toUpperCase() + rol.slice(1)}`
        );
        const uploadProfileImage = document.getElementById(
            `uploadProfileImage${rol === "usuario" ? "" : rol.charAt(0).toUpperCase() + rol.slice(1)}`
        );
        const editAddressButton = document.getElementById("editAddressButton");
        const addressInput = document.getElementById("addressInput");
        const saveAddressButton = document.getElementById("saveAddressButton");

        if (uploadProfileImage) {
            uploadProfileImage.addEventListener("change", async function () {
                const file = uploadProfileImage.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append("imagen", file);

                    try {
                        const response = await fetch("/update-profile-image", {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            body: formData,
                        });

                        if (!response.ok) {
                            throw new Error("Error al actualizar la imagen de perfil");
                        }
                        
                        loadProfileImage(
                            `profileImage${rol === "usuario" ? "" : rol.charAt(0).toUpperCase() + rol.slice(1)}`
                        );
                    } catch (error) {
                        console.error("Error al actualizar la imagen:", error);
                    }
                }
            });
        }

        if (editAddressButton && addressInput && saveAddressButton) {
            editAddressButton.addEventListener("click", function () {
                addressInput.style.display = "inline-block";
                saveAddressButton.style.display = "inline-block";
                addressInput.value = document.getElementById("userAddress").textContent;
            });

            saveAddressButton.addEventListener("click", async function () {
                const newAddress = addressInput.value.trim();
                if (newAddress) {
                    document.getElementById("userAddress").textContent = newAddress;
                    addressInput.style.display = "none";
                    saveAddressButton.style.display = "none";

                    try {
                        const response = await fetch("/update-address", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                direccion: newAddress,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error("Error al actualizar la dirección");
                        }
                    } catch (error) {
                        console.error("Error al actualizar la dirección:", error);
                    }
                } else {
                    alert("La dirección no puede estar vacía.");
                }
            });
        }
    });
});