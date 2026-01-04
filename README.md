# 🍣 SushiHouse

**SushiHouse** es una aplicación backend desarrollada con **Node.js**, **Express** y **MySQL** para la gestión de un restaurante de sushi. Permite manejar usuarios, productos, pedidos, descuentos y roles (cliente, empleado y administrador), utilizando autenticación segura con **JWT**.

---

## 🚀 Características

- 🧑‍🍳 Registro y login de usuarios
- 🔐 Autenticación con JWT
- 🔑 Roles de usuario: **cliente**, **empleado**, **admin**
- 🍱 Gestión de productos
- 📦 Gestión de pedidos
- 🎟️ Sistema de cupones y descuentos
- 🖼️ Subida de imágenes de perfil
- 🔒 Contraseñas encriptadas con bcrypt
- 📡 API REST protegida con middlewares

---

## 🛠️ Tecnologías utilizadas

- Node.js
- Express
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs
- multer
- cors

Lenguajes:
- JavaScript
- HTML
- CSS

---

## 📁 Estructura del proyecto

SushiHouse/
├── assets/
├── css/
├── web/
├── uploads/
├── scriipt/
├── dbConfig.js
├── server.js
├── package.json
└── package-lock.json

---

## ⚙️ Instalación y ejecución

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/Juan392/SushiHouse.git
cd SushiHouse
2️⃣ Instalar dependencias
npm install
3️⃣ Configurar la base de datos
Edita el archivo dbConfig.js con tus credenciales de MySQL:
host: 'localhost',
user: 'tu_usuario',
password: 'tu_contraseña',
database: 'sushihouse'
4️⃣ Ejecutar el servidor
npm start
El servidor se ejecutará en:
http://localhost:3000

```

---

### 📡 Endpoints principales
🔓 Rutas públicas
Método	Ruta	Descripción
GET	/	Página principal
GET	/login	Vista de login
GET	/register	Vista de registro
POST	/register	Registrar usuario
POST	/login	Iniciar sesión

🔐 Rutas protegidas (JWT)
👤 Usuario
Método	Ruta	Descripción
POST	/verify-token	Verifica token
GET	/get-profile-image	Obtener imagen de perfil
POST	/update-profile-image	Actualizar imagen
POST	/update-address	Actualizar dirección

📦 Pedidos
Método	Ruta	Rol requerido
POST	/api/pedidos/crear	Cliente
GET	/pedidos	Empleado
PUT	/empleado/pedidos/:id	Empleado

👨‍💼 Administrador
Método	Ruta	Descripción
POST	/api/admin/productos/agregar	Agregar producto
POST	/api/admin/empleados/agregar	Agregar empleado
POST	/api/admin/cupones/agregar	Crear cupón

🔒 Seguridad
Contraseñas encriptadas con bcrypt

Tokens JWT para autenticación

Middlewares para control de acceso por rol

🧠 Notas
Asegúrate de crear las tablas necesarias en MySQL antes de ejecutar el servidor.

Las rutas protegidas requieren enviar el token en el header:

makefile
Copiar código
Authorization: Bearer TU_TOKEN
👨‍💻 Contribuciones
Haz un fork del proyecto

Crea una nueva rama (git checkout -b feature/nueva)

Realiza tus cambios

Haz commit (git commit -m "Nueva funcionalidad")

Push a tu rama (git push origin feature/nueva)

Abre un Pull Request

📄 Licencia
Este proyecto no tiene una licencia especificada.
Por defecto utiliza la licencia ISC.

📌 Autor
Proyecto desarrollado por Juan392
GitHub: https://github.com/Juan392
