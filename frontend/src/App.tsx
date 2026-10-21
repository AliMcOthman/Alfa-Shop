import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shop from "./pages/Shop";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerLogin from "./pages/CustomerLogin";
import MeinKonto from "./pages/MeinKonto";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Shop />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/customer-login" element={<CustomerLogin />}/>
                <Route path="/mein-konto" element={<MeinKonto />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
