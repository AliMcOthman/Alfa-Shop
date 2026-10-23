import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    // Speichert den eingegebenen Benutzernamen.
    const [username, setUsername] = useState("");

    // Speichert das eingegebene Passwort.
    const [password, setPassword] = useState("");

    // Speichert eine Fehlermeldung bei einem fehlgeschlagenen Login.
    const [error, setError] = useState("");

    // Zeigt an, ob die Anmeldung gerade verarbeitet wird.
    const [loading, setLoading] = useState(false);

    // Ermöglicht die Navigation zu einer anderen Seite.
    const navigate = useNavigate();

    // Verarbeitet das Absenden des Login-Formulars.
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        // Verhindert das Neuladen der Seite.
        event.preventDefault();

        // Setzt die alte Fehlermeldung zurück.
        setError("");

        // Aktiviert den Ladezustand.
        setLoading(true);

        try {
            // Sendet die Login-Daten an das Backend.
            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/login",
                {
                    method: "POST",
                    headers: {
                        // Die Daten werden als JSON gesendet.
                        "Content-Type": "application/json",
                    },
                    // Wandelt Benutzername und Passwort in JSON um.
                    body: JSON.stringify({
                        username,
                        password,
                    }),
                }
            );

            // Liest die JSON-Antwort des Servers.
            const data = await response.json();

            // Prüft, ob die Anmeldung fehlgeschlagen ist.
            if (!response.ok) {
                setError(data.message || "Anmeldung fehlgeschlagen.");
                return;
            }

            // Speichert das JWT-Token im Local Storage.
            localStorage.setItem("token", data.token);

            // Speichert den Admin-Status im Local Storage.
            localStorage.setItem("isAdmin", "true");

            // Speichert den Benutzernamen des Admins.
            localStorage.setItem("adminUsername", data.username);

            // Leitet den Admin zum Verwaltungsbereich weiter.
            navigate("/admin");
        } catch {
            // Zeigt eine Meldung, wenn der Server nicht erreichbar ist.
            setError("Server nicht erreichbar. Bitte versuchen Sie es erneut.");
        } finally {
            // Beendet den Ladezustand auch bei einem Fehler.
            setLoading(false);
        }
    }

    return (
        <div className="container mt-5" style={{ maxWidth: "450px" }}>
            {/* Überschrift des Admin-Login-Formulars. */}
            <h2 className="text-center mb-4">Admin Login</h2>

            {/* Ruft handleSubmit beim Absenden des Formulars auf. */}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Benutzername
                    </label>

                    <input
                        id="username"
                        type="text"
                        className="form-control"
                        // Zeigt den aktuellen Zustand des Benutzernamens.
                        value={username}
                        // Aktualisiert den Zustand bei jeder Eingabe.
                        onChange={(event) => setUsername(event.target.value)}
                        // Das Feld muss ausgefüllt werden.
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        Passwort
                    </label>

                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        // Zeigt den aktuellen Zustand des Passworts.
                        value={password}
                        // Aktualisiert den Zustand bei jeder Eingabe.
                        onChange={(event) => setPassword(event.target.value)}
                        // Das Feld muss ausgefüllt werden.
                        required
                    />
                </div>

                {/* Zeigt die Fehlermeldung nur an, wenn sie vorhanden ist. */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    // Verhindert mehrfache Anfragen während des Ladens.
                    disabled={loading}
                >
                    {/* Ändert den Button-Text während der Anmeldung. */}
                    {loading ? "Bitte warten..." : "Anmelden"}
                </button>
            </form>
        </div>
    );
}

export default Login;
