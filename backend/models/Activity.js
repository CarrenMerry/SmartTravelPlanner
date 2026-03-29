const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ['adventure', 'relaxation', 'cultural'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
