
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string | null;
    imageUrl: string | null;
};

type CartItem = Product & {
    quantity: number;
};

type OrderResponse = {
    message?: string;
};

type Customer = {
    id: number;
    name: string;
    email: string;
};

const API_URL = "http://127.0.0.1:3000";

const CATEGORIES = [
    "Computer",
    "Audio",
    "Zubehör",
    "Handy",
    "Kamera",
];

function Shop() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    const [showCart, setShowCart] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState("Alle Kategorien");
    const [searchTerm, setSearchTerm] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Gespeicherten Kunden beim Initialisieren laden
    const [customer, setCustomer] = useState<Customer | null>(() => {
        const savedCustomer = localStorage.getItem("customer");
        const customerToken = localStorage.getItem("customerToken");

        if (!savedCustomer || !customerToken) {
            return null;
        }

        try {
            const parsedCustomer: unknown = JSON.parse(savedCustomer);

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
                return {
                    id: parsedCustomer.id,
                    name: parsedCustomer.name,
                    email: parsedCustomer.email,
                };
            }
        } catch {
            // Ungültige Kundendaten werden entfernt.
        }

        localStorage.removeItem("customer");
        localStorage.removeItem("customerToken");

        return null;
    });

    // Zustand für das Absenden einer Bestellung
    const [orderSubmitting, setOrderSubmitting] = useState(false);
    const [orderMessage, setOrderMessage] = useState("");
    const [orderError, setOrderError] = useState("");

    const cartRef = useRef<HTMLElement | null>(null);

    // Produkte und Backend-Status laden
    useEffect(() => {
        let isActive = true;

        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const healthResponse = await fetch(
                    `${API_URL}/api/health`
                );

                if (!healthResponse.ok) {
                    throw new Error("Backend nicht erreichbar.");
                }

                const productsResponse = await fetch(
                    `${API_URL}/api/products`
                );

                if (!productsResponse.ok) {
                    throw new Error(
                        "Produkte konnten nicht geladen werden."
                    );
                }

                const productsData: Product[] =
                    await productsResponse.json();

                if (isActive) {
                    setProducts(productsData);
                }
            } catch (err) {
                console.error(err);

                if (isActive) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Die Verbindung zum Backend ist fehlgeschlagen."
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            isActive = false;
        };
    }, []);

    // Produkte nach Name und Kategorie filtern
    const filteredProducts = products.filter((product) => {
        const matchesCategory =
            selectedCategory === "Alle Kategorien" ||
            product.category === selectedCategory;

        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase());

        return matchesCategory && matchesSearch;
    });

    // Zum Warenkorb springen
    function openCart() {
        setShowCart(true);

        setTimeout(() => {
            cartRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    }

    // Produkt zum Warenkorb hinzufügen
    function addToCart(product: Product) {
        setOrderMessage("");
        setOrderError("");

        if (product.stock <= 0) {
            setOrderError("Dieses Produkt ist nicht auf Lager.");
            return;
        }

        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (item) => item.id === product.id
            );

            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    return currentCart;
                }

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

            return [
                ...currentCart,
                {
                    ...product,
                    quantity: 1,
                },
            ];
        });
    }

    // Produkt aus dem Warenkorb entfernen
    function removeFromCart(productId: number) {
        setOrderMessage("");
        setOrderError("");

        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== productId)
        );
    }

    // Produktmenge ändern
    function changeQuantity(productId: number, quantity: number) {
        setOrderMessage("");
        setOrderError("");

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

    // Bestellung an das Backend senden
    async function submitOrder(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setOrderMessage("");
        setOrderError("");

        if (cart.length === 0) {
            setOrderError("Dein Warenkorb ist leer.");
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);

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

            items: cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            })),
        };

        setOrderSubmitting(true);

        try {
            const customerToken = localStorage.getItem("customerToken");

            const response = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(customerToken
                        ? { Authorization: `Bearer ${customerToken}` }
                        : {}),
                },
                body: JSON.stringify(orderData),
            });

            const responseData: OrderResponse =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    "Die Bestellung konnte nicht gespeichert werden."
                );
            }

            // Bestellte Mengen für die Aktualisierung merken
            const orderedItems = [...cart];

            // Lagerbestand im Shop aktualisieren
            setProducts((currentProducts) =>
                currentProducts.map((product) => {
                    const orderedItem = orderedItems.find(
                        (item) => item.id === product.id
                    );

                    if (!orderedItem) {
                        return product;
                    }

                    return {
                        ...product,
                        stock: Math.max(
                            0,
                            product.stock - orderedItem.quantity
                        ),
                    };
                })
            );

            // Lagerbestand im Warenkorb ebenfalls aktualisieren
            setCart([]);

            setOrderMessage(
                responseData.message ||
                "Bestellung erfolgreich gespeichert."
            );

            form.reset();
        } catch (err) {
            console.error(
                "Fehler beim Absenden der Bestellung:",
                err
            );

            setOrderError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
            );
        } finally {
            setOrderSubmitting(false);
        }
    }

    // Kunden abmelden
    function logoutCustomer() {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customer");
        setCustomer(null);
    }

    // Gesamtanzahl der Produkte im Warenkorb berechnen
    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Gesamtpreis berechnen
    const cartTotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    // Preis im deutschen Format anzeigen
    function formatPrice(price: number) {
        return price.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
        });
    }

    return (
        <>
            {/* Navigation */}
            <nav className="navbar navbar-expand-lg shadow-sm shop-header">
                <div className="container">
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
                        {/* Kundenbereich */}
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

                        {/* Admin-Login */}
                        <Link
                            to="/login"
                            className="btn btn-outline-primary"
                        >
                            <i className="bi bi-person-lock me-1"></i>
                            Admin-Login
                        </Link>

                        {/* Warenkorb */}
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
                {/* Begrüßung */}
                <section className="text-center mb-5">
                    <h1 className="display-5 fw-bold">
                        Willkommen bei alfaShop!
                    </h1>

                    <p className="lead text-secondary">
                        Entdecke unsere Produkte zu attraktiven Preisen.
                    </p>
                </section>

                {/* Fehlermeldung */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Produktübersicht */}
                <section>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <h2 className="fw-bold mb-0">
                            Unsere Produkte
                        </h2>

                        <span className="badge text-bg-primary fs-6">
                            {filteredProducts.length} Produkte
                        </span>
                    </div>

                    {/* Suchleiste und Kategorie */}
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
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                />

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
                                onChange={(event) =>
                                    setSelectedCategory(event.target.value)
                                }
                            >
                                <option value="Alle Kategorien">
                                    Alle Kategorien
                                </option>

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

                    {/* Ladeanzeige */}
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

                    {/* Keine Produkte vorhanden */}
                    {!loading && !error && products.length === 0 && (
                        <div className="alert alert-info">
                            Zurzeit sind keine Produkte verfügbar.
                        </div>
                    )}

                    {/* Keine Suchergebnisse */}
                    {!loading &&
                        !error &&
                        products.length > 0 &&
                        filteredProducts.length === 0 && (
                            <div className="alert alert-info">
                                Für diese Suche oder Kategorie wurden keine
                                Produkte gefunden.
                            </div>
                        )}

                    {/* Produktkarten */}
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                        {!loading &&
                            filteredProducts.map((product) => (
                                <div className="col" key={product.id}>
                                    <article className="card h-100 border-0 shadow-sm">
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
                                            {product.category && (
                                                <span className="badge text-bg-light border align-self-start mb-2">
                                                    {product.category}
                                                </span>
                                            )}

                                            <h5 className="card-title fw-bold">
                                                {product.name}
                                            </h5>

                                            <p className="card-text text-secondary">
                                                {product.description ||
                                                    "Keine Beschreibung verfügbar."}
                                            </p>

                                            <div className="mt-auto">
                                                <p className="fs-4 fw-bold text-primary mb-2">
                                                    {formatPrice(product.price)}
                                                </p>

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

                {/* Warenkorb */}
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

                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setShowCart(false)}
                            >
                                Schließen
                            </button>
                        </div>

                        <div className="card-body">
                            {/* Erfolgsmeldung */}
                            {orderMessage && (
                                <div
                                    className="alert alert-success"
                                    role="alert"
                                >
                                    {orderMessage}
                                </div>
                            )}

                            {/* Fehlermeldung */}
                            {orderError && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    {orderError}
                                </div>
                            )}

                            {cart.length === 0 ? (
                                <p className="text-secondary mb-0">
                                    Dein Warenkorb ist leer.
                                </p>
                            ) : (
                                <>
                                    {/* Produkte im Warenkorb */}
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

                                            <strong>
                                                {formatPrice(
                                                    item.price * item.quantity
                                                )}
                                            </strong>
                                        </div>
                                    ))}

                                    {/* Gesamtbetrag */}
                                    <div className="text-end mt-4">
                                        <p className="text-secondary mb-1">
                                            Gesamtanzahl: {cartCount}
                                        </p>

                                        <p className="h4 fw-bold">
                                            Gesamt: {formatPrice(cartTotal)}
                                        </p>
                                    </div>

                                    <hr className="my-4" />

                                    {/* Lieferdaten */}
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

            {/* Fußzeile */}
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
