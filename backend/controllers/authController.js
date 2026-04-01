const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const password = (req.body.password || '').trim();

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }
        
        // Basic check for existing user
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists with this email" });
        }
        
        // Create user (plaintext password since no bcrypt required per simple specs)
        user = await User.create({ name, email, password });
        res.json({ message: "Registration successful", user: { id: user._id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = (req.body.password || '').trim();

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        
        // Match plaintext password
        if (!user || (user.password || '').trim() !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ message: "Login successful", user: { id: user._id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
