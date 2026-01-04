document.addEventListener("DOMContentLoaded", () => {
    const carritoContainer = document.querySelector("#carritoContainer");
    const totalElement = document.querySelector("#totalCarrito");
    const vaciarBtn = document.querySelector("#vaciarCarrito");
    const realizarPedidoBtn = document.querySelector("#realizarPedido");
    const descuentoData = JSON.parse(localStorage.getItem('totalConDescuento')) || {};
    const descuentoAplicado = parseFloat(descuentoData.descuentoAplicado) || 0;
    console.log(descuentoAplicado)
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const token = localStorage.getItem("token");

    // Función para actualizar el total del carrito con descuentos aplicados
    function actualizarTotal(total) {
        const totalElement = document.querySelector("#totalCarrito");
    
        // Verificar que total es un número válido
        if (isNaN(total)) {
            console.error("El total no es un número válido.");
            return;
        }
    
        // Si el total es 0 o no es un número válido, mostrar 0.00
        if (total === 0) {
            totalElement.textContent = "🛒 Total: $0.00";
        } else {
            totalElement.textContent = `🛒 Total: $${total.toFixed(2)}`;
        }
    }

    // Función para renderizar los productos en el carrito
    function renderizarCarrito() {
        if (!carritoContainer) {
            console.error("Contenedor del carrito no encontrado.");
            return;
        }

        carritoContainer.innerHTML = "";

        if (carrito.length === 0) {
            carritoContainer.innerHTML = "<p class='nos'>🛑 El carrito está vacío.</p>";
            actualizarTotal();
            return;
        }

        let totalCarrito = 0; // Inicializamos el total en 0

        carrito.forEach((producto, index) => {
            const section = document.createElement("section");
            section.classList.add("Cuadrados");
    
            // Calcular el precio total de este producto
            const descuento = parseFloat(descuentoAplicado) || 0;
            console.log(descuento)
            const precioSinDescuento =(parseFloat(producto.precio) * parseInt(producto.cantidad));
            const precioTotalProducto = precioSinDescuento * (1 - descuentoAplicado / 100);;
            totalCarrito +=parseInt( precioTotalProducto); // Sumar al total global
    
            section.innerHTML = `
                <p class="Letrasencuadrados"><b>${producto.nombre}</b></p>
                <div class="linecua"></div>
                <p class="precio">
                    📦 Cantidad: ${producto.cantidad}<br>
                    🧾 Precio: $${producto.precio}
                </p>
                <div class="imagen-container">
                    <img class="imagenescua" src="${producto.imagen}" alt="${producto.nombre}">
                    <p class="texto-hover">${producto.descripcion}</p>
                </div>
                <button class="botoncarro eliminarProducto" data-index="${index}">
                    <p class="textoboton">❌ Eliminar</p>
                </button>
            `;
    
            carritoContainer.appendChild(section);
        });

        // Agregar evento para eliminar productos
        document.querySelectorAll(".eliminarProducto").forEach(boton => {
            boton.addEventListener("click", (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                if (!isNaN(index)) {
                    eliminarProducto(index);
                }
            });
        });

        // Actualizar el total con descuento aplicado
        actualizarTotal(totalCarrito);
    }

    function calcularTotalCarrito() {
        let totalCarrito = 0; // Inicializamos el total en 0

        carrito.forEach((producto, index) => {
        const descuento = parseFloat(descuentoAplicado) || 0;
        const precioSinDescuento = (parseFloat(producto.precio) * parseInt(producto.cantidad));
        const precioTotalProducto = precioSinDescuento * (1 - descuento / 100);
        totalCarrito += precioTotalProducto;
        });

        return parseInt(totalCarrito); // Devolvemos el total calculado
    }

    // Función para eliminar producto del carrito
    function eliminarProducto(index) {
        if (index >= 0 && index < carrito.length) {
            carrito.splice(index, 1);
            localStorage.setItem("carrito", JSON.stringify(carrito));
            renderizarCarrito(); // Volver a renderizar para reflejar cambios
        }
    }

    // Vaciar carrito
    if (vaciarBtn) {
        vaciarBtn.addEventListener("click", () => {
            localStorage.removeItem("carrito");
            carrito = [];
            renderizarCarrito();
        });
    }

    // Realizar pedido y enviarlo a la base de datos
    if (realizarPedidoBtn) {
        realizarPedidoBtn.addEventListener("click", async () => {
            if (carrito.length === 0) {
                alert("El carrito está vacío. Agrega productos antes de realizar el pedido.");
                return;
            }

            if (!token) {
                alert("Debes iniciar sesión para realizar un pedido.");
                window.location.href = "/login";
                return;
            }

            // Enviar solo productos con descuento si corresponde
            const totalConDescuento = calcularTotalCarrito();
            const productos = carrito.map(item => ({
                producto_id: Number(item.id),
                cantidad: item.cantidad,
                precio_unitario: item.precio.toFixed(2)
            }));

            try {
                const response = await fetch('/api/pedidos/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productos, // Enviar productos correctamente
                        total: totalConDescuento.toFixed(2) // Enviar total con descuento al backend
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Error al procesar el pedido.");
                }

                if (data.success) {
                    alert(`Pedido #${data.pedidoId} realizado con éxito!`);
                    localStorage.removeItem("carrito");
                    carrito = [];
                    renderizarCarrito();
                } else {
                    throw new Error(data.error || "Error al crear el pedido.");
                }
            } catch (error) {
                console.error("Error al crear el pedido:", error);
                alert(`Error al realizar el pedido: ${error.message}`);
            }
        });
    }

    // Renderizar productos al cargar la página
    renderizarCarrito();

});