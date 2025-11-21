// backend/models/Score.js
const mongoose = require('mongoose');

// Definición del Esquema
const ScoreSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true 
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    time_taken: {
        type: Number,
        required: true,
        min: 0
    },
    level: {
        type: String,
        enum: ['Facil', 'Medio', 'Dificil'], 
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Creación y exportación del Modelo
const Score = mongoose.model('Score', ScoreSchema);
module.exports = Score;