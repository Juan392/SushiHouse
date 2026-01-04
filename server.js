const express = require("express");
const mysql = require("mysql2/promise"); // Usar la versión con promesas
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const dbConfig = require("./dbConfig"); // Importar la configuración de la BD
const upload = multer({ dest: "uploads/" }); // Carpeta para imágenes
const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createPool(dbConfig);

// Verificar conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err.message);
    return;
  }
  console.log("✅ Conexión exitosa a la base de datos.");
  connection.release(); // Liberar conexión
});
// Servir archivos estáticos
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/web", express.static(path.join(__dirname, "web")));
app.use("/scriipt", express.static(path.join(__dirname, "scriipt")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas principales
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "web", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "web", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "web", "register.html")));
app.get("/perfil", (req, res) => res.sendFile(path.join(__dirname, "web", "perfil.html")));

// REGISTRO DE USUARIO
app.post("/register", async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
        await db.query(sql, [nombre, email, hash]);
        res.json({ message: "✅ Usuario registrado correctamente" });
    } catch (error) {
        console.error("❌ Error al registrar usuario:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// 🔐 LOGIN DE USUARIO
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    try {
        const sql = "SELECT * FROM usuarios WHERE email = ? LIMIT 1";
        const [result] = await db.query(sql, [email]);

        if (result.length === 0) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, rol: user.rol, nombre: user.nombre},
            "secreto",
        );

        res.json({ message: "✅ Login exitoso", token });
    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🛡️ Middleware para autenticar token JWT (Versión Corregida)
function authenticateToken(req, res, next) {
    // Versión case-insensitive para el header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    console.log('Headers recibidos:', req.headers);
    console.log('Header de autorización:', authHeader);

    if (!authHeader) {
        return res.status(401).json({ 
            error: "Token no proporcionado",
            details: "No se encontró el header Authorization"
        });
    }

    // Extraer el token correctamente (case insensitive)
    const token = authHeader.split(' ')[1];
if (!token) {
    return res.status(401).json({ 
        success: false,
        error: "Formato de token incorrecto",
        details: "El formato debe ser: Bearer <token>"
    });
}

console.log('Token extraído:', token);

jwt.verify(token, "secreto", (err, decoded) => {
    if (err) {
        console.error('Error al verificar token:', err);
        return res.status(403).json({ 
            success: false,
            error: "Token inválido",
            details: err.expiredAt ? "Token expirado" : "Token no válido"
        });
    }
    
    console.log('Token decodificado:', decoded);
    
    // Validación de la estructura del token
    if (!decoded.userId) {
        console.error('Token no contiene userId:', decoded);
        return res.status(403).json({
            success: false,
            error: "Token incompleto",
            details: "El token debe contener un userId"
        });
    }
    
    // Asignación correcta al request
    req.userId = decoded.userId;  // Asignación directa del userId
    req.user = decoded;         
    req.rol = decoded.rol
    console.log(`Usuario autenticado (ID: ${req.userId})`);
    console.log(`Usuario autenticado (ID: ${req.rol})`);
    next();
});
}

// Ruta verify-token optimizada
app.post("/verify-token", (req, res) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: "Formato de autorización inválido",
            solution: "Incluye el token como: Bearer <token>"
        });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, "secreto", (err, decoded) => {
        if (err) {
            console.error('Error en verify-token:', err);
            return res.status(401).json({
                error: "Token inválido",
                details: err.name === "TokenExpiredError" ? "Token expirado" : "Token malformado"
            });
        }

        res.json({
            success: true,
            user: {
                userId: decoded.userId,
                email: decoded.email,
                rol: decoded.rol,
                nombre: decoded.nombre
            }
        });
    });
});

// Middleware específico para admin
function isAdmin(req, res, next) {
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: "Acceso denegado",
            message: "Se requieren privilegios de administrador"
        });
    }
    next();
}


app.get('/isAdmin', authenticateToken, isAdmin, (req, res) => {
    res.json({ isAdmin: req.rol === 'admin' });
});

// Middleware para verificar si es empleado (no necesariamente admin)
function isEmployee(req, res, next) {
    if (req.user?.rol !== 'empleado') {
        return res.status(403).json({ 
            success: false,
            error: "Acceso denegado",
            message: "Se requieren privilegios de empleado" // Mensaje actualizado
        });
    }
    next();
}

// Ruta optimizada para el frontend
app.get('/isEmployee', authenticateToken, isEmployee, (req, res) => {
    res.json({ 
        isEmployee: true,  
        rol: req.user.rol  
    });
});

app.get('/isEmployee', authenticateToken, isEmployee, (req, res) => {
    res.json({ isAdmin: req.rol === 'empleado' });
});

// 📸 OBTENER FOTO DE PERFIL (GET en lugar de POST)
app.get("/get-profile-image", authenticateToken, async (req, res) => {
    try {
        const [usuario] = await db.query(
            "SELECT fotoPerfil FROM usuarios WHERE id = ?", 
            [req.user.userId]
        );
        
        res.json({ 
            fotoPerfil: usuario[0]?.fotoPerfil || "../assets/perfil.png"
        });
    } catch (error) {
        console.error("Error al obtener foto:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// 📍 OBTENER DIRECCIÓN (GET con parámetro en URL)
app.get("/get-user-address/:userId", authenticateToken, async (req, res) => {
    try {
        const [cliente] = await db.query(
            "SELECT direccion FROM clientes WHERE usuario_id = ?", 
            [req.params.userId]
        );
        
        res.json({ 
            direccion: cliente[0]?.direccion || "Dirección no proporcionada"
        });
    } catch (error) {
        console.error("Error al obtener dirección:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});
// 📸 ACTUALIZAR FOTO DE PERFIL
app.post("/update-profile-image", authenticateToken, upload.single("imagen"), async (req, res) => {
    try {
        const userId = req.user.userId;
        const imagenUrl = `/uploads/${req.file.filename}`;

        await db.query("UPDATE usuarios SET fotoPerfil = ? WHERE id = ?", [imagenUrl, userId]);
        res.json({ message: "✅ Imagen actualizada correctamente", fotoPerfil: imagenUrl });
    } catch (error) {
        console.error("❌ Error al actualizar la imagen:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 🏡 ACTUALIZAR DIRECCIÓN DEL USUARIO
app.post("/update-address", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { direccion } = req.body;

        if (!direccion || direccion.trim() === "") {
            return res.status(400).json({ message: "⚠️ La dirección no puede estar vacía" });
        }

        const [cliente] = await db.query("SELECT * FROM clientes WHERE usuario_id = ?", [userId]);
        if (cliente.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        await db.query("UPDATE clientes SET direccion = ? WHERE usuario_id = ?", [direccion, userId]);
        res.json({ message: "✅ Dirección actualizada correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar la dirección:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 🛒 OBTENER PRODUCTOS
app.get("/productos", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM productos");
        res.json(results);
    } catch (error) {
        console.error("❌ Error al obtener productos:", error);
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// Obtener pedidos
app.get("/pedidos", authenticateToken, isEmployee, async (req, res) => {
    try {
        // 1. Obtener todos los pedidos
        const [pedidos] = await db.query("SELECT * FROM pedidos");

        if (pedidos.length === 0) {
            return res.json({ success: true, data: [], count: 0 });
        }

        // 2. Obtener todos los clientes necesarios en una sola consulta
        const clienteIds = [...new Set(pedidos.map(p => p.cliente_id))]; // IDs únicos
        const [clientes] = await db.query(
            "SELECT usuario_id, direccion, telefono FROM clientes WHERE usuario_id IN (?)",
            [clienteIds]
        );

        // Crear mapa rápido de clientes
        const mapaClientes = clientes.reduce((map, cliente) => {
            map[cliente.usuario_id] = cliente;
            return map;
        }, {});

        // 3. Obtener todos los productos de los pedidos en una sola consulta
        const pedidoIds = pedidos.map(p => p.id);
        const [productos] = await db.query(
            "SELECT pedido_id, producto_id FROM detalles_pedido WHERE pedido_id IN (?)",
            [pedidoIds]
        );

        // Obtener los nombres de los productos
        const productoIds = [...new Set(productos.map(p => p.producto_id))];
        const [productosDetalles] = await db.query(
            "SELECT id, nombre FROM productos WHERE id IN (?)",
            [productoIds]
        );

        // Crear mapa de productos con nombres
        const mapaProductos = productosDetalles.reduce((map, producto) => {
            map[producto.id] = producto.nombre;
            return map;
        }, {});

        // Organizar los productos por pedido con nombres
        const productosPorPedido = productos.reduce((map, prod) => {
            if (!map[prod.pedido_id]) map[prod.pedido_id] = [];
            map[prod.pedido_id].push({
                id: prod.producto_id,
                nombre: mapaProductos[prod.producto_id] || 'Desconocido'
            });
            return map;
        }, {});

        // 4. Combinar los datos
        const pedidosConDatos = pedidos.map(pedido => {
            const cliente = mapaClientes[pedido.cliente_id] || {};
            return {
                ...pedido,
                direccion: cliente.direccion || 'Dirección no disponible',
                telefono: cliente.telefono || 'Sin teléfono',
                productos: productosPorPedido[pedido.id] || []
            };
        });

        res.json({
            success: true,
            data: pedidosConDatos,
            count: pedidosConDatos.length
        });
    } catch (error) {
        console.error("Error en /pedidos:", error);
        res.status(500).json({ success: false, message: "Error al obtener los pedidos" });
    }
});

// Actualizar estado del pedido
app.put('/empleado/pedidos/:id', authenticateToken, isEmployee, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const empleadoId = req.user.id; // ID del empleado desde el token

    try {
        // 1. Validar el estado recibido
        const estadosPermitidos = ['pendiente', 'preparando', 'entregado'];
        if (!estado || !estadosPermitidos.includes(estado.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Estado no válido. Use: ${estadosPermitidos.join(', ')}`,
                estados_permitidos: estadosPermitidos
            });
        }

        // 2. Verificar existencia del pedido
        const [pedidoExistente] = await db.query(
            'SELECT estado FROM pedidos WHERE id = ?', 
            [id]
        );

        if (pedidoExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Pedido con ID ${id} no encontrado`
            });
        }

        // 3. Validar transición de estado
        const estadoActual = pedidoExistente[0].estado;
        if (estadoActual === 'entregado') {
            return res.status(400).json({
                success: false,
                message: 'Pedidos entregados no pueden modificarse'
            });
        }

        // 4. Actualizar el pedido
        const [result] = await db.query(
            'UPDATE pedidos SET estado = ? WHERE id = ?',
            [estado, id]
        );

        // 5. Registrar en el historial
        try {
            await db.query(
                'INSERT INTO historial_pedidos (pedido_id, empleado_id, estado_anterior, estado_nuevo) VALUES (?, ?, ?, ?)',
                [id, empleadoId, estadoActual, estado]
            );
        } catch (historialError) {
            console.warn('No se pudo registrar en historial:', historialError.message);
        }

        // 6. Respuesta exitosa
        res.json({
            success: true,
            message: `Pedido ${id} actualizado de "${estadoActual}" a "${estado}"`,
            data: {
                pedido_id: id,
                estado_anterior: estadoActual,
                estado_nuevo: estado,
                empleado_id: empleadoId,
                fecha_actualizacion: new Date()
            }
        });

    } catch (error) {
        console.error('Error en PUT /empleado/pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar pedido',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Ruta para crear un pedido
app.post("/api/pedidos/crear", authenticateToken, async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    const { productos, total } = req.body; // Los productos vienen desde el cuerpo de la solicitud
    console.log("Productos recibidos:", productos);
    console.log(total)
    const userId = req.userId; // El usuario autenticado
    console.log("Usuario autenticado (ID):", userId);

    try {
        // Iniciar transacción
        await connection.beginTransaction();

        // 1️⃣ Obtener el cliente asociado al usuario
        const [cliente] = await connection.execute(
            `SELECT id FROM clientes WHERE usuario_id = ?`, 
            [userId]
        );

        if (!cliente.length) {
            return res.status(404).json({ mensaje: "Cliente no encontrado." });
        }

        const clienteId = cliente[0].id;

        // 2️⃣ Insertar el pedido en la tabla 'pedidos'
        const [result] = await connection.execute(
            `INSERT INTO pedidos (cliente_id, total, estado) VALUES (?, ?, 'pendiente')`,
            [clienteId, 0] // Inicialmente el total es 0
        );

        const pedidoId = result.insertId; // ID del pedido recién creado


        // 3️⃣ Insertar los productos en la tabla 'detalles_pedido'
        for (const item of productos) {
            const productoId = parseInt(item.producto_id); // Convierte a entero
            const cantidad = parseInt(item.cantidad) || 1;

            console.log(`Procesando productoId: ${productoId}, cantidad: ${cantidad}`);

            if (!productoId || isNaN(productoId)) {
                throw new Error("Producto ID no válido.");
            }

            // 4️⃣ Obtener el precio del producto desde la tabla 'productos'
            const [producto] = await connection.execute(
                `SELECT precio FROM productos WHERE id = ?`, 
                [productoId]
            );

            if (!producto.length) {
                throw new Error(`Producto con ID ${productoId} no encontrado.`);
            }

            const precio = parseFloat(producto[0].precio);
            const subtotal = precio * cantidad; // Calcular subtotal
            

            // 5️⃣ Insertar el detalle en la tabla 'detalles_pedido'
            console.log(`Insertando en detalles_pedido: pedidoId: ${pedidoId}, productoId: ${productoId}, cantidad: ${cantidad}, precio: ${precio}`);
            await connection.execute(
                `INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
                [pedidoId, productoId, cantidad, precio]
        
            );
        }

        // 6️⃣ Actualizar el total del pedido
        await connection.execute(
            `UPDATE pedidos SET total = ? WHERE id = ?`,
            [total, pedidoId]
        );

        // 7️⃣ Confirmar la transacción
        await connection.commit();
    res.status(201).json({
        success: true,
        mensaje: "✅ Pedido creado correctamente",
        pedidoId,
    });
    } catch (error) {
        // 🚨 Si hay error, revertir la transacción
        await connection.rollback();
        console.error("❌ Error al crear el pedido:", error);
        res.status(500).json({ mensaje: "❌ Error en el servidor" });
    } finally {
        // Cerrar conexión
        await connection.end();
    }
});

// ✅ Ruta para obtener descuentos
app.get('/api/descuentos', async (req, res) => {
    try {
        const [descuentos] = await db.execute('SELECT * FROM descuentos WHERE fecha_expiracion >= CURDATE()');
        res.json(descuentos);
    } catch (error) {
        console.error('❌ Error al obtener los descuentos:', error);
        res.status(500).json({ error: 'Error al obtener descuentos.' });
    }
});


// ✅ Ruta para agregar productos
app.post('/api/admin/productos/agregar', authenticateToken, isAdmin, async (req, res) => {
    const { nombre, descripcion, precio, categoria, imagen, stock} = req.body;

    if (!nombre || !descripcion || !precio || !categoria || !imagen || !stock) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        const query = `INSERT INTO productos (nombre, descripcion, precio, imagen,stock, categoria) VALUES (?, ?, ?, ?, ?,?)`;
        const [result] = await db.execute(query, [nombre, descripcion, precio, imagen, stock, categoria]);

        res.status(201).json({ message: '✅ Producto agregado exitosamente.', id: result.insertId });
    } catch (error) {
        console.error('❌ Error al agregar el producto:', error);
        res.status(500).json({ error: 'Error al agregar el producto.' });
    }
});

// ✅ Ruta para agregar empleados
app.post("/api/admin/empleados/agregar", authenticateToken, isAdmin, async (req, res) => {
    const { nombre, email, password, rol, puesto, sueldo } = req.body;

    // Verificación de campos obligatorios
    if (!nombre || !email || !password || !rol || !puesto || !sueldo) {
        return res.status(400).json({ error: "⚠️ Todos los campos son obligatorios." });
    }
    const sueldoEntero = parseInt(sueldo, 10);

    // Validar que el sueldo sea un número válido
    if (isNaN(sueldoEntero) || sueldoEntero <= 0) {
        return res.status(400).json({ error: "⚠️ El sueldo debe ser un número entero válido y mayor que 0." });
    }
    try {
        // Hash de la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🟢 Insertar usuario en la tabla usuarios
        const queryUsuario = `INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`;
        const [usuarioResult] = await db.execute(queryUsuario, [nombre, email, hashedPassword, rol]);

        // Obtener el ID del usuario recién insertado
        const usuario_id = usuarioResult.insertId;

        // 🟢 Insertar empleado en la tabla empleados con el puesto
        const queryEmpleado = `INSERT INTO empleados (usuario_id, puesto, salario) VALUES (?, ?, ?)`;
        await db.execute(queryEmpleado, [usuario_id, puesto, sueldoEntero]);

        // ✅ Respuesta exitosa
        res.status(201).json({
            message: "✅ Empleado agregado correctamente.",
            id: usuario_id
        });
    } catch (error) {
        console.error("❌ Error al agregar el empleado:", error);
        res.status(500).json({ error: "Error al agregar el empleado." });
    }
});

// ✅ Ruta para agregar cupones
app.post('/api/admin/cupones/agregar', authenticateToken, isAdmin, async (req, res) => {
    const { titulo, descripcion, imagen_url, fecha_expiracion, descuento } = req.body;
    console.log(req.body)

    if (!titulo || !descripcion || !imagen_url || !fecha_expiracion || !descuento) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        const query = `INSERT INTO descuentos (titulo, descripcion, imagen_url, fecha_expiracion, descuento) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(query, [titulo, descripcion, imagen_url, fecha_expiracion, descuento]);

        res.status(201).json({ message: '✅ Cupón agregado exitosamente.', id: result.insertId });
    } catch (error) {
        console.error('❌ Error al agregar el cupón:', error);
        res.status(500).json({ error: 'Error al agregar el cupón.' });
    }
});



// 🚀 INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("✅ Servidor corriendo en http://localhost:3000");
});
