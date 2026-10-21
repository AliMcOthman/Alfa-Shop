import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:3000";

type Customer = {
    id: number;
    name: string;
    email: string;
};

function CustomerLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/customers/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Anmeldung fehlgeschlagen."
                );
            }

            const customer: Customer = data.customer;

            // Kundendaten und Token für dieses Projekt speichern
            localStorage.setItem("customerToken", data.token);
            localStorage.setItem("customer", JSON.stringify(customer));

            navigate("/");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            <h1 className="h3 fw-bold text-center mb-2">
                                Kunden-Login
                            </h1>

                            <p className="text-secondary text-center mb-4">
                                Melde dich bei alfaShop an.
                            </p>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLogin}>
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

                            <p className="text-center mt-4 mb-2">
                                Noch kein Kundenkonto?
                            </p>

                            <div className="text-center">
                                <Link to="/register">
                                    Jetzt registrieren
                                </Link>
                            </div>

                            <hr />

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

export default CustomerLogin;
