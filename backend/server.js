import express from "express";
import cors from "cors";
import sequelize from "./db.js";
import { Order, OrderItem } from "./models/OrderRelations.js";
import Product from "./models/Product.js";
import Customer from "./models/Customer.js";
import Admin from "./models/Admin.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Umgebungsvariablen aus der .env-Datei laden
dotenv.config();

// Dateipfad und Upload-Ordner bestimmen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

// Upload-Ordner erstellen, falls er nicht existiert
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Speicherort und Dateinamen für Bilder festlegen
const storage = multer.diskStorage({
    // Zielordner für hochgeladene Bilder festlegen
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },

    // Eindeutigen Dateinamen erzeugen
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        // Dateiendung aus dem ursprünglichen Dateinamen übernehmen
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName + extension);
    }
});

// Upload-Einstellungen festlegen
const upload = multer({
    storage,

    // Maximale Dateigröße auf 5 MB begrenzen
    limits: {
        fileSize: 5 * 1024 * 1024
    },

    // Nur Dateien akzeptieren, die als Bilder erkannt werden
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Nur Bilddateien sind erlaubt."));
        }
    }
});

// Express-Server konfigurieren
const app = express();
const IP = "127.0.0.1";
const PORT = 3000;

// CORS konfigurieren: Anfragen vom lokalen Frontend erlauben
app.use(cors({
    origin: "http://localhost:5173"
}));

// JSON-Daten aus Request-Bodys lesen
app.use(express.json());

/**
 * Middleware zur Überprüfung des Admin-Tokens
 */
function verifyAdmin(req, res, next) {
    // Authorization-Header aus der Anfrage lesen
    const authHeader = req.headers.authorization;

    // Prüfen, ob ein Bearer-Token vorhanden ist
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Bitte melden Sie sich als Admin an.",
        });
    }

    // Token aus dem Header extrahieren
    const token = authHeader.split(" ")[1];

    try {
        // Token mit dem geheimen Schlüssel überprüfen
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Prüfen, ob das Token zu einem Administrator gehört
        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "Keine Berechtigung.",
            });
        }

        // Dekodierte Admin-Daten für die nächste Middleware speichern
        req.admin = decoded;

        // Anfrage an die nächste Middleware oder Route weitergeben
        next();
    } catch (error) {
        // Ungültige oder abgelaufene Tokens ablehnen
        return res.status(401).json({
            message: "Token ist ungültig oder abgelaufen.",
        });
    }
}

// Hochgeladene Bilder im Browser verfügbar machen
app.use("/uploads", express.static(uploadsDir));

// Startseite des Backends
app.get("/", (req, res) => {
    res.send("Willkommen bei unserem alfaShop");
});

// Datenbankverbindung prüfen
app.get("/api/health", async (req, res) => {
    try {
        // Verbindung zur Datenbank testen
        await sequelize.authenticate();

        res.json({
            status: "OK",
            message: "Server und Datenbank funktionieren."
        });
    } catch (err) {
        console.error("Fehler bei der Datenbankverbindung:", err);

        res.status(500).json({
            status: "ERROR",
            message: "Datenbankverbindung fehlgeschlagen."
        });
    }
});

// Alle Produkte abrufen
app.get("/api/products", async (req, res) => {
    try {
        // Alle Produkte aus der Datenbank lesen
        const products = await Product.findAll();

        res.json(products);
    } catch (err) {
        console.error("Fehler beim Laden der Produkte:", err);

        res.status(500).json({
            message: "Fehler beim Laden der Produkte."
        });
    }
});

// Neues Produkt erstellen – nur für Admins
app.post("/api/products", verifyAdmin, async (req, res) => {
    try {
        // Produktdaten aus dem Request-Body lesen
        const {
            name,
            description,
            price,
            stock,
            category,
            imageUrl
        } = req.body;

        // Pflichtfelder und Zahlenwerte überprüfen
        if (
            typeof name !== "string" ||
            name.trim() === "" ||
            price === undefined ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            stock === undefined ||
            stock === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: "Bitte überprüfen Sie Ihre Eingaben."
            });
        }

        // Neues Produkt in der Datenbank speichern
        const product = await Product.create({
            name: name.trim(),
            description: description || null,
            price: Number(price),
            stock: Number(stock),
            category: category || null,
            imageUrl: imageUrl || null
        });

        res.status(201).json({
            message: "Produkt erfolgreich hinzugefügt.",
            product
        });
    } catch (err) {
        console.error("Fehler beim Erstellen des Produkts:", err);

        res.status(500).json({
            message: "Fehler beim Erstellen des Produkts."
        });
    }
});

// Admin-Anmeldung
app.post("/api/admin/login", async (req, res) => {
    try {
        // Benutzername und Passwort auslesen
        const { username, password } = req.body;

        // Prüfen, ob beide Felder ausgefüllt sind
        if (!username || !password) {
            return res.status(400).json({
                message: "Bitte Benutzername und Passwort eingeben.",
            });
        }

        // Prüfen, ob der geheime JWT-Schlüssel konfiguriert ist
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET fehlt in der .env-Datei.");

            return res.status(500).json({
                message: "Serverkonfiguration ist unvollständig.",
            });
        }

        // Administrator anhand des Benutzernamens suchen
        const admin = await Admin.findOne({
            where: { username },
        });

        // Allgemeine Fehlermeldung bei falschen Zugangsdaten
        if (!admin) {
            return res.status(401).json({
                message: "Benutzername oder Passwort ist falsch.",
            });
        }

        // Eingegebenes Passwort mit dem gespeicherten Hash vergleichen
        const passwordIsValid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Benutzername oder Passwort ist falsch.",
            });
        }

        // JWT für den angemeldeten Administrator erstellen
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                role: "admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        return res.status(200).json({
            message: "Anmeldung erfolgreich.",
            username: admin.username,
            token,
        });
    } catch (error) {
        console.error("Login-Fehler:", error);

        return res.status(500).json({
            message: "Interner Serverfehler.",
        });
    }
});

// Kundenkonto registrieren
app.post("/api/customers/register", async (req, res) => {
    try {
        // Registrierungsdaten aus dem Request-Body lesen
        const { name, email, password } = req.body;

        // Pflichtfelder überprüfen
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Bitte füllen Sie alle Pflichtfelder aus.",
            });
        }

        // E-Mail vereinheitlichen
        const normalizedEmail = email.trim().toLowerCase();

        // E-Mail-Format überprüfen
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
            });
        }

        // Mindestlänge des Passworts überprüfen
        if (password.length < 8) {
            return res.status(400).json({
                message: "Das Passwort muss mindestens 8 Zeichen lang sein.",
            });
        }

        // Prüfen, ob die E-Mail bereits registriert ist
        const existingCustomer = await Customer.findOne({
            where: { email: normalizedEmail },
        });

        if (existingCustomer) {
            return res.status(409).json({
                message: "Diese E-Mail-Adresse ist bereits registriert.",
            });
        }

        // Passwort sicher hashen
        const passwordHash = await bcrypt.hash(password, 12);

        // Kundenkonto erstellen
        const customer = await Customer.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
        });

        // Nur öffentliche Kundendaten zurückgeben
        return res.status(201).json({
            message: "Ihr Kundenkonto wurde erfolgreich erstellt.",
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
            },
        });
    } catch (error) {
        console.error("Fehler bei der Kundenregistrierung:", error);

        // Doppelte E-Mail auch bei parallelen Anfragen abfangen
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                message: "Diese E-Mail-Adresse ist bereits registriert.",
            });
        }

        // Validierungsfehler verständlich zurückgeben
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                message: "Bitte überprüfen Sie Ihre Eingaben.",
            });
        }

        return res.status(500).json({
            message: "Die Registrierung ist fehlgeschlagen.",
        });
    }
});

// Kundenanmeldung
app.post("/api/customers/login", async (req, res) => {
    try {
        // E-Mail und Passwort auslesen
        const { email, password } = req.body;

        // Pflichtfelder überprüfen
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Bitte geben Sie E-Mail und Passwort ein.",
            });
        }

        // E-Mail vereinheitlichen
        const normalizedEmail = email.trim().toLowerCase();

        // Kundenkonto anhand der E-Mail suchen
        const customer = await Customer.findOne({
            where: { email: normalizedEmail },
        });

        if (!customer) {
            return res.status(401).json({
                message: "E-Mail-Adresse oder Passwort ist falsch.",
            });
        }

        // Eingegebenes Passwort mit dem gespeicherten Hash vergleichen
        const passwordIsValid = await bcrypt.compare(
            password,
            customer.passwordHash
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "E-Mail-Adresse oder Passwort ist falsch.",
            });
        }

        // JWT für den angemeldeten Kunden erstellen
        const token = jwt.sign(
            {
                customerId: customer.id,
                role: "customer",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        // Token und öffentliche Kundendaten zurückgeben
        return res.status(200).json({
            message: "Anmeldung erfolgreich.",
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
            },
        });
    } catch (error) {
        console.error("Fehler beim Kunden-Login:", error);

        return res.status(500).json({
            message: "Die Anmeldung ist fehlgeschlagen.",
        });
    }
});

// Produkt bearbeiten – nur für Admins
app.put("/api/products/:id", verifyAdmin, async (req, res) => {
    try {
        // Produkt-ID und neue Daten auslesen
        const { id } = req.params;
        const {
            name,
            description,
            price,
            stock,
            category,
            imageUrl,
        } = req.body;

        // Produkt anhand der ID suchen
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: "Produkt wurde nicht gefunden.",
            });
        }

        // Pflichtfelder und Zahlenwerte überprüfen
        if (
            typeof name !== "string" ||
            name.trim() === "" ||
            price === undefined ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            stock === undefined ||
            stock === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: "Bitte überprüfen Sie Ihre Eingaben.",
            });
        }

        // Produktdaten aktualisieren
        await product.update({
            name: name.trim(),
            description: description || null,
            price: Number(price),
            stock: Number(stock),
            category: category || null,
            imageUrl: imageUrl ?? product.imageUrl,
        });

        res.json({
            message: "Produkt erfolgreich aktualisiert.",
            product,
        });
    } catch (err) {
        console.error("Fehler beim Bearbeiten des Produkts:", err);

        res.status(500).json({
            message: "Produkt konnte nicht bearbeitet werden.",
        });
    }
});

// Produkt löschen – nur für Admins
app.delete("/api/products/:id", verifyAdmin, async (req, res) => {
    try {
        // Produkt-ID aus der URL lesen
        const { id } = req.params;

        // Produkt suchen
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: "Produkt wurde nicht gefunden.",
            });
        }

        // Produkt aus der Datenbank löschen
        await product.destroy();

        res.json({
            message: "Produkt erfolgreich gelöscht.",
        });
    } catch (err) {
        console.error("Fehler beim Löschen des Produkts:", err);

        res.status(500).json({
            message: "Produkt konnte nicht gelöscht werden.",
        });
    }
});

// Bestellung löschen – nur für Admins
app.delete("/api/orders/:id", verifyAdmin, async (req, res) => {
    // Datenbanktransaktion starten
    const transaction = await sequelize.transaction();

    try {
        // Bestellnummer aus der URL lesen
        const orderId = Number(req.params.id);

        // Bestellnummer überprüfen
        if (!Number.isInteger(orderId) || orderId <= 0) {
            await transaction.rollback();

            return res.status(400).json({
                message: "Ungültige Bestellnummer."
            });
        }

        // Bestellung innerhalb der Transaktion suchen
        const order = await Order.findByPk(orderId, { transaction });

        if (!order) {
            await transaction.rollback();

            return res.status(404).json({
                message: "Bestellung wurde nicht gefunden."
            });
        }

        // Zuerst die Positionen der Bestellung löschen
        await OrderItem.destroy({
            where: { orderId },
            transaction
        });

        // Danach die Bestellung löschen
        await order.destroy({ transaction });

        // Änderungen dauerhaft übernehmen
        await transaction.commit();

        return res.json({
            message: "Bestellung erfolgreich gelöscht."
        });
    } catch (error) {
        // Bei einem Fehler alle Änderungen zurücknehmen
        await transaction.rollback();

        console.error("Fehler beim Löschen der Bestellung:", error);

        return res.status(500).json({
            message: "Bestellung konnte nicht gelöscht werden."
        });
    }
});

// Produktbild hochladen – nur für Admins
app.post("/api/upload", verifyAdmin, (req, res, next) => {
    // Upload ausführen und mögliche Fehler abfangen
    upload.single("image")(req, res, (err) => {
        if (err) {
            // Fehler von Multer behandeln
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message:
                        err.code === "LIMIT_FILE_SIZE"
                            ? "Das Bild darf maximal 5 MB groß sein."
                            : "Fehler beim Hochladen der Datei.",
                    error: err.message
                });
            }

            // Andere Upload-Fehler zurückgeben
            return res.status(400).json({
                message: err.message || "Fehler beim Hochladen des Bildes."
            });
        }

        // Anfrage nach erfolgreichem Upload weitergeben
        next();
    });
}, (req, res) => {
    // Prüfen, ob eine Datei hochgeladen wurde
    if (!req.file) {
        return res.status(400).json({
            message: "Bitte wählen Sie ein Bild aus."
        });
    }

    // Relativen Pfad zum hochgeladenen Bild zurückgeben
    res.status(201).json({
        message: "Bild erfolgreich hochgeladen.",
        imageUrl: `/uploads/${req.file.filename}`
    });
});

// Bestellungen des angemeldeten Kunden abrufen
app.get("/api/customer/orders", async (req, res) => {
    try {
        // Authorization-Header auslesen
        const authHeader = req.headers.authorization;

        // Token verlangen
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Bitte melden Sie sich an."
            });
        }

        // Token aus dem Header extrahieren
        const token = authHeader.slice(7);

        let decoded;

        try {
            // Token überprüfen
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                message: "Ihre Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an."
            });
        }

        // Rolle und Kunden-ID überprüfen
        if (
            decoded.role !== "customer" ||
            !Number.isInteger(decoded.customerId)
        ) {
            return res.status(403).json({
                message: "Zugriff verweigert."
            });
        }

        // Nur Bestellungen dieses Kunden abrufen
        const orders = await Order.findAll({
            where: {
                customerId: decoded.customerId
            },
            include: [
                {
                    model: OrderItem
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json(orders);
    } catch (error) {
        console.error(
            "Fehler beim Laden der Kundenbestellungen:",
            error
        );

        return res.status(500).json({
            message: "Bestellungen konnten nicht geladen werden."
        });
    }
});

// Neue Bestellung erstellen
app.post("/api/orders", async (req, res) => {
    // Kundendaten aus dem Request-Body lesen
    const {
        customerName,
        customerEmail,
        street,
        postalCode,
        city,
        items
    } = req.body;

    // Kundendaten überprüfen
    if (
        typeof customerName !== "string" || !customerName.trim() ||
        typeof customerEmail !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
        typeof street !== "string" || !street.trim() ||
        typeof postalCode !== "string" || !postalCode.trim() ||
        typeof city !== "string" || !city.trim()
    ) {
        return res.status(400).json({
            message: "Bitte überprüfen Sie Ihre Kundendaten."
        });
    }

    // Warenkorb überprüfen
    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        !items.every(item =>
            Number.isInteger(Number(item.productId)) &&
            Number(item.productId) > 0 &&
            Number.isInteger(Number(item.quantity)) &&
            Number(item.quantity) > 0
        )
    ) {
        return res.status(400).json({
            message: "Der Warenkorb ist leer oder ungültig."
        });
    }

    // Doppelte Produkte im Warenkorb zusammenfassen
    const quantities = new Map();

    for (const item of items) {
        const id = Number(item.productId);
        const quantity = Number(item.quantity);

        quantities.set(
            id,
            (quantities.get(id) || 0) + quantity
        );
    }

    // Warenkorb in ein Array umwandeln
    const cartItems = Array.from(quantities, ([productId, quantity]) => ({
        productId,
        quantity
    }));

    // Optionales Kundenkonto überprüfen
    let customerId = null;

    const authHeader = req.headers.authorization;

    // Ohne Token ist eine Gastbestellung erlaubt
    if (authHeader) {
        // Bearer-Token aus dem Header extrahieren
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({
                message: "Ungültiger Anmeldetoken."
            });
        }

        try {
            // Token überprüfen
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // Prüfen, ob das Token zu einem Kunden gehört
            if (
                decoded.role !== "customer" ||
                !Number.isInteger(decoded.customerId)
            ) {
                return res.status(403).json({
                    message: "Kein gültiges Kundenkonto."
                });
            }

            // Kundenkonto in der Datenbank suchen
            const customer = await Customer.findByPk(
                decoded.customerId
            );

            if (!customer) {
                return res.status(401).json({
                    message: "Kundenkonto nicht gefunden."
                });
            }

            customerId = customer.id;
        } catch (err) {
            return res.status(401).json({
                message: "Anmeldung abgelaufen. Bitte erneut anmelden."
            });
        }
    }

    // Datenbanktransaktion für die Bestellung starten
    const transaction = await sequelize.transaction();

    try {
        // Produkt-IDs aus dem Warenkorb ermitteln
        const productIds = cartItems.map(item => item.productId);

        // Produkte aus der Datenbank laden
        const products = await Product.findAll({
            where: { id: productIds },
            transaction
        });

        // Prüfen, ob alle Produkte existieren
        if (products.length !== productIds.length) {
            await transaction.rollback();

            return res.status(400).json({
                message: "Mindestens ein Produkt wurde nicht gefunden."
            });
        }

        // Produkte für einen schnellen Zugriff nach ID speichern
        const productMap = new Map(
            products.map(product => [Number(product.id), product])
        );

        let totalCents = 0;

        // Preise und Lagerbestand aus der Datenbank verwenden
        for (const item of cartItems) {
            const product = productMap.get(item.productId);

            // Prüfen, ob genügend Produkte auf Lager sind
            if (product.stock < item.quantity) {
                await transaction.rollback();

                return res.status(400).json({
                    message:
                        `Nicht genügend Lagerbestand für ${product.name}.`
                });
            }

            // Preis in Cent umrechnen, um Rundungsfehler zu reduzieren
            const priceCents = Math.round(Number(product.price) * 100);

            // Gesamtbetrag berechnen
            totalCents += priceCents * item.quantity;
        }

        // Bestellung in der Datenbank speichern
        const order = await Order.create({
            customerId: customerId,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            street: street.trim(),
            postalCode: postalCode.trim(),
            city: city.trim(),
            totalAmount: (totalCents / 100).toFixed(2),
            status: "Neu"
        }, { transaction });

        // Bestellpositionen speichern und Lagerbestand reduzieren
        for (const item of cartItems) {
            const product = productMap.get(item.productId);

            // Produktdaten zum Zeitpunkt der Bestellung speichern
            await OrderItem.create({
                orderId: order.id,
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                price: (Math.round(Number(product.price) * 100) / 100)
                    .toFixed(2)
            }, { transaction });

            // Verfügbaren Lagerbestand reduzieren
            product.stock -= item.quantity;
            await product.save({ transaction });
        }

        // Alle Änderungen gemeinsam übernehmen
        await transaction.commit();

        return res.status(201).json({
            message: "Bestellung erfolgreich gespeichert.",
            order
        });
    } catch (err) {
        // Bei einem Fehler Änderungen zurücknehmen
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error("Fehler beim Erstellen der Bestellung:", err);

        return res.status(500).json({
            message: "Bestellung konnte nicht gespeichert werden."
        });
    }
});

// Alle Bestellungen für Admin abrufen
app.get("/api/orders", verifyAdmin, async (req, res) => {
    try {
        // Bestellungen zusammen mit ihren Positionen laden
        const orders = await Order.findAll({
            include: [{
                model: OrderItem
            }],
            order: [["createdAt", "DESC"]]
        });

        return res.json(orders);
    } catch (err) {
        console.error("Fehler beim Laden der Bestellungen:", err);

        return res.status(500).json({
            message: "Bestellungen konnten nicht geladen werden."
        });
    }
});

// Bestellstatus aktualisieren – nur für Admins
app.patch("/api/orders/:id/status", verifyAdmin, async (req, res) => {
    try {
        // Bestellnummer und neuen Status auslesen
        const orderId = Number(req.params.id);
        const { status } = req.body;

        // Bestellnummer überprüfen
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Ungültige Bestellnummer."
            });
        }

        // Erlaubte Bestellstatus festlegen
        const allowedStatuses = [
            "Neu",
            "In Bearbeitung",
            "Versendet",
            "Abgeschlossen",
            "Storniert"
        ];

        // Prüfen, ob der Status erlaubt ist
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Ungültiger Bestellstatus."
            });
        }

        // Bestellung suchen
        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Bestellung wurde nicht gefunden."
            });
        }

        // Bestellstatus aktualisieren
        await order.update({ status });

        return res.json({
            message: "Bestellstatus erfolgreich aktualisiert.",
            order
        });
    } catch (error) {
        console.error(
            "Fehler beim Aktualisieren des Bestellstatus:",
            error
        );

        return res.status(500).json({
            message: "Bestellstatus konnte nicht aktualisiert werden."
        });
    }
});

// Server starten und Datenbank vorbereiten
async function startServer() {
    try {
        // Verbindung zur Datenbank prüfen
        await sequelize.authenticate();
        console.log("Datenbankverbindung erfolgreich.");

        // Datenbanktabellen synchronisieren
        await sequelize.sync();
        console.log("Datenbank und Tabellen sind bereit.");

        // Server starten und auf Anfragen warten
        app.listen(PORT, IP, () => {
            console.log(`Server läuft unter http://${IP}:${PORT}`);
        });
    } catch (err) {
        console.error("Fehler beim Starten des Servers:", err);
        process.exit(1);
    }
}

// Serverstart ausführen
startServer();