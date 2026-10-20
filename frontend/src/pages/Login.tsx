import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:3000/api/admin/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Anmeldung fehlgeschlagen.");
                return;
            }

            // Admin-Status im Local Storage speichern
            localStorage.setItem("token", data.token);
            localStorage.setItem("isAdmin", "true");
            localStorage.setItem("adminUsername", data.username);

            navigate("/admin");
        } catch {
            setError("Server nicht erreichbar. Bitte versuchen Sie es erneut.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mt-5" style={{ maxWidth: "450px" }}>
            <h2 className="text-center mb-4">Admin Login</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Benutzername
                    </label>

                    <input
                        id="username"
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
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
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? "Bitte warten..." : "Anmelden"}
                </button>
            </form>
        </div>
    );
}

export default Login;
