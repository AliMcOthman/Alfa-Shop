import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App";

// Sucht das HTML-Element mit der ID "root" und erstellt den React-Einstiegspunkt
createRoot(document.getElementById("root")!).render(
    // Aktiviert zusätzliche Prüfungen während der Entwicklung
    <StrictMode>
        {/* Rendert die Hauptkomponente der Anwendung */}
        <App />
    </StrictMode>
);