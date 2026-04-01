const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 10);
    const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 3000);

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            const conn = await mongoose.connect(mongoUri);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return true;
        } catch (error) {
            console.error(`Error connecting to MongoDB (attempt ${attempt}/${maxRetries}): ${error.message}`);

            if (attempt === maxRetries) {
                return false;
            }

            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
    }
};

module.exports = connectDB;
