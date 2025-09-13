const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

module.exports = (db) => {
    const orders = db.collection(process.env.ORDERS_COLL);

    // Get all orders with optional pagination
    router.get("/", async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        try {
            const data = await orders
                .find()
                .skip((page - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .toArray();
            res.json(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ error: "Failed to fetch orders" });
        }
    });

    // Create a new order
    router.post("/", async (req, res) => {
        try {
            const doc = { ...req.body, updated_at: new Date() };
            const result = await orders.insertOne(doc);
            res.json({ insertedId: result.insertedId });
        } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).json({ error: "Failed to create order" });
        }
    });

    // Update an order
    router.put("/:id", async (req, res) => {
        try {
            const result = await orders.updateOne(
                { _id: new ObjectId(req.params.id) },
                { $set: { ...req.body, updated_at: new Date() } }
            );
            res.json(result);
        } catch (error) {
            console.error("Error updating order:", error);
            res.status(500).json({ error: "Failed to update order" });
        }
    });

    // Delete an order
    router.delete("/:id", async (req, res) => {
        try {
            const result = await orders.deleteOne({ _id: new ObjectId(req.params.id) });
            res.json(result);
        } catch (error) {
            console.error("Error deleting order:", error);
            res.status(500).json({ error: "Failed to delete order" });
        }
    });

    return router;
};