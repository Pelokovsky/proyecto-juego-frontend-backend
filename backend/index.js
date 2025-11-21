// =======================================================
// backend/index.js
// Servidor Express que carga variables de entorno para seguridad
// =======================================================

// 1. CARGAR VARIABLES DE ENTORNO (DEBE SER LA PRIMERA LÍNEA EJECUTABLE)
require('dotenv').config(); 

// 2. Importamos dependencias
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Score = require("./models/Score"); // Importa el modelo de datos

// 3. Configuración de Express y Puerto
const app = express();
const PORT = 3000;

// 4. Conexión a MongoDB
// Usa la variable de entorno MONGO_URI (cargada desde .env)
// Si MONGO_URI falla (muy improbable si .env existe), intenta conectarse localmente.
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/memorama'; 

mongoose.connect(dbURI)
    .then(() => console.log('Conexión a MongoDB Atlas exitosa.'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));

// 5. Middlewares
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(express.static("../frontend")); 

// 6. Rutas (Endpoints)
// ... (Tus rutas POST y GET para /api/scores siguen aquí)
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando correctamente 🚀. Conectado a la base de datos.");
});

// POST: Guardar un nuevo puntaje
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

// GET: Obtener el ranking de los mejores puntajes
app.get('/api/scores', async (req, res) => {
    try {
        const topScores = await Score.find()
            .sort({ score: -1, time_taken: 1 }) 
            .limit(10); 
        res.status(200).json(topScores);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al obtener el ranking.' });
    }
});


// 7. Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});