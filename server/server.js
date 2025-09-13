require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectToDatabase = require("./utils/db")
const ordersRoutes = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow frontend dev server
});

const PORT = process.env.PORT || 3000;

async function main() {
    const db = await connectToDatabase();
    app.use("/orders", ordersRoutes(db));

    // MongoDB Change Stream for real-time updates
    const orders = db.collection(process.env.ORDERS_COLL);
    const changeStream = orders.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", (change) => {
        io.emit("order_update", change);
    });

    // WebSocket connection
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
    });

    server.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
}

main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});