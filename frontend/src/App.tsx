import { BrowserRouter, Routes, Route } from "react-router-dom";

// Seiten des alfaShop-Projekts importieren
import Shop from "./pages/Shop";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerLogin from "./pages/CustomerLogin";
import MeinKonto from "./pages/MeinKonto";

// Hauptkomponente der Anwendung
function App() {
    return (
        // Aktiviert das Routing für die Navigation zwischen den Seiten
        <BrowserRouter>
            {/* Definiert alle verfügbaren Routen der Anwendung */}
            <Routes>
                {/* Startseite: Produktübersicht und Online-Shop */}
                <Route path="/" element={<Shop />} />

                {/* Adminbereich zur Verwaltung von Produkten und Bestellungen */}
                <Route path="/admin" element={<Admin />} />

                {/* Login-Seite für den Administrator */}
                <Route path="/login" element={<Login />} />

                {/* Registrierungsseite für neue Kunden */}
                <Route path="/register" element={<Register />} />

                {/* Login-Seite für registrierte Kunden */}
                <Route
                    path="/customer-login"
                    element={<CustomerLogin />}
                />

                {/* Mein-Konto-Seite für angemeldete Kunden */}
                <Route path="/mein-konto" element={<MeinKonto />} />
            </Routes>
        </BrowserRouter>
    );
}

// Macht die App-Komponente für andere Dateien verfügbar
export default App;
