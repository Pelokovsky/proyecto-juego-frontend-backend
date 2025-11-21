// =======================================================
// backend/index.js
// Servidor Express para el Memorama con Base de Datos
// =======================================================

// Importamos dependencias
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); 
const Score = require("./models/Score"); // Importa el modelo de datos

// Configuración de Express y Puerto
const app = express();
const PORT = 3000;

// URL de conexión a MongoDB Atlas
// ¡IMPORTANTE! REEMPLAZA ESTA CADENA
const dbURI = 'mongodb+srv://test:test1234@omarg.gsv4w7b.mongodb.net/?appName=OmarG';
// Conexión a MongoDB
mongoose.connect(dbURI)
    .then(() => console.log('Conexión a MongoDB Atlas exitosa.'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));

// Middlewares
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(express.static("../frontend")); 

// --- Rutas (Endpoints) ---

// Ruta base de prueba
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando correctamente 🚀. Conectado a la base de datos.");
});

// 1. POST: Guardar un nuevo puntaje
app.post('/api/scores', async (req, res) => {
    try {
        const newScore = new Score(req.body); 
        await newScore.save();
        
        res.status(201).json({ message: 'Puntaje guardado exitosamente.', score: newScore });
    } catch (error) {
        res.status(400).json({ 
            error: 'No se pudo guardar el puntaje. Revisa los datos enviados.', 
            details: error.message 
        });
    }
});

// 2. GET: Obtener el ranking de los mejores puntajes
app.get('/api/scores', async (req, res) => {
    try {
        // Consulta: Ordena por score descendente y tiempo ascendente, limita a 10
        const topScores = await Score.find()
            .sort({ score: -1, time_taken: 1 }) 
            .limit(10); 
        
        res.status(200).json(topScores);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al obtener el ranking.' });
    }
});

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});