const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("stock.db");

db.run(`
CREATE TABLE IF NOT EXISTS materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE,
    cantidad INTEGER,
    unidad TEXT
)
`);

app.get("/materiales", (req, res) => {
    db.all("SELECT * FROM materiales", [], (err, rows) => {
        res.json(rows);
    });
});

app.post("/materiales", (req, res) => {
    const { nombre, cantidad, unidad } = req.body;

    db.run(
        "INSERT INTO materiales (nombre, cantidad, unidad) VALUES (?, ?, ?)",
        [nombre, cantidad, unidad],
        function (err) {
            if (err) return res.status(400).json({ error: "Ya existe" });
            res.json({ mensaje: "Material agregado" });
        }
    );
});

app.put("/comprar", (req, res) => {
    const { nombre, cantidad } = req.body;

    db.run(
        "UPDATE materiales SET cantidad = cantidad + ? WHERE nombre = ?",
        [cantidad, nombre],
        function () {
            if (this.changes === 0)
                return res.status(404).json({ error: "No encontrado" });

            res.json({ mensaje: "Compra registrada" });
        }
    );
});

app.put("/vender", (req, res) => {
    const { nombre, cantidad } = req.body;

    db.get(
        "SELECT cantidad FROM materiales WHERE nombre = ?",
        [nombre],
        (err, row) => {
            if (!row) return res.status(404).json({ error: "No encontrado" });

            if (row.cantidad < cantidad) {
                return res.status(400).json({ error: "Stock insuficiente" });
            }

            db.run(
                "UPDATE materiales SET cantidad = cantidad - ? WHERE nombre = ?",
                [cantidad, nombre],
                () => {
                    res.json({ mensaje: "Venta registrada" });
                }
            );
        }
    );
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));