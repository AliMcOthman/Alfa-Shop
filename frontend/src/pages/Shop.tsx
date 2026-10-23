import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

// Definiert die Datenstruktur eines Produkts.
type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string | null;
    imageUrl: string | null;
};

// Erweitert ein Produkt um die ausgewählte Menge im Warenkorb.
type CartItem = Product & {
    quantity: number;
};

// Definiert die mögliche Antwort des Backends nach einer Bestellung.
type OrderResponse = {
    message?: string;
};

// Definiert die Daten des angemeldeten Kunden.
type Customer = {
    id: number;
    name: string;
    email: string;
};

// Basis-URL des Backends.
const API_URL = "http://127.0.0.1:3000";

// Verfügbare Produktkategorien im Shop.
const CATEGORIES = [
    "Computer",
    "Audio",
    "Zubehör",
    "Handy",
    "Kamera",
];

function Shop() {
    // Speichert alle vom Backend geladenen Produkte.
    const [products, setProducts] = useState<Product[]>([]);

    // Speichert die ausgewählten Produkte im Warenkorb.
    const [cart, setCart] = useState<CartItem[]>([]);

    // Steuert, ob der Warenkorb angezeigt wird.
    const [showCart, setShowCart] = useState(false);

    // Speichert die aktuell ausgewählte Kategorie.
    const [selectedCategory, setSelectedCategory] =
        useState("Alle Kategorien");

    // Speichert den Suchbegriff für die Produktsuche.
    const [searchTerm, setSearchTerm] = useState("");

    // Speichert Fehler beim Laden der Produkte.
    const [error, setError] = useState("");

    // Zeigt an, ob die Produkte noch geladen werden.
    const [loading, setLoading] = useState(true);

    // Lädt den gespeicherten Kunden beim Initialisieren der Komponente.
    const [customer, setCustomer] = useState<Customer | null>(() => {
        // Liest die Kundendaten und das Token aus dem Local Storage.
        const savedCustomer = localStorage.getItem("customer");
        const customerToken = localStorage.getItem("customerToken");

        // Ohne gespeicherte Kundendaten oder Token ist kein Kunde angemeldet.
        if (!savedCustomer || !customerToken) {
            return null;
        }

        try {
            // Wandelt die gespeicherten JSON-Daten in ein Objekt um.
            const parsedCustomer: unknown = JSON.parse(savedCustomer);

            // Prüft die Struktur und die Datentypen der Kundendaten.
            if (
                typeof parsedCustomer === "object" &&
                parsedCustomer !== null &&
                "id" in parsedCustomer &&
                "name" in parsedCustomer &&
                "email" in parsedCustomer &&
                typeof parsedCustomer.id === "number" &&
                typeof parsedCustomer.name === "string" &&
                typeof parsedCustomer.email === "string"
            ) {
                // Gibt nur die benötigten Kundendaten zurück.
                return {
                    id: parsedCustomer.id,
                    name: parsedCustomer.name,
                    email: parsedCustomer.email,
                };
            }
        } catch {
            // Ungültige Kundendaten werden anschließend entfernt.
        }

        // Entfernt ungültige oder unvollständige Anmeldedaten.
        localStorage.removeItem("customer");
        localStorage.removeItem("customerToken");

        return null;
    });

    // Steuert das Absenden einer Bestellung.
    const [orderSubmitting, setOrderSubmitting] = useState(false);

    // Speichert die Erfolgsmeldung einer Bestellung.
    const [orderMessage, setOrderMessage] = useState("");

    // Speichert Fehlermeldungen bei einer Bestellung.
    const [orderError, setOrderError] = useState("");

    // Referenz auf den Warenkorb für das automatische Scrollen.
    const cartRef = useRef<HTMLElement | null>(null);

    // Lädt beim Öffnen des Shops den Backend-Status und die Produkte.
    useEffect(() => {
        // Verhindert Zustandsänderungen nach dem Verlassen der Komponente.
        let isActive = true;

        async function loadData() {
            try {
                // Aktiviert die Ladeanzeige und löscht alte Fehler.
                setLoading(true);
                setError("");

                // Prüft, ob das Backend erreichbar ist.
                const healthResponse = await fetch(
                    `${API_URL}/api/health`
                );

                if (!healthResponse.ok) {
                    throw new Error("Backend nicht erreichbar.");
                }

                // Fordert die Produktliste vom Backend an.
                const productsResponse = await fetch(
                    `${API_URL}/api/products`
                );

                if (!productsResponse.ok) {
                    throw new Error(
                        "Produkte konnten nicht geladen werden."
                    );
                }

                // Wandelt die JSON-Antwort in eine Produktliste um.
                const productsData: Product[] =
                    await productsResponse.json();

                // Aktualisiert den Zustand nur bei aktiver Komponente.
                if (isActive) {
                    setProducts(productsData);
                }
            } catch (err) {
                // Gibt technische Details in der Browser-Konsole aus.
                console.error(err);

                // Zeigt dem Benutzer eine verständliche Fehlermeldung.
                if (isActive) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Die Verbindung zum Backend ist fehlgeschlagen."
                    );
                }
            } finally {
                // Beendet die Ladeanzeige nur bei aktiver Komponente.
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        // Startet das Laden der Daten.
        void loadData();

        // Wird beim Verlassen der Komponente ausgeführt.
        return () => {
            isActive = false;
        };
    }, []);

    // Filtert Produkte nach Kategorie und Suchbegriff.
    const filteredProducts = products.filter((product) => {
        // Prüft, ob das Produkt zur ausgewählten Kategorie gehört.
        const matchesCategory =
            selectedCategory === "Alle Kategorien" ||
            product.category === selectedCategory;

        // Vergleicht den Suchbegriff mit dem Produktnamen.
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase());

        // Ein Produkt muss beide Bedingungen erfüllen.
        return matchesCategory && matchesSearch;
    });

    // Öffnet den Warenkorb und scrollt zu ihm.
    function openCart() {
        setShowCart(true);

        // Wartet kurz, bis der Warenkorb im DOM angezeigt wird.
        setTimeout(() => {
            cartRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    }

    // Fügt ein Produkt zum Warenkorb hinzu.
    function addToCart(product: Product) {
        // Entfernt vorherige Bestellmeldungen.
        setOrderMessage("");
        setOrderError("");

        // Produkte ohne Lagerbestand können nicht hinzugefügt werden.
        if (product.stock <= 0) {
            setOrderError("Dieses Produkt ist nicht auf Lager.");
            return;
        }

        // Aktualisiert den Warenkorb anhand des bisherigen Zustands.
        setCart((currentCart) => {
            // Prüft, ob das Produkt bereits im Warenkorb vorhanden ist.
            const existingItem = currentCart.find(
                (item) => item.id === product.id
            );

            if (existingItem) {
                // Verhindert, dass mehr als der verfügbare Bestand ausgewählt wird.
                if (existingItem.quantity >= product.stock) {
                    return currentCart;
                }

                // Erhöht die Menge des bereits vorhandenen Produkts.
                return currentCart.map((item) =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            stock: product.stock,
                        }
                        : item
                );
            }

            // Fügt ein neues Produkt mit der Menge eins hinzu.
            return [
                ...currentCart,
                {
                    ...product,
                    quantity: 1,
                },
            ];
        });
    }

    // Entfernt ein Produkt vollständig aus dem Warenkorb.
    function removeFromCart(productId: number) {
        setOrderMessage("");
        setOrderError("");

        // Behält alle Produkte außer dem ausgewählten Produkt.
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== productId)
        );
    }

    // Ändert die Menge eines Produkts im Warenkorb.
    function changeQuantity(productId: number, quantity: number) {
        setOrderMessage("");
        setOrderError("");

        // Begrenzt die Menge auf mindestens eins und höchstens den Lagerbestand.
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === productId
                    ? {
                        ...item,
                        quantity: Math.max(
                            1,
                            Math.min(quantity, item.stock)
                        ),
                    }
                    : item
            )
        );
    }

    // Sendet die Bestellung an das Backend.
    async function submitOrder(event: FormEvent<HTMLFormElement>) {
        // Verhindert das Neuladen der Seite.
        event.preventDefault();

        // Setzt vorherige Bestellmeldungen zurück.
        setOrderMessage("");
        setOrderError("");

        // Eine Bestellung ohne Produkte ist nicht erlaubt.
        if (cart.length === 0) {
            setOrderError("Dein Warenkorb ist leer.");
            return;
        }

        // Liest die eingegebenen Lieferdaten aus dem Formular.
        const form = event.currentTarget;
        const formData = new FormData(form);

        // Erstellt das Datenobjekt für die Bestellung.
        const orderData = {
            customerName: String(
                formData.get("customerName") ?? ""
            ).trim(),

            customerEmail: String(
                formData.get("customerEmail") ?? ""
            ).trim(),

            street: String(
                formData.get("street") ?? ""
            ).trim(),

            postalCode: String(
                formData.get("postalCode") ?? ""
            ).trim(),

            city: String(
                formData.get("city") ?? ""
            ).trim(),

            // Überträgt Produkt-IDs und Mengen an das Backend.
            items: cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            })),
        };

        // Aktiviert den Ladezustand für die Bestellung.
        setOrderSubmitting(true);

        try {
            // Liest das optionale Kunden-Token aus dem Local Storage.
            const customerToken = localStorage.getItem("customerToken");

            // Sendet die Bestellung an die Bestell-API.
            const response = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: {
                    // Kennzeichnet den Request als JSON.
                    "Content-Type": "application/json",

                    // Sendet das Token nur, wenn ein Kunde angemeldet ist.
                    ...(customerToken
                        ? { Authorization: `Bearer ${customerToken}` }
                        : {}),
                },
                // Wandelt die Bestelldaten in JSON um.
                body: JSON.stringify(orderData),
            });

            // Liest die Antwort des Backends.
            const responseData: OrderResponse =
                await response.json();

            // Behandelt Fehler beim Speichern der Bestellung.
            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    "Die Bestellung konnte nicht gespeichert werden."
                );
            }

            // Merkt sich die bestellten Mengen für die Bestandsaktualisierung.
            const orderedItems = [...cart];

            // Aktualisiert die angezeigten Lagerbestände im Shop.
            setProducts((currentProducts) =>
                currentProducts.map((product) => {
                    const orderedItem = orderedItems.find(
                        (item) => item.id === product.id
                    );

                    // Nicht bestellte Produkte bleiben unverändert.
                    if (!orderedItem) {
                        return product;
                    }

                    // Zieht die bestellte Menge vom angezeigten Bestand ab.
                    return {
                        ...product,
                        stock: Math.max(
                            0,
                            product.stock - orderedItem.quantity
                        ),
                    };
                })
            );

            // Leert den Warenkorb nach erfolgreicher Bestellung.
            setCart([]);

            // Zeigt die Erfolgsmeldung des Backends an.
            setOrderMessage(
                responseData.message ||
                "Bestellung erfolgreich gespeichert."
            );

            // Leert die Eingabefelder des Lieferformulars.
            form.reset();
        } catch (err) {
            // Gibt technische Details in der Browser-Konsole aus.
            console.error(
                "Fehler beim Absenden der Bestellung:",
                err
            );

            // Zeigt eine verständliche Fehlermeldung an.
            setOrderError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
            );
        } finally {
            // Beendet den Ladezustand nach dem Bestellversuch.
            setOrderSubmitting(false);
        }
    }

    // Meldet den Kunden ab.
    function logoutCustomer() {
        // Entfernt die lokal gespeicherten Anmeldedaten.
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customer");

        // Aktualisiert die Benutzeroberfläche.
        setCustomer(null);
    }

    // Berechnet die Gesamtmenge aller Produkte im Warenkorb.
    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Berechnet den Gesamtpreis aller Warenkorbpositionen.
    const cartTotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    // Formatiert Preise im deutschen Euro-Format.
    function formatPrice(price: number) {
        return price.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
        });
    }

    return (
        <>
            {/* Navigationsleiste des Shops. */}
            <nav className="navbar navbar-expand-lg shadow-sm shop-header">
                <div className="container">
                    {/* Logo führt zurück zur Shop-Seite. */}
                    <Link
                        className="navbar-brand d-flex align-items-center"
                        to="/"
                    >
                        <img
                            src="/AlfaShopLogo.png"
                            alt="Alfa-Shop"
                            style={{
                                height: "70px",
                                width: "auto",
                                objectFit: "contain",
                            }}
                        />
                    </Link>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        {/* Zeigt die Navigation für angemeldete Kunden. */}
                        {customer ? (
                            <>
                                <span className="text-white me-2">
                                    <i className="bi bi-person-circle me-1"></i>
                                    Hallo, <strong>{customer.name}</strong>
                                </span>

                                <Link
                                    to="/mein-konto"
                                    className="btn btn-light"
                                >
                                    <i className="bi bi-person me-1"></i>
                                    Mein Konto
                                </Link>

                                <button
                                    type="button"
                                    className="btn btn-outline-light"
                                    onClick={logoutCustomer}
                                >
                                    Abmelden
                                </button>
                            </>
                        ) : (
                            // Zeigt Login und Registrierung für Gäste.
                            <>
                                <Link
                                    to="/customer-login"
                                    className="btn btn-outline-light"
                                >
                                    Kunden-Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="btn btn-light"
                                >
                                    Registrieren
                                </Link>
                            </>
                        )}

                        {/* Öffnet die Anmeldung für Administratoren. */}
                        <Link
                            to="/login"
                            className="btn btn-outline-primary"
                        >
                            <i className="bi bi-person-lock me-1"></i>
                            Admin-Login
                        </Link>

                        {/* Zeigt den Warenkorb und die Produktanzahl an. */}
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={openCart}
                        >
                            🛒 Warenkorb
                            <span className="badge text-bg-danger ms-2">
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-5">
                {/* Begrüßungsbereich des Shops. */}
                <section className="text-center mb-5">
                    <h1 className="display-5 fw-bold">
                        Willkommen bei alfaShop!
                    </h1>

                    <p className="lead text-secondary">
                        Entdecke unsere Produkte zu attraktiven Preisen.
                    </p>
                </section>

                {/* Zeigt Fehler beim Laden der Produkte an. */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Bereich mit der Produktübersicht. */}
                <section>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <h2 className="fw-bold mb-0">
                            Unsere Produkte
                        </h2>

                        {/* Zeigt die Anzahl der gefilterten Produkte an. */}
                        <span className="badge text-bg-primary fs-6">
                            {filteredProducts.length} Produkte
                        </span>
                    </div>

                    {/* Suchfeld und Kategorieauswahl. */}
                    <div className="row g-3 align-items-end mb-4">
                        <div className="col-12 col-md-7 col-lg-8">
                            <label
                                htmlFor="productSearch"
                                className="form-label fw-semibold"
                            >
                                Produkte suchen
                            </label>

                            <div className="input-group input-group-lg">
                                <span className="input-group-text bg-white">
                                    🔍
                                </span>

                                <input
                                    id="productSearch"
                                    type="search"
                                    className="form-control"
                                    placeholder="Was suchst du heute?"
                                    value={searchTerm}
                                    // Aktualisiert den Suchbegriff bei jeder Eingabe.
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                />

                                {/* Bietet eine Schaltfläche zum Löschen der Suche. */}
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary ms-2 rounded"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        Löschen
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="col-12 col-md-5 col-lg-4">
                            <label
                                htmlFor="categoryFilter"
                                className="form-label fw-semibold"
                            >
                                Kategorie
                            </label>

                            <select
                                id="categoryFilter"
                                className="form-select form-select-lg"
                                value={selectedCategory}
                                // Aktualisiert die ausgewählte Kategorie.
                                onChange={(event) =>
                                    setSelectedCategory(event.target.value)
                                }
                            >
                                <option value="Alle Kategorien">
                                    Alle Kategorien
                                </option>

                                {/* Erstellt für jede Kategorie eine Option. */}
                                {CATEGORIES.map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Zeigt eine Ladeanimation während des Datenabrufs. */}
                    {loading && (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            />

                            <p className="mt-3">
                                Produkte werden geladen...
                            </p>
                        </div>
                    )}

                    {/* Meldung, wenn keine Produkte vorhanden sind. */}
                    {!loading && !error && products.length === 0 && (
                        <div className="alert alert-info">
                            Zurzeit sind keine Produkte verfügbar.
                        </div>
                    )}

                    {/* Meldung, wenn die Suche keine Treffer liefert. */}
                    {!loading &&
                        !error &&
                        products.length > 0 &&
                        filteredProducts.length === 0 && (
                            <div className="alert alert-info">
                                Für diese Suche oder Kategorie wurden keine
                                Produkte gefunden.
                            </div>
                        )}

                    {/* Zeigt die gefilterten Produkte als Karten an. */}
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                        {!loading &&
                            filteredProducts.map((product) => (
                                <div className="col" key={product.id}>
                                    <article className="card h-100 border-0 shadow-sm">
                                        {/* Zeigt das Produktbild oder einen Platzhalter. */}
                                        {product.imageUrl ? (
                                            <img
                                                src={`${API_URL}${product.imageUrl}`}
                                                className="card-img-top p-3"
                                                alt={product.name}
                                                style={{
                                                    height: "220px",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="d-flex align-items-center justify-content-center bg-light"
                                                style={{ height: "220px" }}
                                            >
                                                <span className="text-secondary">
                                                    Kein Bild verfügbar
                                                </span>
                                            </div>
                                        )}

                                        <div className="card-body d-flex flex-column">
                                            {/* Zeigt die Kategorie des Produkts an. */}
                                            {product.category && (
                                                <span className="badge text-bg-light border align-self-start mb-2">
                                                    {product.category}
                                                </span>
                                            )}

                                            <h5 className="card-title fw-bold">
                                                {product.name}
                                            </h5>

                                            {/* Zeigt die Beschreibung oder einen Ersatztext an. */}
                                            <p className="card-text text-secondary">
                                                {product.description ||
                                                    "Keine Beschreibung verfügbar."}
                                            </p>

                                            <div className="mt-auto">
                                                {/* Zeigt den Produktpreis an. */}
                                                <p className="fs-4 fw-bold text-primary mb-2">
                                                    {formatPrice(product.price)}
                                                </p>

                                                {/* Zeigt den aktuellen Lagerbestand an. */}
                                                <p className="small mb-0">
                                                    {product.stock > 0 ? (
                                                        <span className="text-success">
                                                            Auf Lager:{" "}
                                                            {product.stock}
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger">
                                                            Nicht auf Lager
                                                        </span>
                                                    )}
                                                </p>

                                                {/* Deaktiviert den Kauf bei leerem Lager. */}
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100 mt-3"
                                                    onClick={() =>
                                                        addToCart(product)
                                                    }
                                                    disabled={product.stock <= 0}
                                                >
                                                    {product.stock <= 0
                                                        ? "Nicht auf Lager"
                                                        : "In den Warenkorb"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            ))}
                    </div>
                </section>

                {/* Zeigt den Warenkorb nur nach dem Öffnen an. */}
                {showCart && (
                    <section
                        ref={cartRef}
                        className="card shadow-sm mt-5"
                        style={{ scrollMarginTop: "24px" }}
                    >
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h2 className="h4 mb-0">
                                Mein Warenkorb
                            </h2>

                            {/* Schließt den Warenkorb. */}
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setShowCart(false)}
                            >
                                Schließen
                            </button>
                        </div>

                        <div className="card-body">
                            {/* Zeigt die Erfolgsmeldung der Bestellung an. */}
                            {orderMessage && (
                                <div
                                    className="alert alert-success"
                                    role="alert"
                                >
                                    {orderMessage}
                                </div>
                            )}

                            {/* Zeigt einen Fehler bei der Bestellung an. */}
                            {orderError && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    {orderError}
                                </div>
                            )}

                            {/* Zeigt einen Hinweis bei leerem Warenkorb. */}
                            {cart.length === 0 ? (
                                <p className="text-secondary mb-0">
                                    Dein Warenkorb ist leer.
                                </p>
                            ) : (
                                <>
                                    {/* Durchläuft alle Warenkorbpositionen. */}
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-bottom py-3"
                                        >
                                            <div>
                                                <h3 className="h6 mb-1">
                                                    {item.name}
                                                </h3>

                                                <span className="text-secondary">
                                                    {formatPrice(item.price)}
                                                </span>
                                            </div>

                                            {/* Ermöglicht die Anpassung der Produktmenge. */}
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    disabled={item.quantity <= 1}
                                                    onClick={() =>
                                                        changeQuantity(
                                                            item.id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                >
                                                    −
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    disabled={
                                                        item.quantity >= item.stock
                                                    }
                                                    onClick={() =>
                                                        changeQuantity(
                                                            item.id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>

                                                {/* Entfernt das Produkt aus dem Warenkorb. */}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() =>
                                                        removeFromCart(item.id)
                                                    }
                                                >
                                                    Entfernen
                                                </button>
                                            </div>

                                            {/* Zeigt den Gesamtpreis dieser Position an. */}
                                            <strong>
                                                {formatPrice(
                                                    item.price * item.quantity
                                                )}
                                            </strong>
                                        </div>
                                    ))}

                                    {/* Zeigt die Gesamtmenge und den Gesamtpreis an. */}
                                    <div className="text-end mt-4">
                                        <p className="text-secondary mb-1">
                                            Gesamtanzahl: {cartCount}
                                        </p>

                                        <p className="h4 fw-bold">
                                            Gesamt: {formatPrice(cartTotal)}
                                        </p>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Formular für die Lieferdaten. */}
                                    <h3 className="h5 fw-bold mb-3">
                                        Lieferdaten
                                    </h3>

                                    <form onSubmit={submitOrder}>
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label
                                                    htmlFor="customerName"
                                                    className="form-label"
                                                >
                                                    Vollständiger Name
                                                </label>

                                                <input
                                                    id="customerName"
                                                    name="customerName"
                                                    type="text"
                                                    className="form-control"
                                                    autoComplete="name"
                                                    // Übernimmt den Namen des angemeldeten Kunden.
                                                    defaultValue={customer?.name ?? ""}
                                                    required
                                                />
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label
                                                    htmlFor="customerEmail"
                                                    className="form-label"
                                                >
                                                    E-Mail-Adresse
                                                </label>

                                                <input
                                                    id="customerEmail"
                                                    name="customerEmail"
                                                    type="email"
                                                    className="form-control"
                                                    autoComplete="email"
                                                    // Übernimmt die E-Mail des angemeldeten Kunden.
                                                    defaultValue={customer?.email ?? ""}
                                                    required
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label
                                                    htmlFor="street"
                                                    className="form-label"
                                                >
                                                    Straße und Hausnummer
                                                </label>

                                                <input
                                                    id="street"
                                                    name="street"
                                                    type="text"
                                                    className="form-control"
                                                    autoComplete="street-address"
                                                    required
                                                />
                                            </div>

                                            <div className="col-12 col-md-4">
                                                <label
                                                    htmlFor="postalCode"
                                                    className="form-label"
                                                >
                                                    Postleitzahl
                                                </label>

                                                <input
                                                    id="postalCode"
                                                    name="postalCode"
                                                    type="text"
                                                    className="form-control"
                                                    autoComplete="postal-code"
                                                    required
                                                />
                                            </div>

                                            <div className="col-12 col-md-8">
                                                <label
                                                    htmlFor="city"
                                                    className="form-label"
                                                >
                                                    Stadt
                                                </label>

                                                <input
                                                    id="city"
                                                    name="city"
                                                    type="text"
                                                    className="form-control"
                                                    autoComplete="address-level2"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Sendet die Bestellung nach Eingabe der Lieferdaten ab. */}
                                        <button
                                            type="submit"
                                            className="btn btn-success btn-lg w-100 mt-4"
                                            disabled={
                                                orderSubmitting ||
                                                cart.length === 0
                                            }
                                        >
                                            {orderSubmitting
                                                ? "Bestellung wird gespeichert..."
                                                : "Bestellung abschließen"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Fußzeile mit dem aktuellen Jahr. */}
            <footer className="bg-dark text-white text-center py-4 mt-5">
                <div className="container">
                    <p className="mb-0">
                        © {new Date().getFullYear()} alfaShop – Alle Rechte
                        vorbehalten.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Shop;
