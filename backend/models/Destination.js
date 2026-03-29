const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g. Nusa Penida, Bali
    country: { type: String, required: true }, // e.g. INDONESIA
    description: { type: String, required: true },
    image: { type: String, required: true },
    rating: { type: Number, default: 4.5 }
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);
