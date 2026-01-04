document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const nombre = document.getElementById("regNombre").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confpassword = document.getElementById("conPassword").value;
    if (password !== confpassword) {
        alert("Las contraseñas no coinciden");
        return;
    }
    
    fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Error:", error));
});

