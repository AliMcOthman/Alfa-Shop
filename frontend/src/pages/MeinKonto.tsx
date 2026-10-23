import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Basis-URL des Backends.
const API_URL = "http://127.0.0.1:3000";

// Definiert die Daten eines Kunden.
type Customer = {
    id: number;
    name: string;
    email: string;
};

// Definiert die Daten einer einzelnen Bestellposition.
type OrderItem = {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    price: number | string;
};

// Definiert die Daten einer Bestellung.
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
    // Ermöglicht die Navigation zu anderen Seiten.
    const navigate = useNavigate();

    // Speichert die Daten des angemeldeten Kunden.
    const [customer, setCustomer] = useState<Customer | null>(null);

    // Speichert alle Bestellungen des Kunden.
    const [orders, setOrders] = useState<Order[]>([]);

    // Zeigt an, ob die Bestellungen noch geladen werden.
    const [loading, setLoading] = useState(true);

    // Speichert Fehlermeldungen beim Laden der Daten.
    const [error, setError] = useState("");

    // Lädt die Kundendaten und Bestellungen beim Öffnen der Seite.
    useEffect(() => {
        const loadCustomerOrders = async () => {
            // Liest das Token und die gespeicherten Kundendaten aus.
            const token = localStorage.getItem("customerToken");
            const savedCustomer = localStorage.getItem("customer");

            // Ohne Anmeldung wird der Kunde zur Login-Seite weitergeleitet.
            if (!token || !savedCustomer) {
                navigate("/customer-login");
                return;
            }

            try {
                // Wandelt die gespeicherten JSON-Daten in ein Objekt um.
                const parsedCustomer: Customer = JSON.parse(savedCustomer);

                // Prüft, ob die wichtigsten Kundendaten gültig sind.
                if (
                    !Number.isInteger(parsedCustomer.id) ||
                    typeof parsedCustomer.name !== "string" ||
                    typeof parsedCustomer.email !== "string"
                ) {
                    // Entfernt ungültige Anmeldedaten.
                    localStorage.removeItem("customer");
                    localStorage.removeItem("customerToken");

                    // Leitet den Kunden zur Anmeldung weiter.
                    navigate("/customer-login");
                    return;
                }

                // Speichert die Kundendaten im React-Zustand.
                setCustomer(parsedCustomer);

                // Fordert die Bestellungen des angemeldeten Kunden an.
                const response = await fetch(
                    `${API_URL}/api/customer/orders`,
                    {
                        method: "GET",
                        headers: {
                            // Sendet das JWT-Token zur Authentifizierung.
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Liest die Antwort des Backends als JSON.
                const data = await response.json();

                // Prüft, ob die Anfrage erfolgreich war.
                if (!response.ok) {
                    // Bei einem ungültigen Token wird die Anmeldung beendet.
                    if (response.status === 401) {
                        localStorage.removeItem("customerToken");
                        localStorage.removeItem("customer");
                        navigate("/customer-login");
                        return;
                    }

                    // Gibt eine verständliche Fehlermeldung zurück.
                    throw new Error(
                        data.message ||
                            "Bestellungen konnten nicht geladen werden."
                    );
                }

                // Speichert die geladenen Bestellungen.
                setOrders(data);
            } catch (err) {
                // Behandelt ungültige JSON-Daten im Local Storage.
                if (err instanceof SyntaxError) {
                    localStorage.removeItem("customer");
                    localStorage.removeItem("customerToken");
                    navigate("/customer-login");
                    return;
                }

                // Speichert die Fehlermeldung für die Anzeige.
                setError(
                    err instanceof Error
                        ? err.message
                        : "Ein Fehler ist aufgetreten."
                );
            } finally {
                // Beendet den Ladezustand nach dem Vorgang.
                setLoading(false);
            }
        };

        // Startet das Laden der Kundendaten und Bestellungen.
        loadCustomerOrders();
    }, [navigate]);

    // Meldet den Kunden ab und entfernt seine gespeicherten Daten.
    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customer");
        navigate("/customer-login");
    };

    // Formatiert Datum und Uhrzeit nach deutschem Format.
    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("de-DE");
    };

    // Zeigt während des Ladens einen Hinweis an.
    if (loading) {
        return (
            <main className="container py-5">
                <p>Bestellungen werden geladen...</p>
            </main>
        );
    }

    return (
        <main className="container py-4">
            {/* Zeigt die Überschrift und den Abmelde-Button an. */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Mein Konto</h1>

                <button
                    className="btn btn-outline-danger"
                    onClick={logout}
                >
                    Abmelden
                </button>
            </div>

            {/* Zeigt die persönlichen Daten des Kunden an. */}
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

                {/* Zeigt eine Fehlermeldung an, falls das Laden fehlschlägt. */}
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {/* Zeigt einen Hinweis an, wenn noch keine Bestellungen existieren. */}
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

                {/* Durchläuft alle Bestellungen und zeigt sie einzeln an. */}
                {orders.map((order) => (
                    <article
                        key={order.id}
                        className="card shadow-sm mb-4"
                    >
                        {/* Zeigt die Bestellnummer und den aktuellen Status an. */}
                        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <strong>Bestellung #{order.id}</strong>

                            <span className="badge bg-primary">
                                {order.status}
                            </span>
                        </div>

                        <div className="card-body">
                            {/* Zeigt das Bestelldatum und den Gesamtbetrag an. */}
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

                            {/* Prüft, ob Produktdetails vorhanden sind. */}
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
                                            {/* Zeigt jede Bestellposition als Tabellenzeile an. */}
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
                                // Zeigt einen Hinweis an, wenn keine Details vorliegen.
                                <p>Keine Produktdetails verfügbar.</p>
                            )}

                            {/* Zeigt die Lieferadresse der Bestellung an. */}
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

            {/* Ermöglicht die Rückkehr zur Shop-Seite. */}
            <Link to="/" className="btn btn-secondary mt-2">
                Zurück zum Shop
            </Link>
        </main>
    );
}

export default MeinKonto;
