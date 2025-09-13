import { useEffect, useState } from "react";
import { io } from "socket.io-client"; // use named import for clarity

function App() {
    const [orders, setOrders] = useState([]);
    const [form, setForm] = useState({ customer_name: "", product_name: "", status: "pending" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let socket;

        // create socket inside effect so we can clean it up properly
        socket = io("http://localhost:3000"); // backend URL

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

        // Listen for realtime updates
        socket.on("order_update", (change) => {
            console.log("Realtime update:", change);

            // normalize helper to compare ids as strings
            const idOf = (v) => (v == null ? "" : String(v._id ?? v));

            if (change.operationType === "insert") {
                // fullDocument is provided because backend uses updateLookup
                setOrders((prev) => [change.fullDocument, ...prev]);
            } else if (change.operationType === "update" || change.operationType === "replace") {
                // compare ids as strings because _id types may differ (ObjectId vs string)
                setOrders((prev) =>
                    prev.map((o) =>
                        idOf(o) === idOf(change.fullDocument) ? change.fullDocument : o
                    )
                );
            } else if (change.operationType === "delete") {
                // change.documentKey._id may be an object; compare as strings
                const deletedId = String(change.documentKey._id);
                setOrders((prev) =>
                    prev.filter((o) => String(o._id) !== deletedId)
                );
            }
        });

        return () => {
            socket.off("order_update");
            socket.disconnect(); // cleanup socket on unmount
        };
    }, []);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch("http://localhost:3000/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            setForm({ customer_name: "", product_name: "", status: "pending" });
        } catch (error) {
            console.error("Error creating order:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "#f59e0b";
            case "shipped": return "#3b82f6";
            case "delivered": return "#10b981";
            default: return "#6b7280";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return "⏳";
            case "shipped": return "🚚";
            case "delivered": return "✅";
            default: return "📦";
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>📦 Realtime Orders Dashboard</h1>
                <p style={styles.subtitle}>Track and manage orders in real-time</p>
            </div>

            <div style={styles.formCard}>
                <h2 style={styles.formTitle}>Create New Order</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <input
                            style={styles.input}
                            placeholder="Customer Name"
                            value={form.customer_name}
                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <input
                            style={styles.input}
                            placeholder="Product Name"
                            value={form.product_name}
                            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <select
                            style={styles.select}
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="pending">⏳ Pending</option>
                            <option value="shipped">🚚 Shipped</option>
                            <option value="delivered">✅ Delivered</option>
                        </select>
                    </div>
                    <button type="submit" style={styles.submitButton}>
                        ➕ Add Order
                    </button>
                </form>
            </div>

            <div style={styles.ordersSection}>
                <h2 style={styles.ordersTitle}>
                    Orders ({orders.length})
                    {isLoading && <span style={styles.loadingText}>Loading...</span>}
                </h2>

                {isLoading ? (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p>Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📦</div>
                        <h3>No orders yet</h3>
                        <p>Create your first order using the form above</p>
                    </div>
                ) : (
                    <div style={styles.ordersGrid}>
                        {orders.map((order) => (
                            <div key={String(order._id)} style={styles.orderCard}>
                                <div style={styles.orderHeader}>
                                    <h3 style={styles.customerName}>{order.customer_name}</h3>
                                    <div style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getStatusColor(order.status)
                                    }}>
                                        {getStatusIcon(order.status)} {order.status}
                                    </div>
                                </div>
                                <div style={styles.productInfo}>
                                    <span style={styles.productLabel}>Product:</span>
                                    <span style={styles.productName}>{order.product_name}</span>
                                </div>
                                <div style={styles.orderId}>
                                    {/* ensure _id is string before slicing */}
                                    ID: {String(order._id).slice(-8) || "N/A"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

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

export default App;
