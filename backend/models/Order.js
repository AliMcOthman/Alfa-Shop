
import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Bestellmodell erstellen
const Order = sequelize.define("Order", {
    // Kundenname
    customerName: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // E-Mail-Adresse
    customerEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Straße und Hausnummer
    street: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Postleitzahl
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Stadt
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Gesamtbetrag der Bestellung
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    // Bestellstatus
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Neu"
    },
    // Verknüpfung mit dem Kundenkonto (optional)
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
});

export default Order;
