import express from "express";
import cors from "cors";
import sequelize from "./db.js";
import Product from "./models/Product.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"
import Admin from "./models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName + extension);
    }
});

// Upload-Einstellungen
const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

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

// Middleware
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());


/**
 * Middleware zur Überprüfung des Admin-Tokens
 */
function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Bitte melden Sie sich als Admin an.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "Keine Berechtigung.",
            });
        }

        req.admin = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token ist ungültig oder abgelaufen.",
        });
    }
}


// Hochgeladene Bilder im Browser verfügbar machen
app.use("/uploads", express.static(uploadsDir));

// Startseite
app.get("/", (req, res) => {
    res.send("Willkommen bei unserem alfaShop");
});

// Datenbankverbindung prüfen
app.get("/api/health", async (req, res) => {
    try {
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
        const products = await Product.findAll();

        res.json(products);
    } catch (err) {
        console.error("Fehler beim Laden der Produkte:", err);

        res.status(500).json({
            message: "Fehler beim Laden der Produkte."
        });
    }
});


// Neues Produkt erstellen
app.post("/api/products", verifyAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            category,
            imageUrl
        } = req.body;

        // Eingaben überprüfen
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

        // Produkt in der Datenbank speichern
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


app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Bitte Benutzername und Passwort eingeben.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET fehlt in der .env-Datei.");

            return res.status(500).json({
                message: "Serverkonfiguration ist unvollständig.",
            });
        }

        const admin = await Admin.findOne({
            where: { username },
        });

        if (!admin) {
            return res.status(401).json({
                message: "Benutzername oder Passwort ist falsch.",
            });
        }

        const passwordIsValid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "Benutzername oder Passwort ist falsch.",
            });
        }

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

/* Produkt bearbeiten */
app.put("/api/products/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            stock,
            category,
            imageUrl,
        } = req.body;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: "Produkt wurde nicht gefunden.",
            });
        }

        // Eingaben überprüfen
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
/* Produkt löschen */
app.delete("/api/products/:id",verifyAdmin , async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: "Produkt wurde nicht gefunden.",
            });
        }

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
// Produktbild hochladen
app.post("/api/upload", verifyAdmin ,(req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message:
                        err.code === "LIMIT_FILE_SIZE"
                            ? "Das Bild darf maximal 5 MB groß sein."
                            : "Fehler beim Hochladen der Datei.",
                    error: err.message
                });
            }

            return res.status(400).json({
                message: err.message || "Fehler beim Hochladen des Bildes."
            });
        }

        next();
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Bitte wählen Sie ein Bild aus."
        });
    }

    res.status(201).json({
        message: "Bild erfolgreich hochgeladen.",
        imageUrl: `/uploads/${req.file.filename}`
    });
});

// Server starten und Datenbank vorbereiten
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("Datenbankverbindung erfolgreich.");

        await sequelize.sync();
        console.log("Datenbank und Tabellen sind bereit.");

        app.listen(PORT, IP, () => {
            console.log(`Server läuft unter http://${IP}:${PORT}`);
        });
    } catch (err) {
        console.error("Fehler beim Starten des Servers:", err);
        process.exit(1);
    }
}

startServer();
