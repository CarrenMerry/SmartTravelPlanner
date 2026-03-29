const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const Activity = require('../models/Activity');
const Transport = require('../models/Transport');

exports.getDestinations = async (req, res) => {
    try {
        let destinations = await Destination.find();
        
        // Auto-seed if database is empty to ensure UI has cinematic data
        if (destinations.length === 0) {
            const seedData = [
                {
                    country: "INDONESIA",
                    description: "Discover the emerald of the equator, endless pristine beaches, and vibrant cultural heritage spanning thousands of islands.",
                    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=2000",
                    name: "Nusa Penida, Bali",
                    rating: 4.9
                },
                {
                    country: "THAILAND",
                    description: "Experience the perfect blend of ancient temples, tropical beaches, and bustling night markets in the Land of Smiles.",
                    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000",
                    name: "Phi Phi Islands",
                    rating: 4.8
                },
                {
                    country: "MALDIVES",
                    description: "Relax in luxurious overwater bungalows surrounded by crystal clear turquoise waters and vibrant coral reefs.",
                    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=2000",
                    name: "Male Atoll",
                    rating: 5.0
                },
                {
                    country: "JAPAN",
                    description: "Immerse yourself in a world where cutting-edge technology seamlessly meets centuries-old ancient traditions.",
                    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=2000",
                    name: "Kyoto",
                    rating: 4.9
                }
            ];
            await Destination.insertMany(seedData);
            destinations = await Destination.find();
        }
        
        res.json(destinations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.generateTrip = async (req, res) => {
    try {
        const { destination, days, budget, preference } = req.body;
        
        const destDoc = await Destination.findOne({ name: { $regex: new RegExp(destination, 'i') } });
        if (!destDoc) {
            return res.status(404).json({ error: "Destination not found" });
        }
        
        const destId = destDoc._id;
        const totalBudget = parseFloat(budget);
        const daysNum = parseInt(days);
        
        const stayBudget = totalBudget * 0.4;
        const activitiesBudget = totalBudget * 0.3;
        const transportBudget = totalBudget * 0.3;
        
        const options = ['adventure', 'relaxation', 'cultural'];
        const results = [];
        
        for (const opt of options) {
            const hotel = await Hotel.findOne({ destination: destId });
            const activities = await Activity.find({ destination: destId, type: opt });
            const transport = await Transport.findOne({ destination: destId });
            
            const hotelCost = hotel ? hotel.price_per_day * daysNum : stayBudget * 0.8;
            const actCost = activities.reduce((sum, a) => sum + a.price, 0) || activitiesBudget * 0.8;
            const transCost = transport ? transport.price : transportBudget * 0.8;
            const totalCost = hotelCost + actCost + transCost;
            
            results.push({
                type: opt,
                hotel: hotel || { name: "Recommended Stay (TBD)", price_per_day: (hotelCost/daysNum).toFixed(2) },
                activities: activities.length > 0 ? activities : [{ name: `Guided ${opt} tour`, price: actCost.toFixed(2) }],
                transport: transport || { type: "Round-trip Flight", price: transCost.toFixed(2) },
                totalCost: totalCost.toFixed(2),
                recommended: opt === preference.toLowerCase()
            });
        }
        
        res.json({
            destination: destDoc,
            days: daysNum,
            budget: totalBudget,
            itineraries: results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
