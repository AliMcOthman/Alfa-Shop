import {useEffect, useRef, useState} from "react";

type HealthResponse = {
    status: string;
    message: string;
};

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

const API_URL = "http://127.0.0.1:3000";

const CATEGORIES = [
    "Computer",
    "Audio",
    "Zubehör",
    "Handy",
    "Kamera",
];

function Shop() {
    const [apiData, setApiData] =
        useState<HealthResponse | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("Alle Kategorien");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const cartRef = useRef<HTMLElement | null>(null);

    // Produkte und Backend-Status laden
    useEffect(() => {
        async function loadData() {
            try {
                const healthResponse = await fetch(
                    `${API_URL}/api/health`
                );

                if (!healthResponse.ok) {
                    throw new Error("Backend nicht erreichbar.");
                }

                const healthData: HealthResponse =
                    await healthResponse.json();

                setApiData(healthData);

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

                setProducts(productsData);
            } catch (err) {
                console.error(err);
                setError(
                    "Die Verbindung zum Backend ist fehlgeschlagen."
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
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
                        }
                        : item
                );
            }

            if (product.stock <= 0) {
                return currentCart;
            }

            return [
                ...currentCart,
                {...product, quantity: 1},
            ];
        });
    }

    // Produkt aus dem Warenkorb entfernen
    function removeFromCart(productId: number) {
        setCart((currentCart) =>
            currentCart.filter(
                (item) => item.id !== productId
            )
        );
    }

    // Produktmenge ändern
    function changeQuantity(
        productId: number,
        quantity: number
    ) {
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

    // Gesamtanzahl berechnen
    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Gesamtpreis berechnen
    const cartTotal = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    // Preis im deutschen Format anzeigen
    function formatPrice(price: number) {
        return price.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
        });
    }
    const isAdmin = false;
    return (
        <>
            {/* Navigation */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <a className="navbar-brand fw-bold fs-3" href="/">
                        alfaShop
                    </a>

                    <div className="d-flex align-items-center gap-2">
                        {isAdmin && (
                            <a
                                href="/admin"
                                className="btn btn-outline-light"
                            >
                                Verwaltung
                            </a>
                        )}

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

                {/* Backend-Status */}

                {/*<section className="mb-4">
                    {apiData && (
                        <div className="alert alert-success">
                            <strong>Backend:</strong>{" "}
                            {apiData.status} – {apiData.message}
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}
                </section>*/}
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


                    {/* Suchleiste und Kategorie nebeneinander */}
                    <div className="row g-3 align-items-end mb-4">

                        {/* Produktsuche */}
                        <div className="col-12 col-md-7 col-lg-8">
                            <label
                                htmlFor="productSearch"
                                className="form-label fw-semibold"
                            >
                                Produkte suchen
                            </label>

                            <div className="input-group input-group-lg">
                                 <span className="input-group-text bg-white">
                                        <i className="bi bi-search"></i> 🔍
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

                        {/* Kategorie auswählen */}
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
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>


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

                    {!loading && !error && products.length === 0 && (
                        <div className="alert alert-info">
                            Zurzeit sind keine Produkte verfügbar.
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        products.length > 0 &&
                        filteredProducts.length === 0 && (
                            <div className="alert alert-info">
                                Für diese Kategorie sind keine Produkte verfügbar.
                            </div>
                        )}

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
                                                style={{height: "220px"}}
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
                                                            Auf Lager: {product.stock}
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
                                                    onClick={() => addToCart(product)}
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
                        style={{scrollMarginTop: "24px"}}
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
                            {cart.length === 0 ? (
                                <p className="text-secondary mb-0">
                                    Dein Warenkorb ist leer.
                                </p>
                            ) : (
                                <>
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

                                    <div className="text-end mt-4">
                                        <p className="text-secondary mb-1">
                                            Gesamtanzahl: {cartCount}
                                        </p>
                                        <p className="h4 fw-bold">
                                            Gesamt: {formatPrice(cartTotal)}
                                        </p>
                                    </div>
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
                        © {new Date().getFullYear()} alfaShop –
                        Alle Rechte vorbehalten.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Shop;
