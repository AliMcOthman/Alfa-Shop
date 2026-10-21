
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Bestellposition erstellen
const OrderItem = sequelize.define("OrderItem", {
    // Anzahl der bestellten Produkte
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // Produktpreis zum Zeitpunkt der Bestellung
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    // Produktname zum Zeitpunkt der Bestellung
    productName: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default OrderItem;
