import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Kundentabelle erstellen
const Customer = sequelize.define("Customer", {
    // Vollständiger Name des Kunden
    name: {
        type: DataTypes.STRING, // Text speichern
        allowNull: false, // Name ist erforderlich
    },

    // E-Mail-Adresse des Kunden
    email: {
        type: DataTypes.STRING, // E-Mail als Text speichern
        allowNull: false, // E-Mail ist erforderlich
        unique: true, // Jede E-Mail-Adresse darf nur einmal vorkommen
        validate: {
            isEmail: true, // Prüfen, ob die E-Mail-Adresse gültig formatiert ist
        },
    },

    // Gehashter Passwortwert des Kunden
    passwordHash: {
        type: DataTypes.STRING, // Passwort-Hash als Text speichern
        allowNull: false, // Passwort-Hash ist erforderlich
    },
});

// Modell exportieren, damit es in anderen Dateien verwendet werden kann
export default Customer;