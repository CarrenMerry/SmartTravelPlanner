const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const Activity = require('../models/Activity');
const Transport = require('../models/Transport');

exports.addDestination = async (req, res) => {
    try {
        const dest = await Destination.create(req.body);
        res.json({ message: "Destination added successfully", data: dest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addHotel = async (req, res) => {
    try {
        const hotel = await Hotel.create(req.body);
        res.json({ message: "Hotel added successfully", data: hotel });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addActivity = async (req, res) => {
    try {
        const activity = await Activity.create(req.body);
        res.json({ message: "Activity added successfully", data: activity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addTransport = async (req, res) => {
    try {
        const transport = await Transport.create(req.body);
        res.json({ message: "Transport added successfully", data: transport });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
