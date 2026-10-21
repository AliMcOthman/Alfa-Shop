import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string | null;
    imageUrl: string | null;
};

type OrderItem = {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number | string;
};

type Order = {
    id: number;
    customerName: string;
    customerEmail: string;
    street: string;
    postalCode: string;
    city: string;
    totalAmount: number | string;
    status: string;
    createdAt: string;
    OrderItems?: OrderItem[];
};

const API_URL = "http://127.0.0.1:3000";

const CATEGORIES = [
    "Computer",
    "Audio",
    "Zubehör",
    "Kamera",
    "Handy",
];

function Admin() {
    const navigate = useNavigate();
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    // Formular-Zustände
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("");
    const [image, setImage] = useState<File | null>(null);

    // Allgemeine Zustände
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Produktliste und Ladezustand
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    // Bestellungen und Ladezustand
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    // Produkt, das gerade bearbeitet wird
    const [editingProduct, setEditingProduct] =
        useState<Product | null>(null);

    // Produkte vom Backend laden
    async function loadProducts() {
        try {
            setProductsLoading(true);

            const response = await fetch(`${API_URL}/api/products`);

            if (!response.ok) {
                throw new Error(
                    "Produkte konnten nicht geladen werden."
                );
            }

            const data: Product[] = await response.json();

            setProducts(data);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Produkte konnten nicht geladen werden."
            );
        } finally {
            setProductsLoading(false);
        }
    }

    // Bestellungen vom Backend laden
    async function loadOrders() {
        setOrdersLoading(true);
        setOrdersError("");

        try {
            const response = await fetch(`${API_URL}/api/orders`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Bestellungen konnten nicht geladen werden."
                );
            }

            setOrders(data);
        } catch (err) {
            console.error(
                "Fehler beim Laden der Bestellungen:",
                err
            );

            setOrdersError(
                err instanceof Error
                    ? err.message
                    : "Ein unbekannter Fehler ist aufgetreten."
            );
        } finally {
            setOrdersLoading(false);
        }
    }

    // Inhalt in einem separaten Fenster drucken
    function printContent(elementId: string, title: string) {
        const content = document.getElementById(elementId);

        if (!content) {
            return;
        }

        const printWindow = window.open(
            "",
            "_blank",
            "width=900,height=700"
        );

        if (!printWindow) {
            alert(
                "Bitte erlauben Sie Pop-ups für den Druck."
            );
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${title}</title>

                <style>
                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        color: #222;
                        padding: 25px;
                        font-size: 14px;
                    }

                    h2 {
                        margin-bottom: 20px;
                        color: #172554;
                    }

                    h3 {
                        margin-top: 25px;
                        margin-bottom: 10px;
                    }

                    p {
                        line-height: 1.7;
                    }

                    .order-print {
                        padding: 20px;
                        margin-bottom: 25px;
                        border: 1px solid #ccc;
                        page-break-after: always;
                        break-after: page;
                    }

                    .order-print:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }

                    th,
                    td {
                        border: 1px solid #ccc;
                        padding: 10px;
                        text-align: left;
                        overflow-wrap: anywhere;
                    }

                    th {
                        background-color: #eee;
                    }

                    .total {
                        text-align: right;
                        margin-top: 20px;
                    }

                    @page {
                        margin: 15mm;
                    }

                    @media print {
                        body {
                            padding: 0;
                        }

                        .order-print {
                            break-inside: avoid;
                        }
                    }
                </style>
            </head>

            <body></body>
            </html>
        `);

        const clonedContent = content.cloneNode(true) as HTMLElement;

        // Das versteckte Element für den Druck sichtbar machen
        clonedContent.classList.remove("d-none");

        printWindow.document.body.appendChild(clonedContent);
        printWindow.document.title = title;

        // Druck erst starten, nachdem das Dokument geladen wurde
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };

        printWindow.document.close();
    }

    // Eine einzelne Bestellung drucken
    function printOrder(orderId: number) {
        printContent(
            `order-${orderId}`,
            `Bestellung ${orderId}`
        );
    }
    // Eine Bestellung löschen
    async function deleteOrder(orderId: number) {
        const confirmed = window.confirm(
            `Möchten Sie die Bestellung Nr. ${orderId} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
        );

        if (!confirmed) return;

        setOrdersError("");
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/orders/${orderId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Bestellung konnte nicht gelöscht werden."
                );
            }

            // Gelöschte Bestellung aus der Liste entfernen
            setOrders((previousOrders) =>
                previousOrders.filter((order) => order.id !== orderId)
            );

            setMessage(`Bestellung Nr. ${orderId} wurde gelöscht.`);
        } catch (err) {
            console.error(err);

            setOrdersError(
                err instanceof Error
                    ? err.message
                    : "Bestellung konnte nicht gelöscht werden."
            );
        }
    }


    async function updateOrderStatus(orderId: number, status: string) {
        try {
            const response = await fetch(
                `${API_URL}/api/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Bestellstatus konnte nicht aktualisiert werden."
                );
            }

            // Bestellungen in der Oberfläche aktualisieren
            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order.id === orderId
                        ? { ...order, status: data.order.status }
                        : order
                )
            );

            setMessage(`Bestellstatus von Bestellung Nr. ${orderId} wurde aktualisiert.`);
            setOrdersError("");
        } catch (error) {
            console.error(error);

            setOrdersError(
                error instanceof Error
                    ? error.message
                    : "Bestellstatus konnte nicht aktualisiert werden."
            );
        }
    }

    // Alle Bestellungen drucken
    function printAllOrders() {
        if (orders.length === 0) {
            alert(
                "Es gibt keine Bestellungen zum Drucken."
            );
            return;
        }

        printContent(
            "all-orders-print",
            "Alle Bestellungen"
        );
    }

    // Anmeldung des Administrators überprüfen
    useEffect(() => {
        if (!isAdmin) {
            navigate("/login", { replace: true });
        }
    }, [isAdmin, navigate]);

// Produkte und Bestellungen laden
    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const loadData = async () => {
            await Promise.all([
                loadProducts(),
                loadOrders()
            ]);
        };

        void loadData();
    }, [isAdmin]);

    // Produkt zum Bearbeiten auswählen
    function editProduct(product: Product) {
        setEditingProduct(product);

        setName(product.name);
        setDescription(product.description ?? "");
        setPrice(String(product.price));
        setStock(String(product.stock));
        setCategory(product.category ?? "");

        // Vorhandenes Bild bleibt erhalten
        setImage(null);

        setMessage("");
        setError("");

        // Zum Formular scrollen
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // Produkt löschen
    async function deleteProduct(id: number) {
        const confirmed = window.confirm(
            "Möchten Sie dieses Produkt wirklich löschen?"
        );

        if (!confirmed) return;

        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/products/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Produkt konnte nicht gelöscht werden."
                );
            }

            // Falls das bearbeitete Produkt gelöscht wird
            if (editingProduct?.id === id) {
                setEditingProduct(null);
                setName("");
                setDescription("");
                setPrice("");
                setStock("");
                setCategory("");
                setImage(null);
            }

            setMessage("Produkt erfolgreich gelöscht.");

            await loadProducts();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Produkt konnte nicht gelöscht werden."
            );
        }
    }

    // Neues Produkt speichern oder bearbeiten
    async function addProduct(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            let imageUrl: string | null = null;

            // Bild zuerst hochladen
            if (image) {
                const formData = new FormData();
                formData.append("image", image);

                const uploadResponse = await fetch(
                    `${API_URL}/api/upload`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: formData,
                    }
                );

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(
                        uploadData.message ||
                        "Bild konnte nicht hochgeladen werden."
                    );
                }

                imageUrl = uploadData.imageUrl;
            }

            // Produkt erstellen oder bearbeiten
            const token = localStorage.getItem("token");

            const productResponse = await fetch(
                editingProduct
                    ? `${API_URL}/api/products/${editingProduct.id}`
                    : `${API_URL}/api/products`,
                {
                    method: editingProduct ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim() || null,
                        price: Number(price),
                        stock: Number(stock),
                        category,
                        imageUrl:
                            imageUrl ??
                            editingProduct?.imageUrl ??
                            null,
                    }),
                }
            );

            const responseData = await productResponse.json();

            if (!productResponse.ok) {
                throw new Error(
                    responseData.message ||
                    "Produkt konnte nicht gespeichert werden."
                );
            }

            const newProduct: Product =
                responseData.product ?? responseData;

            setMessage(
                `Produkt „${newProduct.name}“ wurde erfolgreich gespeichert.`
            );

            await loadProducts();

            // Formular zurücksetzen
            setName("");
            setDescription("");
            setPrice("");
            setStock("");
            setCategory("");
            setImage(null);
            setEditingProduct(null);

            const fileInput = document.getElementById(
                "productImage"
            ) as HTMLInputElement | null;

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Ein Fehler ist aufgetreten."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Navigation */}
            <nav
                className="navbar shadow-sm py-2"
                style={{ backgroundColor: "#172554" }}
            >
                <div className="container">
                    <a
                        href="/"
                        className="navbar-brand d-flex align-items-center"
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
                    </a>

                    <div className="d-flex gap-2">
                        <a href="/" className="btn btn-light">
                            Zum Shop
                        </a>

                        <button
                            type="button"
                            className="btn btn-outline-light"
                            onClick={() => {
                                localStorage.removeItem("isAdmin");
                                localStorage.removeItem("adminUsername");
                                localStorage.removeItem("token");

                                navigate("/", {
                                    replace: true,
                                });
                            }}
                        >
                            Abmelden
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12">
                        {/* Seitentitel */}
                        <div className="mb-4">
                            <h1 className="fw-bold">
                                Produktverwaltung
                            </h1>

                            <p className="text-secondary">
                                Neue Produkte hinzufügen und vorhandene
                                Produkte verwalten.
                            </p>
                        </div>

                        {/* Erfolgsmeldung */}
                        {message && (
                            <div
                                className="alert alert-success"
                                role="status"
                            >
                                {message}
                            </div>
                        )}

                        {/* Fehlermeldung */}
                        {error && (
                            <div
                                className="alert alert-danger"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {/* Formular zum Hinzufügen und Bearbeiten */}
                        <section className="card border-0 shadow-sm">
                            <div className="card-header bg-white py-3">
                                <h2 className="h4 mb-0">
                                    {editingProduct
                                        ? "Produkt bearbeiten"
                                        : "Neues Produkt hinzufügen"}
                                </h2>
                            </div>

                            <div className="card-body p-4">
                                <form onSubmit={addProduct}>
                                    {/* Produktname */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="productName"
                                            className="form-label"
                                        >
                                            Produktname
                                        </label>

                                        <input
                                            id="productName"
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                            required
                                            maxLength={255}
                                        />
                                    </div>

                                    {/* Beschreibung */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="productDescription"
                                            className="form-label"
                                        >
                                            Beschreibung
                                        </label>

                                        <textarea
                                            id="productDescription"
                                            className="form-control"
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(
                                                    event.target.value
                                                )
                                            }
                                            rows={3}
                                        />
                                    </div>

                                    {/* Preis und Lagerbestand */}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label
                                                htmlFor="productPrice"
                                                className="form-label"
                                            >
                                                Preis in Euro
                                            </label>

                                            <input
                                                id="productPrice"
                                                type="number"
                                                className="form-control"
                                                value={price}
                                                onChange={(event) =>
                                                    setPrice(
                                                        event.target.value
                                                    )
                                                }
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label
                                                htmlFor="productStock"
                                                className="form-label"
                                            >
                                                Lagerbestand
                                            </label>

                                            <input
                                                id="productStock"
                                                type="number"
                                                className="form-control"
                                                value={stock}
                                                onChange={(event) =>
                                                    setStock(
                                                        event.target.value
                                                    )
                                                }
                                                min="0"
                                                step="1"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Kategorie auswählen */}
                                    <div className="mb-3">
                                        <label
                                            htmlFor="productCategory"
                                            className="form-label"
                                        >
                                            Kategorie
                                        </label>

                                        <select
                                            id="productCategory"
                                            className="form-select"
                                            value={category}
                                            onChange={(event) =>
                                                setCategory(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Kategorie auswählen
                                            </option>

                                            {CATEGORIES.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Produktbild auswählen */}
                                    <div className="mb-4">
                                        <label
                                            htmlFor="productImage"
                                            className="form-label"
                                        >
                                            Produktbild auswählen
                                        </label>

                                        <input
                                            id="productImage"
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;

                                                if (
                                                    file &&
                                                    file.size >
                                                    5 * 1024 * 1024
                                                ) {
                                                    setError(
                                                        "Das Bild darf maximal 5 MB groß sein."
                                                    );

                                                    event.target.value = "";
                                                    setImage(null);
                                                    return;
                                                }

                                                setError("");
                                                setImage(file);
                                            }}
                                        />

                                        <div className="form-text">
                                            Bilddatei auswählen, maximal 5 MB.
                                        </div>

                                        {image && (
                                            <p className="small text-secondary mt-2 mb-0">
                                                Ausgewählt: {image.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Speichern */}
                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-grow-1"
                                            disabled={loading}
                                        >
                                            {loading
                                                ? "Wird gespeichert..."
                                                : editingProduct
                                                    ? "Änderungen speichern"
                                                    : "Produkt speichern"}
                                        </button>

                                        {editingProduct && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                disabled={loading}
                                                onClick={() => {
                                                    setEditingProduct(null);
                                                    setName("");
                                                    setDescription("");
                                                    setPrice("");
                                                    setStock("");
                                                    setCategory("");
                                                    setImage(null);
                                                    setMessage("");
                                                    setError("");

                                                    const fileInput =
                                                        document.getElementById(
                                                            "productImage"
                                                        ) as HTMLInputElement | null;

                                                    if (fileInput) {
                                                        fileInput.value = "";
                                                    }
                                                }}
                                            >
                                                Abbrechen
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* Vorhandene Produkte anzeigen */}
                        <section className="card border-0 shadow-sm mt-4">
                            <div className="card-header bg-dark text-white py-3">
                                <h2 className="h4 mb-0">
                                    Vorhandene Produkte
                                </h2>
                            </div>

                            <div className="card-body">
                                {productsLoading ? (
                                    <p>Produkte werden geladen...</p>
                                ) : products.length === 0 ? (
                                    <p className="text-secondary mb-0">
                                        Es sind noch keine Produkte vorhanden.
                                    </p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover align-middle">
                                            <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Bild</th>
                                                <th>Produkt</th>
                                                <th>Kategorie</th>
                                                <th>Preis</th>
                                                <th>Lagerbestand</th>
                                                <th>Aktionen</th>
                                            </tr>
                                            </thead>

                                            <tbody>
                                            {products.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>

                                                    <td>
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={`${API_URL}${item.imageUrl}`}
                                                                alt={item.name}
                                                                style={{
                                                                    width: "70px",
                                                                    height: "70px",
                                                                    objectFit: "contain",
                                                                }}
                                                                className="rounded border bg-white p-1"
                                                            />
                                                        ) : (
                                                            <span className="text-secondary">
                                                                    Kein Bild
                                                                </span>
                                                        )}
                                                    </td>

                                                    <td>{item.name}</td>

                                                    <td>
                                                        {item.category || "-"}
                                                    </td>

                                                    <td>
                                                        {item.price.toLocaleString(
                                                            "de-DE",
                                                            {
                                                                style: "currency",
                                                                currency: "EUR",
                                                            }
                                                        )}
                                                    </td>

                                                    <td>{item.stock}</td>

                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() =>
                                                                    editProduct(item)
                                                                }
                                                            >
                                                                Bearbeiten
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() =>
                                                                    deleteProduct(item.id)
                                                                }
                                                            >
                                                                Löschen
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Bestellungen */}
                        <section   className="card-header py-3" style={{backgroundColor: "#1E3A5F", color: "#FFFFFF", borderBottom: "none"}}>
                            <div className="card-header bg-dark text-white py-3">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                                    <h2 className="h4 mb-0 d-flex align-items-center gap-2">
                                        Bestellungen
                                        <span className="badge rounded-pill bg-primary">
                                            {orders.length}
                                        </span>
                                    </h2>


                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={printAllOrders}
                                        disabled={
                                            ordersLoading ||
                                            orders.length === 0
                                        }
                                    >
                                        Alle Bestellungen drucken
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                {ordersLoading && (
                                    <p>
                                        Bestellungen werden geladen...
                                    </p>
                                )}

                                {ordersError && (
                                    <div className="alert alert-danger">
                                        {ordersError}
                                    </div>
                                )}

                                {!ordersLoading &&
                                    !ordersError &&
                                    orders.length === 0 && (
                                        <p className="text-secondary mb-0">
                                            Es gibt noch keine Bestellungen.
                                        </p>
                                    )}

                                {orders.length > 0 && (
                                    <div className="table-responsive bg-white rounded-3 shadow-sm border">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>Bestellnummer</th>
                                                <th>Kunde</th>
                                                <th>Adresse</th>
                                                <th>Produkte</th>
                                                <th>Gesamtpreis</th>
                                                <th style={{ minWidth: "190px" }}>Status</th>
                                                <th>Datum</th>
                                                <th>Aktionen</th>
                                            </tr>
                                            </thead>

                                            <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>{order.id}</td>

                                                    <td>
                                                        <strong>
                                                            {order.customerName}
                                                        </strong>
                                                        <br />
                                                        {order.customerEmail}
                                                    </td>

                                                    <td>
                                                        {order.street}
                                                        <br />
                                                        {order.postalCode}{" "}
                                                        {order.city}
                                                    </td>

                                                    <td>
                                                        {order.OrderItems?.map(
                                                            (item) => (
                                                                <div key={item.id}>
                                                                    {item.productName}{" "}
                                                                    × {item.quantity}
                                                                    {" — "}
                                                                    {(
                                                                        Number(item.price) *
                                                                        item.quantity
                                                                    ).toFixed(2)}{" "}
                                                                    €
                                                                </div>
                                                            )
                                                        )}
                                                    </td>

                                                    <td>
                                                        {Number(
                                                            order.totalAmount
                                                        ).toFixed(2)}{" "}
                                                        €
                                                    </td>


                                                    <td>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ minWidth: "175px" }}
                                                            value={order.status}
                                                            onChange={(e) =>
                                                                updateOrderStatus(order.id, e.target.value)
                                                            }
                                                        >
                                                            <option value="Neu">Neu</option>
                                                            <option value="In Bearbeitung">In Bearbeitung</option>
                                                            <option value="Versendet">Versendet</option>
                                                            <option value="Abgeschlossen">Abgeschlossen</option>
                                                            <option value="Storniert">Storniert</option>
                                                        </select>
                                                    </td>


                                                    <td>
                                                        {new Date(
                                                            order.createdAt
                                                        ).toLocaleString(
                                                            "de-DE"
                                                        )}
                                                    </td>

                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm"
                                                                style={{
                                                                    color: "#1E3A5F",
                                                                    border: "1px solid #93C5FD",
                                                                    backgroundColor: "#EFF6FF"
                                                                }}
                                                                onClick={() => printOrder(order.id)}
                                                            >
                                                                <i className="bi bi-printer me-1"></i>
                                                                Drucken
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-sm"
                                                                style={{
                                                                    color: "#B91C1C",
                                                                    border: "1px solid #FECACA",
                                                                    backgroundColor: "#FEF2F2"
                                                                }}
                                                                onClick={() => deleteOrder(order.id)}
                                                            >
                                                                <i className="bi bi-trash me-1"></i>
                                                                Löschen
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Versteckte Druckvorlagen */}
                        <div
                            id="all-orders-print"
                            className="d-none"
                        >
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    id={`order-${order.id}`}
                                    className="order-print"
                                >
                                    <h2>
                                        alfaShop – Bestellung Nr. {order.id}
                                    </h2>

                                    <p>
                                        <strong>Bestelldatum:</strong>{" "}
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleString("de-DE")}
                                    </p>

                                    <h3>Kundendaten</h3>

                                    <p>
                                        <strong>Name:</strong>{" "}
                                        {order.customerName}
                                        <br />

                                        <strong>E-Mail:</strong>{" "}
                                        {order.customerEmail}
                                        <br />

                                        <strong>Adresse:</strong>{" "}
                                        {order.street}
                                        <br />

                                        {order.postalCode} {order.city}
                                    </p>

                                    <h3>Bestellte Produkte</h3>

                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Produkt</th>
                                            <th>Menge</th>
                                            <th>Einzelpreis</th>
                                            <th>Gesamt</th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {order.OrderItems?.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.productName}</td>
                                                <td>{item.quantity}</td>
                                                <td>
                                                    {Number(
                                                        item.price
                                                    ).toFixed(2)}{" "}
                                                    €
                                                </td>
                                                <td>
                                                    {(
                                                        Number(item.price) *
                                                        item.quantity
                                                    ).toFixed(2)}{" "}
                                                    €
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>

                                    <h3 className="total">
                                        Gesamtbetrag:{" "}
                                        {Number(
                                            order.totalAmount
                                        ).toFixed(2)}{" "}
                                        €
                                    </h3>

                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {order.status}
                                    </p>

                                    <p>
                                        Vielen Dank für Ihre Bestellung bei
                                        alfaShop!
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-4 mt-5">
                <div className="container">
                    <p className="mb-0">
                        © {new Date().getFullYear()} alfaShop
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Admin;
