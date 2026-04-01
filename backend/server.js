const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');

// Route files
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const isDocker = process.env.DOCKERIZED === 'true';

app.use(express.json());
app.use(cors());

// Basic test route
app.get('/test', (req, res) => {
    res.json({ message: "API working" });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.get('/api/debug/db-status', async (req, res) => {
    try {
        const { host, port, name, readyState } = mongoose.connection;
        const userCount = await User.countDocuments();
        const users = await User.find({}, { email: 1, name: 1, role: 1 }).lean();

        res.json({
            mongo: {
                host,
                port,
                name,
                readyState
            },
            users: {
                count: userCount,
                records: users
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Routes
app.use('/api', tripRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try {
        const dbConnected = await connectDB();
        if (!dbConnected) {
            console.error('MongoDB connection is required. Server will not start without a database connection.');
            process.exit(1);
        }

        const preferredPort = DEFAULT_PORT;
        if (isDocker) {
            app.listen(preferredPort, () => {
                console.log(`Server is running on port ${preferredPort}`);
            });
            return;
        }

        const candidatePorts = Array.from(
            new Set([preferredPort, preferredPort + 1, 5050, 5051, 5100, 5101])
        );

        const listenOnPort = (portIndex = 0) => {
            const port = candidatePorts[portIndex];
            if (typeof port === 'undefined') {
                console.error(
                    `Failed to bind server. Tried ports: ${candidatePorts.join(', ')}.`
                );
                process.exit(1);
            }

            const server = app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    const nextPort = candidatePorts[portIndex + 1];
                    if (typeof nextPort !== 'undefined') {
                        console.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
                        listenOnPort(portIndex + 1);
                        return;
                    }

                    console.error(
                        `Failed to bind server. All candidate ports are already in use: ${candidatePorts.join(', ')}.`
                    );
                    process.exit(1);
                    return;
                }

                console.error(`Failed to bind server on port ${port}:`, error.message);
                process.exit(1);
            });
        };

        listenOnPort();
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
};

startServer();
