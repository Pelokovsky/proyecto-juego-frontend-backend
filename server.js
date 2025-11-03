// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ruta correcta al frontend
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Ejemplo de API
app.get("/api/status", (req, res) => {
  res.json({ status: "Backend funcionando correctamente" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
