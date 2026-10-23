import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Produktmodell erstellen
const Product = sequelize.define("Product", {
    // Produktname
    name: {
        type: DataTypes.STRING, // Text speichern
        allowNull: false // Produktname ist erforderlich
    },

    // Produktbeschreibung
    description: {
        type: DataTypes.TEXT, // Längeren Text speichern
        allowNull: true // Beschreibung ist optional
    },

    // Produktpreis
    price: {
        type: DataTypes.FLOAT, // Preis als Zahl speichern
        allowNull: false // Preis ist erforderlich
    },

    // Verfügbarer Lagerbestand
    stock: {
        type: DataTypes.INTEGER, // Ganze Zahl für die verfügbare Menge
        allowNull: false, // Lagerbestand ist erforderlich
        defaultValue: 0 // Standardmäßig sind keine Produkte auf Lager
    },

    // Produktkategorie
    category: {
        type: DataTypes.STRING, // Kategorie als Text speichern
        allowNull: true // Kategorie ist optional
    },

    // Produktbild
    imageUrl: {
        type: DataTypes.STRING, // Bildpfad oder Bild-URL speichern
        allowNull: true // Produktbild ist optional
    }
});

// Modell exportieren, damit es in anderen Dateien verwendet werden kann
export default Product;