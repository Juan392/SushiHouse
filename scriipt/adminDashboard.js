document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("🔐 Acceso denegado. Debes iniciar sesión como administrador.");
        window.location.href = "/login";
        return;
    }

    try {
        const response = await fetch('/isAdmin', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                alert("No tienes permisos para acceder a esta página.");
            } else {
                alert("Error en la verificación de permisos.");
            }
            localStorage.removeItem("token"); // Elimina el token si es inválido
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        if (!data.isAdmin) {
            alert("No tienes permisos para acceder a esta página.");
            localStorage.removeItem("token");
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Error al verificar permisos:", error);
        alert("Error en la comunicación con el servidor.");
        window.location.href = "/";
    }
});



document.getElementById('imagen').addEventListener('input', function (e) {
    const url = e.target.value;
    const preview = document.getElementById('imagen_preview');
    preview.innerHTML = '';

    // Expresión regular para verificar que sea una imagen válida (JPG, PNG, GIF, etc.)
    const regex = /\.(jpeg|jpg|gif|png)$/i;

    if (!regex.test(url)) {
        preview.innerHTML = '<p style="color: red;"> URL no válida. Debe ser una imagen (JPG, PNG, GIF).</p>';
        return;
    }

    // Crear y mostrar la imagen desde la URL
    const img = document.createElement('img');
    img.src = url;
    img.style.maxHeight = '150px';
    img.style.maxWidth = '100%';
    img.onload = function () {
        preview.innerHTML = ''; // Limpiar si la imagen se carga correctamente
        preview.appendChild(img);
    };
    img.onerror = function () {
        preview.innerHTML = '<p style="color: red;">No se pudo cargar la imagen desde la URL proporcionada.</p>';
    };
});


// ✅ Agregar Producto
document.getElementById('formAgregarProducto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const precio = document.getElementById('precio').value;
  const categoria = document.getElementById('categoria').value;
  const imagen = document.getElementById('imagen').value;
  const stock = document.getElementById('stock').value;
  try {
      const response = await fetch(`/api/admin/productos/agregar`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ nombre, descripcion, precio, categoria, imagen, stock }),
      });

      const data = await response.json();
      if (response.ok) {
          document.getElementById('mensajeProducto').textContent = 'Producto agregado correctamente.';
      } else {
          document.getElementById('mensajeProducto').textContent = `Error: ${data.error}`;
      }
  } catch (error) {
      console.error('Error al agregar el producto:', error);
  }
});

// ✅ Agregar Empleado
document.getElementById('formAgregarEmpleado').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombreEmpleado').value;
  const email = document.getElementById('emailEmpleado').value;
  const password = document.getElementById('passwordEmpleado').value;
  const rol = document.getElementById('rolEmpleado').value;
  const puesto = document.getElementById('puesto').value;
  const sueldo = document.getElementById('sueldo').value;
  try {
      const response = await fetch(`/api/admin/empleados/agregar`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ nombre, email, password, rol, puesto, sueldo }),
      });

      const data = await response.json();
      if (response.ok) {
          document.getElementById('mensajeEmpleado').textContent = 'Empleado agregado correctamente.';
      } else {
          document.getElementById('mensajeEmpleado').textContent = `Error: ${data.error}`;
      }
  } catch (error) {
      console.error('Error al agregar el empleado:', error);
  }
  
});

document.getElementById('imagen_url').addEventListener('input', function (e) {
    const url = e.target.value;
    const preview = document.getElementById('imagen_preview_cupon');
    preview.innerHTML = '';

    // Expresión regular para verificar que sea una imagen válida (JPG, PNG, GIF, etc.)
    const regex = /\.(jpeg|jpg|gif|png)$/i;

    if (!regex.test(url)) {
        preview.innerHTML = '<p style="color: red;"> URL no válida. Debe ser una imagen (JPG, PNG, GIF).</p>';
        return;
    }

    // Crear y mostrar la imagen desde la URL
    const img = document.createElement('img');
    img.src = url;
    img.style.maxHeight = '150px';
    img.style.maxWidth = '100%';
    img.onload = function () {
        preview.innerHTML = ''; // Limpiar si la imagen se carga correctamente
        preview.appendChild(img);
    };
    img.onerror = function () {
        preview.innerHTML = '<p style="color: red;">No se pudo cargar la imagen desde la URL proporcionada.</p>';
    };
});

document.getElementById('formAgregarCupon').addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcionC').value;
    const imagen_url = document.getElementById('imagen_url').value;
    const fecha_expiracion = document.getElementById('fecha_expiracion').value;
    const descuento = document.getElementById('descuento').value;
    console.log(fecha_expiracion)

    try {
        const response = await fetch('/api/admin/cupones/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ titulo, descripcion, imagen_url, fecha_expiracion, descuento }),
        });

        const data = await response.json();
        const mensaje = document.getElementById('mensajeCupon');

        if (response.ok) {
            mensaje.textContent = 'Cupón agregado correctamente.';
        } else {
            mensaje.textContent = `Error: ${data.error}`;
        }
    } catch (error) {
        console.error('Error al agregar el cupón:', error);
        document.getElementById('mensajeCupon').textContent = 'Error al conectar con el servidor.';
    }
});

