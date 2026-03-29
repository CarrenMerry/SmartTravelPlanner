const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    name: { type: String, required: true },
    price_per_day: { type: Number, required: true },
    type: { type: String, enum: ['budget', 'standard', 'luxury'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
