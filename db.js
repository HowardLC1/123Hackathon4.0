const mongoose = require("mongoose")
const { config } = require("dotenv")
config()

const connectDB = async () => {
    try {
        const mongoUri = process.env.DB_URL || process.env.MONGO_URI
        const shouldAllowMemoryFallback =
            process.env.NODE_ENV !== 'production' &&
            String(process.env.ALLOW_IN_MEMORY_DB ?? 'true').toLowerCase() !== 'false'

        if (!mongoUri && !shouldAllowMemoryFallback) {
            throw new Error("Missing DB_URL (or legacy MONGO_URI) in environment")
        }

        const connectWithUri = async (uri) => {
            await mongoose.connect(uri, {
                autoIndex: false,
                serverSelectionTimeoutMS: 2500
            })
        }

        try {
            if (!mongoUri) {
                throw new Error("No mongo uri provided")
            }
            await connectWithUri(mongoUri)
        } catch (primaryError) {
            if (!shouldAllowMemoryFallback) throw primaryError

            const { MongoMemoryServer } = require('mongodb-memory-server')
            const mem = await MongoMemoryServer.create()
            const memUri = mem.getUri()
            await connectWithUri(memUri)

            console.log("⚠️ Using in-memory MongoDB for development")
        }

        console.log("Database connected successfully");
    } catch (error) {
        console.log("ERROR CONNECTING TO DATABASE", error);
        await mongoose.disconnect();
        process.exit(1);
    };
};

module.exports = connectDB