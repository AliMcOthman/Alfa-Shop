import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Bestellposition erstellen
const OrderItem = sequelize.define("OrderItem", {
    // Anzahl der bestellten Produkte
    quantity: {
        type: DataTypes.INTEGER, // Ganze Zahl speichern
        allowNull: false // Menge ist erforderlich
    },

    // Produktpreis zum Zeitpunkt der Bestellung
    price: {
        type: DataTypes.DECIMAL(10, 2), // Preis mit zwei Nachkommastellen speichern
        allowNull: false // Preis ist erforderlich
    },

    // Produktname zum Zeitpunkt der Bestellung
    productName: {
        type: DataTypes.STRING, // Produktname als Text speichern
        allowNull: false // Produktname ist erforderlich
    }
});

// Modell exportieren, damit es in anderen Dateien verwendet werden kann
export default OrderItem;