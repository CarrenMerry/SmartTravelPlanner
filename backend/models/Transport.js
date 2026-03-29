const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    type: { type: String, required: true }, // e.g., flight, train, bus
    price: { type: Number, required: true },
    contact: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);
