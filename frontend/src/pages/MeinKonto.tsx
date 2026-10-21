import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:3000";

type Customer = {
    id: number;
    name: string;
    email: string;
};

type OrderItem = {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    price: number | string;
};

type Order = {
    id: number;
    customerId: number | null;
    customerName: string;
    customerEmail: string;
    street: string;
    postalCode: string;
    city: string;
    totalAmount: number | string;
    status: string;
    createdAt: string;
    OrderItems: OrderItem[];
};

function MeinKonto() {
    const navigate = useNavigate();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCustomerOrders = async () => {
            const token = localStorage.getItem("customerToken");
            const savedCustomer = localStorage.getItem("customer");

            if (!token || !savedCustomer) {
                navigate("/customer-login");
                return;
            }

            try {
                const parsedCustomer: Customer = JSON.parse(savedCustomer);

                if (
                    !Number.isInteger(parsedCustomer.id) ||
                    typeof parsedCustomer.name !== "string" ||
                    typeof parsedCustomer.email !== "string"
                ) {
                    localStorage.removeItem("customer");
                    localStorage.removeItem("customerToken");
                    navigate("/customer-login");
                    return;
                }

                setCustomer(parsedCustomer);

                const response = await fetch(
                    `${API_URL}/api/customer/orders`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("customerToken");
                        localStorage.removeItem("customer");
                        navigate("/customer-login");
                        return;
                    }

                    throw new Error(
                        data.message || "Bestellungen konnten nicht geladen werden."
                    );
                }

                setOrders(data);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    localStorage.removeItem("customer");
                    localStorage.removeItem("customerToken");
                    navigate("/customer-login");
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Ein Fehler ist aufgetreten."
                );
            } finally {
                setLoading(false);
            }
        };

        loadCustomerOrders();
    }, [navigate]);

    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customer");
        navigate("/customer-login");
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("de-DE");
    };

    if (loading) {
        return (
            <main className="container py-5">
                <p>Bestellungen werden geladen...</p>
            </main>
        );
    }

    return (
        <main className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Mein Konto</h1>

                <button
                    className="btn btn-outline-danger"
                    onClick={logout}
                >
                    Abmelden
                </button>
            </div>

            {customer && (
                <section className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h2 className="h4">Meine Kundendaten</h2>
                        <p className="mb-1">
                            <strong>Name:</strong> {customer.name}
                        </p>
                        <p className="mb-0">
                            <strong>E-Mail:</strong> {customer.email}
                        </p>
                    </div>
                </section>
            )}

            <section>
                <h2 className="h3 mb-3">Meine Bestellungen</h2>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {!error && orders.length === 0 && (
                    <div className="alert alert-info">
                        Sie haben noch keine Bestellungen aufgegeben.
                        <div className="mt-3">
                            <Link to="/" className="btn btn-primary">
                                Zum Shop
                            </Link>
                        </div>
                    </div>
                )}

                {orders.map((order) => (
                    <article
                        key={order.id}
                        className="card shadow-sm mb-4"
                    >
                        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <strong>Bestellung #{order.id}</strong>

                            <span className="badge bg-primary">
                                {order.status}
                            </span>
                        </div>

                        <div className="card-body">
                            <p>
                                <strong>Datum:</strong>{" "}
                                {formatDate(order.createdAt)}
                            </p>

                            <p>
                                <strong>Gesamtbetrag:</strong>{" "}
                                {Number(order.totalAmount).toFixed(2)} €
                            </p>

                            <h3 className="h5 mt-3">
                                Bestellte Produkte
                            </h3>

                            {order.OrderItems?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                        <tr>
                                            <th>Produkt</th>
                                            <th>Menge</th>
                                            <th>Einzelpreis</th>
                                            <th>Zwischensumme</th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {order.OrderItems.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.productName}</td>
                                                <td>{item.quantity}</td>
                                                <td>
                                                    {Number(item.price).toFixed(2)} €
                                                </td>
                                                <td>
                                                    {(
                                                        Number(item.price) *
                                                        item.quantity
                                                    ).toFixed(2)} €
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>Keine Produktdetails verfügbar.</p>
                            )}

                            <h3 className="h5 mt-3">
                                Lieferadresse
                            </h3>

                            <p className="mb-0">
                                {order.street}<br />
                                {order.postalCode} {order.city}
                            </p>
                        </div>
                    </article>
                ))}
            </section>

            <Link to="/" className="btn btn-secondary mt-2">
                Zurück zum Shop
            </Link>
        </main>
    );
}

export default MeinKonto;
