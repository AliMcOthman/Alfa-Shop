import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:3000";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleRegister(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Die Passwörter stimmen nicht überein.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/customers/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registrierung fehlgeschlagen."
                );
            }

            setSuccess(data.message);

            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            // Nach erfolgreicher Registrierung zur Anmeldung wechseln
            setTimeout(() => {
                navigate("/customer-login");
            }, 1200);
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
                                Kundenkonto erstellen
                            </h1>

                            <p className="text-secondary text-center mb-4">
                                Registriere dich bei alfaShop.
                            </p>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="name"
                                        className="form-label"
                                    >
                                        Vollständiger Name
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        autoComplete="name"
                                        maxLength={100}
                                        required
                                    />
                                </div>

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

                                <div className="mb-3">
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
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />

                                    <div className="form-text">
                                        Mindestens 8 Zeichen.
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="form-label"
                                    >
                                        Passwort bestätigen
                                    </label>

                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Konto wird erstellt..."
                                        : "Registrieren"}
                                </button>
                            </form>

                            <p className="text-center mt-4 mb-2">
                                Hast du bereits ein Konto?
                            </p>

                            <div className="text-center">
                                <Link to="/customer-login">
                                    Jetzt anmelden
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

export default Register;
