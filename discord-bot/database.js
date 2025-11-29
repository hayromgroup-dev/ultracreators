require("dotenv").config();
const mongoose = require('mongoose');

async function connectDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('❌ MONGODB_URI not found in .env file');
        }

        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(mongoUri, {
        });

        console.log('✅ Connected to MongoDB successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

        return mongoose.connection;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        console.error('📋 Make sure:');
        console.error('   1. MongoDB is running (local) or Atlas is accessible (cloud)');
        console.error('   2. MONGODB_URI is correct in .env file');
        console.error('   3. IP address is whitelisted (Atlas)');
        process.exit(1);
    }
}

module.exports = { connectDatabase };
