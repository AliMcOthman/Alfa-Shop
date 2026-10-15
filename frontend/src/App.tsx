import { useEffect, useState } from "react";

type HealthResponse = {
    status: string;
    message: string;
};

function App() {
    const [apiData, setApiData] = useState<HealthResponse | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function getApiData() {
            try {
                const response = await fetch(
                    "http://localhost:3000/api/health"
                );

                if (!response.ok) {
                    throw new Error("Server antwortet nicht.");
                }

                const data: HealthResponse = await response.json();
                setApiData(data);
            } catch {
                setError("Keine Verbindung zum Backend.");
            }
        }

        getApiData();
    }, []);

    return (
        <main
            style={{
                maxWidth: "800px",
                margin: "60px auto",
                padding: "24px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <h1>Willkommen bei alfaShop!</h1>

            <p>Unser Online-Shop entsteht gerade.</p>

            <h2>Backend-Verbindung</h2>

            {apiData && (
                <section>
                    <p>Status: ✅ {apiData.status}</p>
                    <p>{apiData.message}</p>
                </section>
            )}

            {!apiData && !error && <p>Verbinde mit Backend...</p>}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </main>
    );
}

export default App;