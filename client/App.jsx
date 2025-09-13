import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const App = () => {
    const [orders, setOrders] = useState([]);
    const [form, setForm] = useState({ customer_name: "", product_name: "", status: "pending" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const socket = io("http://localhost:3000");
        fetch("http://localhost:3000/orders")
            .then((res) => res.json())
            .then((data) => {
                setOrders(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching orders:", error);
                setIsLoading(false);
            });

        socket.on("order_update", (change) => {
            const idOf = (v) => (v == null ? "" : String(v._id ?? v));
            if (change.operationType === "insert") {
                setOrders((prev) => [change.fullDocument, ...prev]);
            } else if (change.operationType === "update" || change.operationType === "replace") {
                setOrders((prev) =>
                    prev.map((o) =>
                        idOf(o) === idOf(change.fullDocument) ? change.fullDocument : o
                    )
                );
            } else if (change.operationType === "delete") {
                const deletedId = String(change.documentKey._id);
                setOrders((prev) => prev.filter((o) => String(o._id) !== deletedId));
            }
        });

        return () => {
            socket.off("order_update");
            socket.disconnect();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch("http://localhost:3000/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setForm({ customer_name: "", product_name: "", status: "pending" });
        } catch (error) {
            console.error("Error creating order:", error);
        }
    };

    return (
        <div>
            <h1>Realtime Orders Dashboard</h1>
            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Customer Name"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    required
                />
                <input
                    placeholder="Product Name"
                    value={form.product_name}
                    onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                    required
                />
                <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                </select>
                <button type="submit">Add Order</button>
            </form>
            <div>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    orders.map((order) => (
                        <div key={order._id}>
                            <h3>{order.customer_name}</h3>
                            <p>{order.product_name}</p>
                            <p>{order.status}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default App;

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    },
    header: {
        textAlign: "center",
        marginBottom: "3rem",
        color: "white",
    },
    title: {
        fontSize: "3rem",
        fontWeight: "700",
        margin: "0 0 0.5rem 0",
        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
    subtitle: {
        fontSize: "1.2rem",
        opacity: 0.9,
        margin: 0,
        fontWeight: "300",
    },
    formCard: {
        background: "white",
        borderRadius: "16px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        margin: "0 auto 2rem auto",
    },
    formTitle: {
        fontSize: "1.5rem",
        fontWeight: "600",
        margin: "0 0 1.5rem 0",
        color: "#1f2937",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
    },
    input: {
        padding: "0.75rem 1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "1rem",
        transition: "all 0.2s ease",
        outline: "none",
    },
    select: {
        padding: "0.75rem 1rem",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "1rem",
        backgroundColor: "white",
        cursor: "pointer",
        outline: "none",
    },
    submitButton: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "none",
        padding: "0.875rem 1.5rem",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginTop: "0.5rem",
    },
    ordersSection: {
        maxWidth: "1200px",
        margin: "0 auto",
    },
    ordersTitle: {
        color: "white",
        fontSize: "2rem",
        fontWeight: "600",
        margin: "0 0 1.5rem 0",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
    },
    loadingText: {
        fontSize: "1rem",
        fontWeight: "400",
        opacity: 0.8,
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        color: "white",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(255,255,255,0.3)",
        borderTop: "4px solid white",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "1rem",
    },
    emptyState: {
        textAlign: "center",
        padding: "3rem",
        color: "white",
    },
    emptyIcon: {
        fontSize: "4rem",
        marginBottom: "1rem",
    },
    ordersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
    },
    orderCard: {
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        transition: "all 0.2s ease",
        border: "1px solid #e5e7eb",
    },
    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem",
    },
    customerName: {
        fontSize: "1.25rem",
        fontWeight: "600",
        margin: 0,
        color: "#1f2937",
    },
    statusBadge: {
        padding: "0.25rem 0.75rem",
        borderRadius: "20px",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "white",
        textTransform: "capitalize",
    },
    productInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        marginBottom: "0.75rem",
    },
    productLabel: {
        fontSize: "0.875rem",
        color: "#6b7280",
        fontWeight: "500",
    },
    productName: {
        fontSize: "1rem",
        color: "#374151",
        fontWeight: "500",
    },
    orderId: {
        fontSize: "0.75rem",
        color: "#9ca3af",
        fontFamily: "monospace",
    },
};
