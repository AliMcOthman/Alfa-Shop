import { useEffect, useState, type FormEvent } from "react";
import { useNavigate} from "react-router-dom";


type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string | null;
    imageUrl: string | null;
};

const API_URL = "http://127.0.0.1:3000";

const CATEGORIES = [
    "Computer",
    "Audio",
    "Zubehör",
    "Kamera",
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

    // Produkt, das gerade bearbeitet wird
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Produkte vom Backend laden
    async function loadProducts() {
        try {
            setProductsLoading(true);

            const response = await fetch(`${API_URL}/api/products`);

            if (!response.ok) {
                throw new Error("Produkte konnten nicht geladen werden.");
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

    // Produkte beim Öffnen der Admin-Seite laden
    useEffect(() => {
        if (!isAdmin) {
            navigate("/login", { replace: true });
            return;
        }

        loadProducts();
    }, [isAdmin, navigate]);

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
                throw new Error(data.message || "Produkt konnte nicht gelöscht werden.");
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
    // Neues Produkt speichern
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

            // Neues Produkt erstellen oder vorhandenes Produkt bearbeiten
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
                        imageUrl: imageUrl ?? editingProduct?.imageUrl ?? null,
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

            // Produktliste aktualisieren
            await loadProducts();

            // Formular zurücksetzen
            setName("");
            setDescription("");
            setPrice("");
            setStock("");
            setCategory("");
            setImage(null);

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
            <nav className="navbar navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <a
                        href="/"
                        className="navbar-brand fw-bold fs-3"
                    >
                        alfaShop
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
                                navigate("/login", { replace: true });
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

                        {/* Formular zum Hinzufügen */}
                        <section className="card border-0 shadow-sm">
                            <h2 className="h4 mb-0">
                                {editingProduct
                                    ? "Produkt bearbeiten"
                                    : "Neues Produkt hinzufügen"}
                            </h2>

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
                                                    file.size > 5 * 1024 * 1024
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

                                                    const fileInput = document.getElementById(
                                                        "productImage"
                                                    ) as HTMLInputElement | null;

                                                    if (fileInput) fileInput.value = "";
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
                                                            <span className="text-secondary">Kein Bild</span>
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
                                                                onClick={() => editProduct(item)}
                                                            >
                                                                Bearbeiten
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => deleteProduct(item.id)}
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
