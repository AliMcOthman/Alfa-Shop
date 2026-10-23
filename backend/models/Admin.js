import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Modell für Administratoren erstellen
const Admin = sequelize.define("Admin", {
    // Benutzername des Administrators
    username: {
        type: DataTypes.STRING, // Text speichern
        allowNull: false, // Benutzername ist erforderlich
        unique: true, // Jeder Benutzername darf nur einmal vorkommen
    },

    // Passwort des Administrators
    password: {
        type: DataTypes.STRING, // Passwort als Text speichern
        allowNull: false, // Passwort ist erforderlich
    },
});

// Modell exportieren, damit es in anderen Dateien verwendet werden kann
export default Admin;