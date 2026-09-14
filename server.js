const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// BASE DE DATOS
// ==========================================

const db = new sqlite3.Database("./ecolim.db", (err) => {

    if (err) {
        console.error("Error al conectar con SQLite:", err.message);
    } else {
        console.log("Base de datos ECOLIM conectada");
    }

});

// ==========================================
// CREAR TABLAS
// ==========================================

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            usuario TEXT NOT NULL UNIQUE,
            contrasena TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS residuos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            cantidad REAL NOT NULL,
            unidad TEXT NOT NULL,
            fecha TEXT NOT NULL,
            descripcion TEXT
        )
    `);

});

// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.json({
        mensaje: "API ECOLIM funcionando correctamente"
    });

});

// ==========================================
// REGISTRAR USUARIO
// ==========================================

app.post("/usuarios", (req, res) => {

    const {
        nombre,
        usuario,
        contrasena
    } = req.body;

    if (!nombre || !usuario || !contrasena) {

        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
        });

    }

    const sql = `
        INSERT INTO usuarios
        (nombre, usuario, contrasena)
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [nombre, usuario, contrasena],
        function(err) {

            if (err) {

                if (err.message.includes("UNIQUE")) {

                    return res.status(400).json({
                        mensaje: "El usuario ya existe"
                    });

                }

                return res.status(500).json({
                    mensaje: "Error al registrar usuario"
                });

            }

            res.json({
                mensaje: "Usuario registrado correctamente",
                id: this.lastID
            });

        }
    );

});

// ==========================================
// LOGIN
// ==========================================

app.post("/login", (req, res) => {

    const {
        usuario,
        contrasena
    } = req.body;

    const sql = `
        SELECT *
        FROM usuarios
        WHERE usuario = ?
        AND contrasena = ?
    `;

    db.get(
        sql,
        [usuario, contrasena],
        (err, row) => {

            if (err) {

                return res.status(500).json({
                    mensaje: "Error en el servidor"
                });

            }

            if (!row) {

                return res.status(401).json({
                    mensaje: "Usuario o contraseña incorrectos"
                });

            }

            res.json({
                mensaje: "Inicio de sesión correcto",
                usuario: row
            });

        }
    );

});

// ==========================================
// REGISTRAR RESIDUO
// ==========================================

app.post("/residuos", (req, res) => {

    const {
        tipo,
        cantidad,
        unidad,
        fecha,
        descripcion
    } = req.body;

    if (
        !tipo ||
        cantidad === undefined ||
        !unidad ||
        !fecha
    ) {

        return res.status(400).json({
            mensaje: "Faltan datos del residuo"
        });

    }

    const sql = `
        INSERT INTO residuos
        (tipo, cantidad, unidad, fecha, descripcion)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            tipo,
            cantidad,
            unidad,
            fecha,
            descripcion || ""
        ],
        function(err) {

            if (err) {

                return res.status(500).json({
                    mensaje: "Error al registrar residuo"
                });

            }

            res.json({
                mensaje: "Residuo registrado correctamente",
                id: this.lastID
            });

        }
    );

});

// ==========================================
// OBTENER RESIDUOS
// ==========================================

app.get("/residuos", (req, res) => {

    const sql = `
        SELECT *
        FROM residuos
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            return res.status(500).json({
                mensaje: "Error al obtener residuos"
            });

        }

        res.json(rows);

    });

});

// ==========================================
// ACTUALIZAR RESIDUO
// ==========================================

app.put("/residuos/:id", (req, res) => {

    const id = req.params.id;

    const {
        tipo,
        cantidad,
        unidad,
        fecha,
        descripcion
    } = req.body;

    const sql = `
        UPDATE residuos
        SET
            tipo = ?,
            cantidad = ?,
            unidad = ?,
            fecha = ?,
            descripcion = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            tipo,
            cantidad,
            unidad,
            fecha,
            descripcion || "",
            id
        ],
        function(err) {

            if (err) {

                return res.status(500).json({
                    mensaje: "Error al actualizar residuo"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    mensaje: "Residuo no encontrado"
                });

            }

            res.json({
                mensaje: "Residuo actualizado correctamente"
            });

        }
    );

});

// ==========================================
// ELIMINAR RESIDUO
// ==========================================

app.delete("/residuos/:id", (req, res) => {

    const id = req.params.id;

    db.run(
        "DELETE FROM residuos WHERE id = ?",
        [id],
        function(err) {

            if (err) {

                return res.status(500).json({
                    mensaje: "Error al eliminar residuo"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    mensaje: "Residuo no encontrado"
                });

            }

            res.json({
                mensaje: "Residuo eliminado correctamente"
            });

        }
    );

});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Servidor funcionando en el puerto ${PORT}`
    );

});