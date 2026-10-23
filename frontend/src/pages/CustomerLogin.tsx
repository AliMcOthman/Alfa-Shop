import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

// Basis-URL des Backends festlegen
const API_URL = "http://127.0.0.1:3000";

// Datentyp für die Kundendaten definieren
type Customer = {
    id: number;
    name: string;
    email: string;
};

function CustomerLogin() {
    // Navigation zwischen den Seiten ermöglichen
    const navigate = useNavigate();

    // Zustände für E-Mail, Passwort, Ladeanzeige und Fehlermeldung
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Kundenanmeldung verarbeiten
    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        // Standardverhalten des Formulars verhindern
        event.preventDefault();

        // Alte Fehlermeldung löschen und Ladeanzeige aktivieren
        setError("");
        setLoading(true);

        try {
            // Anmeldedaten an das Backend senden
            const response = await fetch(`${API_URL}/api/customers/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            // Antwort des Backends als JSON lesen
            const data = await response.json();

            // Prüfen, ob die Anmeldung erfolgreich war
            if (!response.ok) {
                throw new Error(
                    data.message || "Anmeldung fehlgeschlagen."
                );
            }

            // Kundendaten aus der Serverantwort übernehmen
            const customer: Customer = data.customer;

            // Kundentoken und Kundendaten im Local Storage speichern
            localStorage.setItem("customerToken", data.token);
            localStorage.setItem("customer", JSON.stringify(customer));

            // Nach erfolgreicher Anmeldung zum Shop navigieren
            navigate("/");
        } catch (err) {
            // Fehlermeldung bei einem Fehler anzeigen
            setError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten."
            );
        } finally {
            // Ladeanzeige unabhängig vom Ergebnis beenden
            setLoading(false);
        }
    }

    return (
        // Hauptbereich der Login-Seite
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    {/* Karte für das Kunden-Login */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            {/* Überschrift und Beschreibung */}
                            <h1 className="h3 fw-bold text-center mb-2">
                                Kunden-Login
                            </h1>

                            <p className="text-secondary text-center mb-4">
                                Melde dich bei alfaShop an.
                            </p>

                            {/* Fehlermeldung anzeigen, falls vorhanden */}
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            {/* Anmeldeformular */}
                            <form onSubmit={handleLogin}>
                                {/* Eingabefeld für die E-Mail-Adresse */}
                                <div className="mb-3">
                                    <label
                                        htmlFor="email"
                                        className="form-label"
                                    >
                                        E-Mail-Adresse
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                {/* Eingabefeld für das Passwort */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="password"
                                        className="form-label"
                                    >
                                        Passwort
                                    </label>

                                    <input
                                        id="password"
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>

                                {/* Anmeldebutton mit Ladeanzeige */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Anmeldung läuft..."
                                        : "Anmelden"}
                                </button>
                            </form>

                            {/* Link zur Registrierung für neue Kunden */}
                            <p className="text-center mt-4 mb-2">
                                Noch kein Kundenkonto?
                            </p>

                            <div className="text-center">
                                <Link to="/register">
                                    Jetzt registrieren
                                </Link>
                            </div>

                            <hr />

                            {/* Link zurück zur Startseite des Shops */}
                            <div className="text-center">
                                <Link to="/" className="text-secondary">
                                    Zurück zum Shop
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Komponente für die Verwendung in anderen Dateien exportieren
export default CustomerLogin;
