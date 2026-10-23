import bcrypt from "bcryptjs";
import sequelize from "./db.js";
import Admin from "./models/Admin.js";

// Funktion zum Erstellen eines Administrators
async function createAdmin() {
    try {
        // Verbindung zur Datenbank überprüfen
        await sequelize.authenticate();

        // Datenbanktabellen synchronisieren
        await sequelize.sync();

        // Zugangsdaten für den Administrator festlegen
        const username = "Admin";
        const password = "Ali123";

        // Prüfen, ob der Administrator bereits existiert
        const existAdmin = await Admin.findOne({
            where: { username },
        });

        // Wenn der Administrator bereits existiert, wird kein neuer erstellt
        if (existAdmin) {
            console.log("Admin existiert bereits.");
            return;
        }

        // Passwort mit bcrypt und 12 Salt-Runden hashen
        const hashedPassword = await bcrypt.hash(password, 12);

        // Administrator mit gehashtem Passwort in der Datenbank speichern
        await Admin.create({
            username,
            password: hashedPassword
        });

        // Erfolgsmeldungen in der Konsole ausgeben
        console.log("Admin wurde erfolgreich erstellt.");
        console.log("Benutzername:", username);
        console.log("Bitte ändern Sie das Beispielpasswort vor der Verwendung.");

    } catch (error) {
        // Fehler beim Erstellen des Administrators ausgeben
        console.error("Fehler beim Erstellen des Admins:", error);

    } finally {
        // Datenbankverbindung am Ende schließen
        await sequelize.close();
    }
}

// Funktion ausführen
createAdmin();