document.addEventListener("DOMContentLoaded", async () => {
    const contenedorComida = document.querySelector("#contenedor-comida"); // Contenedor para productos de comida
    const contenedorBebida = document.querySelector("#contenedor-bebida"); // Contenedor para productos de bebida
    const contenedorCombo = document.querySelector("#contenedor-combo");   // Contenedor para productos de combo

    let carrito = JSON.parse(localStorage.getItem("carrito")) || []; // Recuperar carrito de localStorage

    try {
        // Petición para obtener productos desde el backend
        const respuesta = await fetch("http://localhost:3000/productos"); // Ruta de la API
        if (!respuesta.ok) {
            throw new Error("Error al cargar los productos desde la API.");
        }
        const productos = await respuesta.json();

        productos.forEach(producto => {
            // Verificar categoría y asignar el contenedor correspondiente
            let contenedor;

            switch (producto.categoria) {
                case 'comida':
                    contenedor = contenedorComida;
                    break;
                case 'bebida':
                    contenedor = contenedorBebida;
                    break;
                case 'combo':
                    contenedor = contenedorCombo;
                    break;
                default:
                    console.error("Categoría no válida para el producto:", producto);
                    return; // Si la categoría no es válida, ignoramos el producto
            }

            // Crear la sección para el producto
            const section = document.createElement("section");
            section.classList.add("Cuadrados");

            // 📝 Estructura del producto
            section.innerHTML = `
                <p class="Letrasencuadrados"><b>${producto.nombre}</b></p>
                <div class="linecua"></div>
                <p class="precio">$${producto.precio}</p>
                <div class="imagen-container">
                    <img class="imagenescua" src="${producto.imagen}" alt="${producto.nombre}">
                    <p class="texto-hover">${producto.descripcion}</p>
                </div>
                <button class="botoncarro" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}" data-imagen="${producto.imagen}">
                    <p class="textoboton">Ordenar</p>
                </button>
            `;

            // Añadir la sección al contenedor correspondiente
            contenedor.appendChild(section);

            // Agregar evento al botón "Ordenar"
            section.querySelector(".botoncarro").addEventListener("click", (e) => {
                agregarAlCarrito(e.target.closest("button").dataset);
            });
        });
    } catch (error) {
        console.error("Error al cargar productos:", error.message);
    }

    // 📦 Función para agregar productos al carrito
    function agregarAlCarrito(producto) {
        const productoExistente = carrito.find(item => item.id == producto.id);

        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                imagen: producto.imagen,
                cantidad: 1
            });
        }

        // Guardar carrito actualizado en localStorage
        localStorage.setItem("carrito", JSON.stringify(carrito));
        alert(`${producto.nombre} añadido al carrito 🛒`);
    }
});