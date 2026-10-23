import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Bestellmodell erstellen
const Order = sequelize.define("Order", {
    // Kundenname
    customerName: {
        type: DataTypes.STRING, // Text speichern
        allowNull: false // Kundenname ist erforderlich
    },

    // E-Mail-Adresse des Kunden
    customerEmail: {
        type: DataTypes.STRING, // E-Mail als Text speichern
        allowNull: false // E-Mail-Adresse ist erforderlich
    },

    // Straße und Hausnummer der Lieferadresse
    street: {
        type: DataTypes.STRING, // Adresse als Text speichern
        allowNull: false // Straße und Hausnummer sind erforderlich
    },

    // Postleitzahl der Lieferadresse
    postalCode: {
        type: DataTypes.STRING, // Als Text speichern, damit führende Nullen erhalten bleiben
        allowNull: false // Postleitzahl ist erforderlich
    },

    // Stadt der Lieferadresse
    city: {
        type: DataTypes.STRING, // Stadt als Text speichern
        allowNull: false // Stadt ist erforderlich
    },

    // Gesamtbetrag der Bestellung
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2), // Betrag mit zwei Nachkommastellen speichern
        allowNull: false // Gesamtbetrag ist erforderlich
    },

    // Aktueller Status der Bestellung
    status: {
        type: DataTypes.STRING, // Status als Text speichern
        allowNull: false, // Status ist erforderlich
        defaultValue: "Neu" // Neue Bestellungen erhalten standardmäßig den Status "Neu"
    },

    // Verknüpfung mit dem Kundenkonto (optional)
    customerId: {
        type: DataTypes.INTEGER, // ID des Kunden speichern
        allowNull: true // Gastbestellungen sind ebenfalls möglich
    },
});

// Modell exportieren, damit es in anderen Dateien verwendet werden kann
export default Order;