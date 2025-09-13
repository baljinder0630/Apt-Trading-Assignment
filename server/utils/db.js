const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

let dbInstance;

async function connectToDatabase() {
    if (!dbInstance) {
        const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas");
        dbInstance = client.db(DB_NAME);
    }
    return dbInstance;
}

module.exports = connectToDatabase;