import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

// Basis-URL des Backends.
const API_URL = "http://127.0.0.1:3000";

function Register() {
    // Ermöglicht die Weiterleitung zu einer anderen Seite.
    const navigate = useNavigate();

    // Speichert den vollständigen Namen des Kunden.
    const [name, setName] = useState("");

    // Speichert die E-Mail-Adresse des Kunden.
    const [email, setEmail] = useState("");

    // Speichert das gewählte Passwort.
    const [password, setPassword] = useState("");

    // Speichert die Wiederholung des Passworts.
    const [confirmPassword, setConfirmPassword] = useState("");

    // Zeigt an, ob die Registrierung gerade verarbeitet wird.
    const [loading, setLoading] = useState(false);

    // Speichert Fehlermeldungen.
    const [error, setError] = useState("");

    // Speichert die Erfolgsmeldung nach der Registrierung.
    const [success, setSuccess] = useState("");

    // Verarbeitet das Absenden des Registrierungsformulars.
    async function handleRegister(event: FormEvent<HTMLFormElement>) {
        // Verhindert das Neuladen der Seite.
        event.preventDefault();

        // Setzt vorherige Meldungen zurück.
        setError("");
        setSuccess("");

        // Prüft, ob beide Passwörter übereinstimmen.
        if (password !== confirmPassword) {
            setError("Die Passwörter stimmen nicht überein.");
            return;
        }

        // Aktiviert den Ladezustand.
        setLoading(true);

        try {
            // Sendet die Registrierungsdaten an das Backend.
            const response = await fetch(
                `${API_URL}/api/customers/register`,
                {
                    method: "POST",
                    headers: {
                        // Die Daten werden im JSON-Format gesendet.
                        "Content-Type": "application/json",
                    },
                    // Wandelt die Kundendaten in JSON um.
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            // Liest die Antwort des Servers als JSON.
            const data = await response.json();

            // Prüft, ob die Registrierung fehlgeschlagen ist.
            if (!response.ok) {
                throw new Error(
                    data.message || "Registrierung fehlgeschlagen."
                );
            }

            // Zeigt die Erfolgsmeldung des Backends an.
            setSuccess(data.message);

            // Leert die Eingabefelder nach erfolgreicher Registrierung.
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            // Leitet den Kunden nach kurzer Wartezeit zur Anmeldung weiter.
            setTimeout(() => {
                navigate("/customer-login");
            }, 1200);
        } catch (err) {
            // Zeigt die Fehlermeldung an, falls ein Fehler auftritt.
            setError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten."
            );
        } finally {
            // Beendet den Ladezustand auch bei einem Fehler.
            setLoading(false);
        }
    }

    return (
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    {/* Karte für das Registrierungsformular. */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            <h1 className="h3 fw-bold text-center mb-2">
                                Kundenkonto erstellen
                            </h1>

                            <p className="text-secondary text-center mb-4">
                                Registriere dich bei alfaShop.
                            </p>

                            {/* Zeigt eine Fehlermeldung an, falls vorhanden. */}
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            {/* Zeigt eine Erfolgsmeldung an, falls vorhanden. */}
                            {success && (
                                <div className="alert alert-success">
                                    {success}
                                </div>
                            )}

                            {/* Verarbeitet das Absenden des Formulars. */}
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
                                        // Zeigt den aktuellen Namen an.
                                        value={name}
                                        // Aktualisiert den Namen bei jeder Eingabe.
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        // Unterstützt das automatische Ausfüllen des Namens.
                                        autoComplete="name"
                                        // Begrenzt die Eingabe auf 100 Zeichen.
                                        maxLength={100}
                                        // Das Feld muss ausgefüllt werden.
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
                                        // Zeigt die aktuelle E-Mail-Adresse an.
                                        value={email}
                                        // Aktualisiert die E-Mail-Adresse bei jeder Eingabe.
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        // Unterstützt das automatische Ausfüllen der E-Mail.
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
                                        // Zeigt das eingegebene Passwort nicht im Klartext an.
                                        value={password}
                                        // Aktualisiert das Passwort bei jeder Eingabe.
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        // Kennzeichnet das Feld als neues Passwort.
                                        autoComplete="new-password"
                                        // Verlangt mindestens acht Zeichen im Browser.
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
                                        // Zeigt das Bestätigungspasswort nicht im Klartext an.
                                        value={confirmPassword}
                                        // Aktualisiert die Passwortbestätigung.
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
                                    // Verhindert mehrere Registrierungsanfragen gleichzeitig.
                                    disabled={loading}
                                >
                                    {/* Ändert den Button-Text während der Registrierung. */}
                                    {loading
                                        ? "Konto wird erstellt..."
                                        : "Registrieren"}
                                </button>
                            </form>

                            {/* Bietet bestehenden Kunden einen Link zur Anmeldung. */}
                            <p className="text-center mt-4 mb-2">
                                Hast du bereits ein Konto?
                            </p>

                            <div className="text-center">
                                <Link to="/customer-login">
                                    Jetzt anmelden
                                </Link>
                            </div>

                            <hr />

                            {/* Ermöglicht die Rückkehr zum Shop. */}
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
