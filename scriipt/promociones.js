function calcular() {
    const numeroUsuario = parseInt(document.getElementById('numeroUsuario').value);
    const resultado = document.getElementById('resultado');
    const mensaje = document.getElementById('mensaje');

    // Obtener la última marca de tiempo del intento
    const ultimoIntento = localStorage.getItem('ultimoIntento');
    const ahora = new Date().getTime();

    // Verificar si han pasado menos de 24 horas (86400000 ms)
    if (ultimoIntento && ahora - parseInt(ultimoIntento) < 86400000) {
        mensaje.textContent = 'Solo puedes intentarlo una vez cada 24 horas. Vuelve más tarde.';
        mensaje.style.color = 'red';
        resultado.classList.remove('hidden');
        return;
    }

    // Validar que el número esté entre 1 y 10
    if (isNaN(numeroUsuario) || numeroUsuario < 1 || numeroUsuario > 10) {
        mensaje.textContent = 'Por favor, ingresa un número válido entre 1 y 10.';
        mensaje.style.color = 'red';
        resultado.classList.remove('hidden');
        return;
    }

    // Generar un número aleatorio entre 1 y 10
    const numeroAleatorio = Math.floor(Math.random() * 10) + 1;

    if (numeroUsuario === numeroAleatorio) {
        mensaje.textContent = `¡Felicidades! Adivinaste el número ${numeroAleatorio}. Ganaste un descuento.`;
        mensaje.style.color = 'green';
    } else {
        mensaje.textContent = `Lo siento, el número era ${numeroAleatorio}. ¡Suerte para la próxima!`;
        mensaje.style.color = 'red';
    }

    resultado.classList.remove('hidden');

    // Guardar la marca de tiempo del intento en LocalStorage
    localStorage.setItem('ultimoIntento', ahora);

    // Limpiar el campo de entrada
    document.getElementById('numeroUsuario').value = '';
}

// Cerrar la ventana emergente al hacer clic fuera de ella
document.addEventListener('click', function (event) {
    const resultado = document.getElementById('resultado');
    if (!resultado.classList.contains('hidden') && !resultado.contains(event.target) && !document.getElementById('boton').contains(event.target)) {
        resultado.classList.add('hidden');
    }
});
// Obtener y mostrar descuentos desde la base de datos
async function cargarDescuentos() {
    try {
        const response = await fetch('/api/descuentos');
        if (!response.ok) {
            throw new Error('Error al obtener los descuentos.');
        }

        const descuentos = await response.json();
        const descuentosGrid = document.getElementById('descuentosGrid');
        descuentosGrid.innerHTML = ''; // Limpiar antes de insertar

        if (descuentos.length === 0) {
            descuentosGrid.innerHTML = '<p>⏳ No hay descuentos disponibles actualmente.</p>';
            return;
        }

        // Generar tarjetas de descuentos
        descuentos.forEach(descuento => {
            const section = document.createElement('section');
            section.classList.add('rectangulos');

            // Estructura del descuento
            section.innerHTML = `
                <img class="imagenesenrec" src="${descuento.imagen_url}" alt="${descuento.titulo}">
                <div class="texto-container">
                    <p class="textoenrec"><b>${descuento.titulo}</b></p>
                    <p class="parrafoenrec">${descuento.descripcion}</p>
                    <p class="parrafoenrec">Expira el ${new Date(descuento.fecha_expiracion).toLocaleDateString()}</p>
                </div>
                <button class="botonre" data-id="${descuento.id}" data-titulo="${descuento.titulo}" data-descuento="${descuento.descuento}">
                    🎁 Aplicar Descuento
                </button>
            `;

            // Aplicar descuento al hacer clic
            section.querySelector('.botonre').addEventListener('click', () => {
                const descuentoAplicado = parseFloat(descuento.descuento);
                aplicarDescuento(descuentoAplicado, descuento.titulo);
            });

            descuentosGrid.appendChild(section);
        });
    } catch (error) {
        console.error('❌ Error al cargar los descuentos:', error);
        descuentosGrid.innerHTML = '<p>⚠️ No se pudieron cargar los descuentos.</p>';
    }
}

// Aplicar descuento al total del carrito
function aplicarDescuento(descuento, titulo) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
        alert('No hay productos en el carrito para aplicar el descuento.');
        return;
    }

     // Verificar si ya se usó esta promoción
     let promocionesUsadas = JSON.parse(localStorage.getItem('promocionesUsadas')) || [];
     if (promocionesUsadas.includes(titulo)) {
         alert(`Ya has utilizado la promoción "${titulo}". Solo se puede usar una vez.`);
         return;
     }

    // Calcular el total del carrito antes del descuento
    let totalSinDescuento = carrito.reduce((acc, item) => {
        return acc + parseFloat(item.precio) * parseInt(item.cantidad);
    }, 0);

    // Calcular el descuento y el nuevo total
    const montoDescuento = totalSinDescuento * (descuento / 100);
    const totalConDescuento = totalSinDescuento - montoDescuento;
    // Guardar en localStorage para referencia
    localStorage.setItem('totalConDescuento', JSON.stringify({
        totalSinDescuento: totalSinDescuento.toFixed(2),
        descuentoAplicado: descuento,
        totalConDescuento: totalConDescuento.toFixed(2)
    }));

    // Registrar promoción como usada
    promocionesUsadas.push(titulo);
    localStorage.setItem('promocionesUsadas', JSON.stringify(promocionesUsadas));

    alert(`✅ Descuento del ${descuento}% aplicado correctamente.\n🛒 Total anterior: $${totalSinDescuento.toFixed(2)}\n💸 Nuevo total: $${totalConDescuento.toFixed(2)}`);

    //  Actualizar la vista del carrito
    actualizarCarritoEnVista();

    
}

// Actualizar la vista del carrito después de aplicar el descuento
function actualizarCarritoEnVista() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalElement = document.getElementById('totalCarrito');
    const descuentoElement = document.getElementById('descuentoAplicado');

    if (carrito.length === 0) {
        totalElement.textContent = '🛑 Carrito vacío';
        if (descuentoElement) {
            descuentoElement.textContent = '';
        }
        return;
    }

    // 🧾 Recuperar valores del descuento si existe
    const descuentoData = JSON.parse(localStorage.getItem('totalConDescuento')) || {};
    const totalSinDescuento = parseFloat(descuentoData.totalSinDescuento) || 0;
    const descuentoAplicado = parseFloat(descuentoData.descuentoAplicado) || 0;
    const totalConDescuento = parseFloat(descuentoData.totalConDescuento) || totalSinDescuento;

    //  Actualizar el total en el DOM
    if (totalElement) {
        if (descuentoAplicado > 0) {
            totalElement.innerHTML = `
                💲 Total Original: <s>$${totalSinDescuento.toFixed(2)}</s><br>
                🎁 Descuento aplicado: ${descuentoAplicado}% (-$${(totalSinDescuento - totalConDescuento).toFixed(2)})<br>
                🛒 Nuevo Total: <b>$${totalConDescuento.toFixed(2)}</b>
            `;
        } else {
            totalElement.innerHTML = `🛒 Total: $${totalSinDescuento.toFixed(2)}`;
        }
    }
}

// 🕐 Cargar descuentos al cargar la página
document.addEventListener('DOMContentLoaded', cargarDescuentos);
