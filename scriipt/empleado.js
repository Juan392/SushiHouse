document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const contenedorPedidos = document.querySelector("#contenedor-pedidos");

    if (!token) {
        alert("🔐 Debes iniciar sesión como empleado para acceder.");
        window.location.href = "/login";
        return;
    }

    try {
        // Verificación de empleado
        const permisoResponse = await fetch('/isEmployee', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!permisoResponse.ok) {
            throw new Error(permisoResponse.status === 403 
                ? "Acceso denegado: se requieren permisos de empleado" 
                : "Error al verificar credenciales");
        }

        // Carga de pedidos
        const pedidosResponse = await fetch("http://localhost:3000/pedidos", {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!pedidosResponse.ok) throw new Error("Error al cargar pedidos");

        const pedidosResponseJson = await pedidosResponse.json();
        console.log("Respuesta de la API:", pedidosResponseJson);

        // Extraer solo el array de datos
        const pedidos = pedidosResponseJson.data;

        if (!Array.isArray(pedidos)) {
        throw new Error("Formato de datos inválido");
        }


        // Renderizado
        contenedorPedidos.innerHTML = pedidos.length === 0 
            ? "<p>No hay pedidos pendientes</p>"
            : "";

        pedidos.forEach(pedido => {
            const section = document.createElement("section");
            section.classList.add("Cuadrados");
            const productos = pedido.productos.map(producto => producto.nombre).join(", ");
            // Formateo seguro de valores
            const estado = pedido.estado || "Pendiente";
            const total = typeof pedido.total === 'number' 
                ? pedido.total.toFixed(2) 
                : "0.00";
                console.log(pedido.direccion)
            section.innerHTML = `
                <p class="Letrasencuadrados">Estado: <b class="estado-actual">${estado}</b></p>
                <p class="Letrasencuadrados">Cliente ID: <b>${pedido.cliente_id}</b></p>
                <p class="Letrasencuadrados">Direccion: <b>${pedido.direccion}</b></p>
                <p class="Letrasencuadrados">Fecha: <b>${pedido.fecha_creacion}</b></p>
                <p class="Letrasencuadrados">Nombre Del Producto: <b>${productos}</b></p>
                
                <p class="Letrasencuadrados">Total: $${pedido.total}</p>
                <div class="acciones-pedido">
                    <select class="selector-estado" data-id="${pedido.id}">
                        <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="preparando" ${estado === 'preparando' ? 'selected' : ''}>Preparando</option>
                        <option value="entregado" ${estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                    </select>
                    <button class="botoncarro" data-id="${pedido.id}">
                        <p class="textoboton">Actualizar Estado</p>
                    </button>
                </div>
            `;

            // Evento para actualizar estado del pedido
            section.querySelector(".botoncarro").addEventListener("click", async () => {
                const selector = section.querySelector(".selector-estado");
                const nuevoEstado = selector.value;
                const pedidoId = selector.dataset.id;
                
                if (!confirm(`¿Cambiar estado del pedido a "${nuevoEstado}"?`)) return;
                
                try {
                    const response = await fetch(`http://localhost:3000/empleado/pedidos/${pedidoId}`, {
                        method: "PUT",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ estado: nuevoEstado })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || "Error al actualizar");
                    }

                    // Actualizar visualización sin recargar
                    const estadoElement = section.querySelector(".estado-actual");
                    estadoElement.textContent = nuevoEstado;
                    
                    // Cambiar color según estado
                    estadoElement.className = "estado-actual " + nuevoEstado;
                    
                    alert(`✅ Estado actualizado a "${nuevoEstado}"`);

                } catch (error) {
                    console.error("Error al actualizar:", error);
                    alert(`${error.message || "Error al actualizar el pedido"}`);
                }
            });

            contenedorPedidos.appendChild(section);
        });

    } catch (error) {
        console.error("Error:", error);
        contenedorPedidos.innerHTML = `
            <p class="error">${error.message || "Error al cargar pedidos"}</p>
        `;
        
        if (error.message.includes("token") || error.message.includes("401")) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    }
});